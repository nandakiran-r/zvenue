import { useState, useMemo } from 'react'
import { icons } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

// Curated list of commonly useful icons for categories
const POPULAR_ICONS = [
  'star', 'heart', 'home', 'music', 'camera', 'scissors', 'car', 'plane',
  'utensils', 'coffee', 'wine', 'beer', 'cake', 'pizza', 'apple',
  'flower-2', 'trees', 'mountain', 'sun', 'moon', 'cloud',
  'palette', 'brush', 'pen-tool', 'sparkles', 'gem', 'crown',
  'gift', 'party-popper', 'trophy', 'medal', 'award',
  'dumbbell', 'bike', 'football', 'tennis-ball',
  'building-2', 'church', 'school', 'store', 'warehouse', 'hotel',
  'mic', 'headphones', 'speaker', 'tv', 'monitor', 'gamepad-2',
  'shirt', 'glasses', 'watch', 'ring',
  'stethoscope', 'syringe', 'pill', 'baby',
  'book-open', 'graduation-cap', 'briefcase', 'hammer',
  'wrench', 'zap', 'flame', 'droplets', 'leaf',
  'dog', 'cat', 'fish', 'bird',
  'truck', 'ship', 'rocket', 'train',
  'map-pin', 'compass', 'globe', 'flag',
  'users', 'user', 'hand-helping', 'handshake',
  'phone', 'mail', 'message-circle', 'bell',
  'shield', 'lock', 'key', 'eye',
  'calendar', 'clock', 'timer', 'alarm-clock',
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
