import { supabase } from '../supabaseClient'

export class AdminSignatureService {
  private static readonly STORAGE_BUCKET = 'signatures'
  private static readonly ADMIN_SIGNATURE_PATH = 'admin_signature.png'

  /**
   * Upload admin signature to storage
   */
  static async uploadAdminSignature(signatureDataUrl: string): Promise<string> {
    try {
      // Convert data URL to blob and resize
      const processedBlob = await this.processSignatureImage(signatureDataUrl)
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(this.ADMIN_SIGNATURE_PATH, processedBlob, {
          cacheControl: '3600',
          upsert: true // Replace existing signature
        })

      if (error) {
        throw new Error(`Failed to upload signature: ${error.message}`)
      }

      return data.path
    } catch (error) {
      console.error('Error uploading admin signature:', error)
      throw error
    }
  }

  /**
   * Get admin signature public URL
   */
  static async getAdminSignatureUrl(): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(this.ADMIN_SIGNATURE_PATH)

      // Check if file exists
      const { data: files } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list('', { search: 'admin_signature.png' })

      if (!files || files.length === 0) {
        return null
      }

      return data.publicUrl
    } catch (error) {
      console.error('Error getting admin signature URL:', error)
      return null
    }
  }

  /**
   * Check if admin signature exists
   */
  static async hasAdminSignature(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list('', { search: 'admin_signature.png' })

      if (error) return false
      return data && data.length > 0
    } catch (error) {
      return false
    }
  }

  /**
   * Process signature image: resize and optimize
   */
  private static async processSignatureImage(dataUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Set canvas size to match the original image size to keep original quality
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        // Draw the image at original size and quality
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Convert to blob at full quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/png',
          1.0 // Keep original quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }

  /**
   * Delete admin signature
   */
  static async deleteAdminSignature(): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([this.ADMIN_SIGNATURE_PATH])

      if (error) {
        throw new Error(`Failed to delete signature: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting admin signature:', error)
      throw error
    }
  }
} 