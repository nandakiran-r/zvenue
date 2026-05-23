/**
 * Cloudinary image upload for admin panel
 * 
 * Setup:
 * 1. Create free account at https://cloudinary.com
 * 2. Go to Settings → Upload → Upload Presets
 * 3. Click "Add Upload Preset" → Set signing mode to "Unsigned"
 * 4. Name it "zvenue_unsigned" (or whatever you prefer)
 * 5. Add to admin/.env:
 *    VITE_CLOUDINARY_CLOUD=your_cloud_name
 *    VITE_CLOUDINARY_PRESET=zvenue_unsigned
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD || 'your_cloud_name'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || 'zvenue_unsigned'
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

/**
 * Upload a file to Cloudinary
 * @param file - File object from input[type=file]
 * @returns The secure URL of the uploaded image, or null on failure
 */
export async function uploadImage(file: File): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', 'zvenue/venues')

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.secure_url) {
      return data.secure_url
    }

    console.error('Cloudinary upload failed:', data)
    return null
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of File objects
 * @returns Array of secure URLs (nulls filtered out)
 */
export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  const results = await Promise.all(files.map(uploadImage))
  return results.filter((url): url is string => url !== null)
}
