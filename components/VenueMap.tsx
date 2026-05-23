import React, { memo } from 'react';
import { StyleSheet, View, Text, Platform, Linking, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Navigation } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface VenueMapProps {
  latitude: number;
  longitude: number;
  name: string;
  height?: number;
  showDirections?: boolean;
}

/**
 * Interactive map using OpenStreetMap via Leaflet in a WebView
 * Works in Expo Go — no native modules needed
 */
function VenueMapComponent({ latitude, longitude, name, height = 200, showDirections = true }: VenueMapProps) {
  if (!latitude || !longitude) return null;

  const openDirections = () => {
    const label = encodeURIComponent(name);
    if (Platform.OS === 'ios') {
      Linking.canOpenURL('comgooglemaps://').then((hasGoogleMaps) => {
        if (hasGoogleMaps) {
          Linking.openURL(`comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`);
        } else {
          Linking.openURL(`maps:0,0?q=${label}@${latitude},${longitude}`);
        }
      });
    } else {
      Linking.openURL(`geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`);
    }
  };

  // Leaflet map rendered in WebView (uses OSM tiles, no API key)
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${latitude}, ${longitude}], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        L.marker([${latitude}, ${longitude}]).addTo(map).bindPopup('${name.replace(/'/g, "\\'")}');
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html: mapHtml }}
        style={styles.map}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
      />
      {showDirections && (
        <TouchableOpacity style={styles.directionsOverlay} onPress={openDirections} activeOpacity={0.8}>
          <Navigation size={16} color={Colors.white} />
          <Text style={styles.directionsText}>Directions</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export const VenueMap = memo(VenueMapComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
    borderRadius: 16,
  },
  directionsOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  directionsText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
