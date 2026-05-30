/**
 * Cloudinary image upload for mobile app
 * Uses unsigned upload preset (no server-side signature needed)
 */

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD || 'dxprjeaun';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || 'zvenue_unsigned';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Upload an image to Cloudinary from a local file URI
 * @param uri - Local file URI from expo-image-picker (e.g., file:///...)
 * @param folder - Optional folder name in Cloudinary (e.g., "avatars", "reviews")
 * @returns The secure URL of the uploaded image, or null on failure
 */
export async function uploadImageToCloudinary(
  uri: string,
  folder?: string,
): Promise<string | null> {
  try {
    // Handle base64 data URIs
    if (uri.startsWith('data:')) {
      const formData = new FormData();
      formData.append('file', uri);
      formData.append('upload_preset', UPLOAD_PRESET);
      if (folder) formData.append('folder', folder);

      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.secure_url) return data.secure_url;
      console.error('Cloudinary upload failed:', data.error?.message);
      return null;
    }

    // Handle file:// URIs (from image picker)
    const filename = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);
    formData.append('upload_preset', UPLOAD_PRESET);
    if (folder) formData.append('folder', folder);

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    if (data.secure_url) return data.secure_url;
    console.error('Cloudinary upload failed:', data.error?.message);
    return null;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}
