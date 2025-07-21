import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconUpload, IconEdit, IconX, IconPhoto } from '@tabler/icons-react'
import { toast } from 'sonner'
import { AdminSignatureService } from '@/services/AdminSignatureService'

export function AdminSignatureManager() {
  const [currentSignature, setCurrentSignature] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCurrentSignature()
  }, [])

  // Cleanup preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const loadCurrentSignature = async () => {
    setLoading(true)
    try {
      const signatureUrl = await AdminSignatureService.getAdminSignatureUrl()
      setCurrentSignature(signatureUrl)
    } catch (error) {
      console.error('Error loading admin signature:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleUploadSignature = async () => {
    if (!selectedFile) {
      toast('Please select an image file')
      return
    }

    setUploading(true)
    try {
      // Convert file to base64 data URL
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string
          if (result) {
            await AdminSignatureService.uploadAdminSignature(result)
            await loadCurrentSignature() // Reload to get new URL
            setShowUploadDialog(false)
            setSelectedFile(null)
            setPreviewUrl(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
            toast('Admin signature uploaded successfully!')
          }
        } catch (error) {
          console.error('Error uploading signature:', error)
          toast('Failed to upload signature', {
            description: error instanceof Error ? error.message : 'Unknown error'
          })
        } finally {
          setUploading(false)
        }
      }
      reader.onerror = () => {
        toast('Failed to read file')
        setUploading(false)
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      toast('Failed to upload signature', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconEdit size={20} />
          Admin Signature Management
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage your signature that will appear on all contracts
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : currentSignature ? (
          <div className="space-y-4">
            {/* Current Signature Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-2">Current Signature:</div>
              <div className="flex items-center justify-center bg-white border rounded p-4">
                <img 
                  src={currentSignature} 
                  alt="Admin Signature" 
                  className="max-w-[200px] max-h-[80px] object-contain"
                  style={{ width: '200px', height: '80px' }}
                />
              </div>
            </div>

            {/* Replace Button */}
            <Button 
              onClick={() => {
                setSelectedFile(null)
                setPreviewUrl(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
                setShowUploadDialog(true)
              }}
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <IconPhoto size={16} />
              Replace Signature
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4 flex flex-col items-center justify-center">
            <div className="text-gray-500 py-8">
              <IconUpload size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No admin signature found</p>
              <p className="text-sm">Upload your signature to appear on all contracts</p>
            </div>
            <Button 
              onClick={() => {
                setSelectedFile(null)
                setPreviewUrl(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
                setShowUploadDialog(true)
              }}
              className="flex items-center gap-2"
            >
              <IconPhoto size={16} />
              Upload Signature
            </Button>
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {currentSignature ? 'Replace Admin Signature' : 'Upload Admin Signature'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>• Use a clear, professional signature with transparent background</p>
                <p>• Supported formats: PNG, JPG, JPEG (Max 5MB)</p>
                <p>• This signature will appear on all contracts</p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="signature-file">Select Signature Image</Label>
                <Input
                  id="signature-file"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                
                {previewUrl && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img 
                      src={previewUrl} 
                      alt="Signature preview" 
                      className="max-w-full max-h-20 object-contain border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={uploading}
              >
                <IconX size={16} className="mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleUploadSignature}
                disabled={uploading || !selectedFile}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <IconUpload size={16} />
                    {currentSignature ? 'Replace' : 'Upload'} Signature
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 