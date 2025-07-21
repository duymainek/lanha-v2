import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconTrash, IconDeviceFloppy } from '@tabler/icons-react'

interface SignatureCanvasProps {
  onSave?: (signature: string) => void
  disabled?: boolean
  title?: string
  className?: string
  canvasProps?: React.ComponentProps<typeof SignatureCanvas>
}

export interface SignatureCanvasRef {
  clear: () => void
  getSignatureData: () => string | null
  isEmpty: () => boolean
}

const CustomSignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onSave, disabled = false, title = "Chữ ký", className = "", canvasProps = {} }, ref) => {
    const sigCanvasRef = useRef<SignatureCanvas>(null)

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigCanvasRef.current?.clear()
      },
      getSignatureData: () => {
        if (sigCanvasRef.current?.isEmpty() ?? true) return null
        return sigCanvasRef.current?.toDataURL() || null
      },
      isEmpty: () => {
        return sigCanvasRef.current?.isEmpty() ?? true
      }
    }))

    const handleClear = () => {
      sigCanvasRef.current?.clear()
    }

    const handleSave = () => {
      if (sigCanvasRef.current?.isEmpty() ?? true) {
        return
      }
      const signatureData = sigCanvasRef.current?.toDataURL()
      if (signatureData && onSave) {
        onSave(signatureData)
      }
    }

    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4">
            <SignatureCanvas
              ref={sigCanvasRef}
              backgroundColor="transparent"
              canvasProps={{
                className: disabled ? "w-full h-40 cursor-not-allowed" : "w-full h-40 cursor-crosshair",
                style: { 
                  background: disabled ? '#f9fafb' : 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  pointerEvents: disabled ? 'none' : 'auto'
                },
                ...canvasProps
              }}
              clearOnResize={false}
              throttle={16}
              minWidth={1}
              maxWidth={3}
              velocityFilterWeight={0.7}
            />
            
            {/* Helper text */}
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-500">
                {disabled 
                  ? "Chữ ký đã được lưu" 
                  : "Vui lòng ký tên bằng mouse hoặc chạm tay trên khung này"
                }
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {!disabled && (
            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={handleClear}
                className="flex items-center gap-2"
              >
                <IconTrash size={16} />
                Xóa chữ ký
              </Button>
              
              {onSave && (
                <Button
                  onClick={handleSave}
                  className="flex items-center gap-2"
                >
                  <IconDeviceFloppy size={16} />
                  Lưu chữ ký
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

CustomSignatureCanvas.displayName = "SignatureCanvas"

export { CustomSignatureCanvas as SignatureCanvas } 