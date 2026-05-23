import { useState, useRef } from 'react'
import { Upload, X, Loader2, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadImage } from '@/lib/cloudinary'
import { toast } from 'sonner'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUploader({ images, onChange, maxImages = 6 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = maxImages - images.length
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remaining)
    setUploading(true)

    try {
      const uploaded: string[] = []
      for (const file of filesToUpload) {
        const url = await uploadImage(file)
        if (url) uploaded.push(url)
      }

      if (uploaded.length > 0) {
        onChange([...images, ...uploaded])
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`)
      } else {
        toast.error('Upload failed. Check your Cloudinary settings.')
      }
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-3 gap-3'>
        {images.map((url, i) => (
          <div key={i} className='relative group aspect-video rounded-lg overflow-hidden border'>
            <img src={url} alt={`Venue ${i + 1}`} className='w-full h-full object-cover' />
            <button
              onClick={() => removeImage(i)}
              className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
            >
              <X className='h-3 w-3' />
            </button>
            {i === 0 && (
              <span className='absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded'>
                Cover
              </span>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className='aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50'
          >
            {uploading ? (
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            ) : (
              <ImagePlus className='h-6 w-6 text-muted-foreground' />
            )}
            <span className='text-xs text-muted-foreground'>
              {uploading ? 'Uploading...' : `Add (${images.length}/${maxImages})`}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        multiple
        onChange={handleFileSelect}
        className='hidden'
      />

      {images.length === 0 && (
        <p className='text-xs text-muted-foreground'>Upload up to {maxImages} images. First image will be the cover photo.</p>
      )}
    </div>
  )
}
