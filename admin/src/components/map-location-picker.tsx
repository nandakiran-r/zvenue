import { Component, type ErrorInfo, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { reverseGeocode, searchAddress, type MapplsAutosuggestResult } from '@/lib/mappls'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface MapLocationPickerProps {
  latitude: number | null
  longitude: number | null
  location: string
  city: string
  onCoordinatesChange: (lat: number | null, lng: number | null) => void
  onLocationChange: (location: string) => void
  onCityChange: (city: string) => void
  disabled?: boolean
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]
const DEFAULT_ZOOM = 5
const MARKER_ZOOM = 16

/**
 * Handles map click events to place/move the marker.
 */
function MapClickHandler({
  onPositionChange,
  disabled,
}: {
  onPositionChange: (lat: number, lng: number) => void
  disabled?: boolean
}) {
  useMapEvents({
    click(e) {
      if (disabled) return
      onPositionChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/**
 * Recenter the map when coordinates change externally.
 */
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  map.setView([lat, lng], MARKER_ZOOM)
  return null
}

/**
 * Error boundary that catches Leaflet rendering failures.
 */
class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MapLocationPicker error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Map unavailable — enter address manually.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Address search input with debounced Mappls autosuggest.
 */
function AddressSearch({
  onResultSelect,
  disabled,
}: {
  onResultSelect: (result: MapplsAutosuggestResult) => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MapplsAutosuggestResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim().length < 3) {
      setResults([])
      setShowDropdown(false)
      setNoResults(false)
      return
    }

    // Detect coordinate format: "lat, lng" (e.g., "16.820, 74.646")
    const coordMatch = query.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/)
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1])
      const lng = parseFloat(coordMatch[2])
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setResults([{
          eLoc: 'coords',
          placeName: `📍 Go to ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          placeAddress: '',
          latitude: lat,
          longitude: lng,
          type: 'coordinate',
          orderIndex: 0,
        }])
        setShowDropdown(true)
        setNoResults(false)
        return
      }
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      setNoResults(false)
      try {
        const searchResults = await searchAddress(query.trim())
        setResults(searchResults)
        setShowDropdown(true)
        setNoResults(searchResults.length === 0)
      } catch {
        setResults([])
        setShowDropdown(true)
        setNoResults(true)
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleSelect = (result: MapplsAutosuggestResult) => {
    setQuery(result.placeName + (result.placeAddress ? ', ' + result.placeAddress : ''))
    setShowDropdown(false)
    setResults([])
    setNoResults(false)
    onResultSelect(result)
  }

  return (
    <div className="relative mb-2">
      <Label htmlFor="address-search" className="mb-1">
        Search address
      </Label>
      <Input
        id="address-search"
        type="text"
        placeholder="Search city/area or paste coordinates (16.820, 74.646)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        onFocus={() => {
          if (results.length > 0 || noResults) setShowDropdown(true)
        }}
        onBlur={() => {
          // Delay to allow click on dropdown items
          setTimeout(() => setShowDropdown(false), 200)
        }}
      />
      {isSearching && (
        <p className="mt-1 text-xs text-muted-foreground">Searching...</p>
      )}
      {showDropdown && (
        <div className="absolute z-[1000] mt-1 w-full rounded-md border bg-background shadow-md">
          {noResults && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No results found
            </p>
          )}
          {results.slice(0, 5).map((result, idx) => (
            <button
              key={result.eLoc || idx}
              type="button"
              className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(result)}
            >
              <span className="font-medium">{result.placeName}</span>
              {result.placeAddress && (
                <span className="text-muted-foreground ml-1 text-xs">— {result.placeAddress}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Coordinate display and manual editing section.
 * Always editable — supports pasting "lat, lng" format directly.
 */
function CoordinateEditor({
  latitude,
  longitude,
  onManualCoordinatesConfirm,
  disabled,
}: {
  latitude: number | null
  longitude: number | null
  onManualCoordinatesConfirm: (lat: number, lng: number) => void
  disabled?: boolean
}) {
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Sync display values when coordinates change externally (map click/drag/search)
  useEffect(() => {
    setLatInput(latitude !== null ? latitude.toFixed(6) : '')
    setLngInput(longitude !== null ? longitude.toFixed(6) : '')
    setError(null)
  }, [latitude, longitude])

  // Detect "lat, lng" paste format and auto-split
  const handleLatChange = (value: string) => {
    const trimmed = value.trim()
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(s => s.trim())
      if (parts.length === 2) {
        const lat = parseFloat(parts[0])
        const lng = parseFloat(parts[1])
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setLatInput(parts[0])
          setLngInput(parts[1])
          setError(null)
          onManualCoordinatesConfirm(lat, lng)
          return
        }
      }
    }
    setLatInput(value)
  }

  const handleConfirm = () => {
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)

    if (isNaN(lat) || isNaN(lng)) {
      setError('Enter valid numbers, or paste "lat, lng" (e.g. 16.820, 74.646)')
      return
    }
    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90.')
      return
    }
    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180.')
      return
    }

    setError(null)
    onManualCoordinatesConfirm(lat, lng)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <Label className="text-sm font-medium">Coordinates</Label>
      <p className="text-xs text-muted-foreground">Paste "lat, lng" or enter values and press Enter</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="coord-lat" className="mb-1 text-xs text-muted-foreground">
            Latitude
          </Label>
          <Input
            id="coord-lat"
            type="text"
            value={latInput}
            onChange={(e) => handleLatChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="e.g. 16.820"
          />
        </div>
        <div>
          <Label htmlFor="coord-lng" className="mb-1 text-xs text-muted-foreground">
            Longitude
          </Label>
          <Input
            id="coord-lng"
            type="text"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="e.g. 74.646"
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleConfirm}
        disabled={disabled}
      >
        Go to coordinates
      </Button>
    </div>
  )
}

export default function MapLocationPicker({
  latitude,
  longitude,
  onCoordinatesChange,
  onLocationChange,
  onCityChange,
  disabled,
}: MapLocationPickerProps) {
  const hasCoordinates = latitude !== null && longitude !== null
  const center: [number, number] = hasCoordinates
    ? [latitude, longitude]
    : DEFAULT_CENTER
  const zoom = hasCoordinates ? MARKER_ZOOM : DEFAULT_ZOOM

  const handlePositionChange = useCallback(
    async (lat: number, lng: number) => {
      onCoordinatesChange(lat, lng)

      // Trigger reverse geocoding via Mappls
      const result = await reverseGeocode(lat, lng)
      if (result) {
        // Build street address from available parts
        const parts: string[] = []
        if (result.houseNumber) parts.push(result.houseNumber)
        if (result.street) parts.push(result.street)
        if (result.locality) parts.push(result.locality)
        if (result.subLocality) parts.push(result.subLocality)
        const streetAddress = parts.join(', ') || result.area || result.formatted_address
        onLocationChange(streetAddress)

        // City from result
        const cityValue = result.city || result.district || ''
        onCityChange(cityValue)
      }
    },
    [onCoordinatesChange, onLocationChange, onCityChange]
  )

  const handleDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      const marker = e.target as L.Marker
      const position = marker.getLatLng()
      handlePositionChange(position.lat, position.lng)
    },
    [handlePositionChange]
  )

  const handleSearchResultSelect = useCallback(
    (result: MapplsAutosuggestResult) => {
      const lat = result.latitude
      const lng = result.longitude
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        onCoordinatesChange(lat, lng)
        onLocationChange(result.placeAddress || result.placeName)
        // Try to extract city from placeAddress (often format: "Place, Area, City, State")
        const addressParts = (result.placeAddress || '').split(',').map(s => s.trim())
        const cityGuess = addressParts.length >= 3 ? addressParts[addressParts.length - 2] : ''
        onCityChange(cityGuess)
      }
    },
    [onCoordinatesChange, onLocationChange, onCityChange]
  )

  const handleManualCoordinatesConfirm = useCallback(
    (lat: number, lng: number) => {
      onCoordinatesChange(lat, lng)
    },
    [onCoordinatesChange]
  )

  return (
    <MapErrorBoundary>
      <div className="w-full space-y-0">
        {/* Address search - above the map */}
        <AddressSearch
          onResultSelect={handleSearchResultSelect}
          disabled={disabled}
        />

        {/* Map */}
        <div style={{ minHeight: '300px' }}>
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '300px', width: '100%' }}
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler
              onPositionChange={handlePositionChange}
              disabled={disabled}
            />
            {hasCoordinates && (
              <>
                <MapRecenter lat={latitude} lng={longitude} />
                <Marker
                  position={[latitude, longitude]}
                  draggable={!disabled}
                  eventHandlers={{
                    dragend: handleDragEnd,
                  }}
                />
              </>
            )}
          </MapContainer>
        </div>

        {/* Coordinate display and manual editing - below the map */}
        <CoordinateEditor
          latitude={latitude}
          longitude={longitude}
          onManualCoordinatesConfirm={handleManualCoordinatesConfirm}
          disabled={disabled}
        />
      </div>
    </MapErrorBoundary>
  )
}
