import { useState, useMemo } from 'react'
import { icons } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

// Curated list of commonly useful icons for categories — organized by type
const POPULAR_ICONS = [
  // Food & Drink
  'utensils', 'drumstick', 'beef', 'ham', 'egg', 'egg-fried', 'sandwich', 'hamburger',
  'pizza', 'soup', 'salad', 'popcorn', 'croissant', 'cookie', 'cake', 'cake-slice',
  'donut', 'candy', 'ice-cream-cone', 'ice-cream-bowl',
  'carrot', 'banana', 'cherry', 'grape', 'citrus', 'apple', 'wheat', 'leafy-green', 'bean', 'nut',
  'coffee', 'cup-soda', 'glass-water', 'milk', 'wine', 'beer', 'bottle-wine',
  // Services & Beauty
  'scissors', 'brush', 'paintbrush', 'paint-bucket', 'paint-roller', 'spray-can',
  'palette', 'hand', 'hand-platter', 'hand-heart', 'hand-coins',
  'washing-machine', 'shirt', 'iron',
  'gem', 'ring', 'crown', 'sparkles',
  'stethoscope', 'syringe', 'pill', 'baby',
  // Transport & Travel
  'car', 'bus', 'train-front', 'truck', 'bike', 'motorbike', 'ambulance', 'tractor',
  'plane', 'ship', 'rocket', 'cable-car',
  // Venues & Buildings
  'building-2', 'hotel', 'church', 'school', 'store', 'warehouse',
  'home', 'tent', 'castle', 'landmark',
  // Events & Entertainment
  'party-popper', 'gift', 'music', 'mic', 'headphones', 'speaker', 'tv', 'gamepad-2',
  'camera', 'clapperboard', 'drama', 'trophy', 'medal', 'award',
  'heart', 'star', 'sun', 'moon', 'flower-2', 'trees',
  // Sports & Fitness
  'dumbbell', 'football', 'tennis-ball',
  // Tools & Work
  'wrench', 'hammer', 'drill', 'briefcase', 'graduation-cap', 'book-open',
  // General
  'users', 'phone', 'map-pin', 'globe', 'package', 'shopping-cart',
  'leaf', 'droplets', 'flame', 'zap', 'shield', 'clock',
]

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  label?: string
}

export function IconPicker({ value, onChange, label = 'Icon' }: IconPickerProps) {
  const [search, setSearch] = useState('')

  // Get all available icon names from lucide-react
  const allIconNames = useMemo(() => Object.keys(icons), [])

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search.trim()) return POPULAR_ICONS.filter(name => name in icons)
    const q = search.toLowerCase()
    return allIconNames.filter(name => name.toLowerCase().includes(q)).slice(0, 80)
  }, [search, allIconNames])

  // Render a single icon by name
  const renderIcon = (name: string) => {
    const IconComponent = icons[name as keyof typeof icons]
    if (!IconComponent) return null
    return <IconComponent size={20} />
  }

  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <div className='flex items-center gap-2'>
        <div className='flex h-10 w-10 items-center justify-center rounded-lg border bg-primary/10 text-primary shrink-0'>
          {renderIcon(value) || <span className='text-xs'>{value}</span>}
        </div>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Search icons...'
        />
      </div>
      <p className='text-xs text-muted-foreground'>
        Selected: <span className='font-medium'>{value}</span>
        {!search && ' — Type to search all Lucide icons'}
      </p>
      <ScrollArea className='h-[200px] rounded-md border p-2'>
        <div className='grid grid-cols-8 gap-1'>
          {filteredIcons.map(name => (
            <button
              key={name}
              type='button'
              onClick={() => { onChange(name); setSearch('') }}
              className={`h-9 w-9 rounded-md flex items-center justify-center transition-colors ${
                value === name
                  ? 'border-2 border-primary bg-primary/10 text-primary'
                  : 'border border-transparent hover:bg-muted hover:border-border'
              }`}
              title={name}
            >
              {renderIcon(name)}
            </button>
          ))}
          {filteredIcons.length === 0 && (
            <p className='col-span-8 text-center text-sm text-muted-foreground py-4'>No icons found for "{search}"</p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
