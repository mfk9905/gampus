import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/lib/env';

const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Uploads a validated image buffer to Cloudinary.
 * Applies automatic WebP/optimized formatting and thumbnail generation.
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: string = 'unilive/listings'
): Promise<UploadResult> {
  if (!isCloudinaryConfigured) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Cloudinary Notice] Cloudinary keys not set; using development fallback URL.');
    }
    // Return sample student room placeholder in development
    return {
      success: true,
      url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
      publicId: 'mock_unilive_sample',
    };
  }

  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          console.error('[Cloudinary Upload Error]', error);
          resolve({
            success: false,
            error: error?.message || 'Görsel yüklenirken hata oluştu.',
          });
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an image from Cloudinary when a listing is deleted.
 */
export async function deleteCloudinaryImage(urlOrPublicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured) return true;

  try {
    let publicId = urlOrPublicId;
    // Extract publicId if a full URL was passed
    if (urlOrPublicId.includes('res.cloudinary.com')) {
      const parts = urlOrPublicId.split('/');
      const filenameWithExt = parts.slice(parts.indexOf('upload') + 2).join('/');
      publicId = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.'));
    }

    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (err) {
    console.error('[Cloudinary Delete Error]', err);
    return false;
  }
}

