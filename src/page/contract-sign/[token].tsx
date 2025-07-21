import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SignatureCanvas, type SignatureCanvasRef } from '@/components/ui/signature-canvas'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { IconEye, IconPencil, IconCheck, IconX, IconFileText } from '@tabler/icons-react'
import { toast } from 'sonner'
import type { Contract } from '@/data/types'
import { ContractService } from '@/services/ContractService'
import { formatToVND } from '@/utils/currency_utils'

export default function ContractSignPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'reading' | 'agreeing' | 'signing' | 'completed'>('reading')
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const signatureRef = useRef<SignatureCanvasRef>(null)

  useEffect(() => {
    const fetchContract = async () => {
      if (!token) {
        setError('Invalid contract link')
        setLoading(false)
        return
      }

      try {
        const contractData = await ContractService.getContractByShareToken(token)
        
        if (!contractData) {
          setError('Contract not found or link has expired')
          setLoading(false)
          return
        }

        if (contractData.status === 'signed' || contractData.status === 'completed') {
          setCurrentStep('completed')
        }

        setContract(contractData)
      } catch (err) {
        setError('Failed to load contract')
        console.error('Error fetching contract:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchContract()
  }, [token])

  const handleAgree = () => {
    setCurrentStep('agreeing')
    setShowSignatureDialog(true)
  }

  const handleDisagree = () => {
    if (confirm('Are you sure you disagree with this contract?')) {
      toast('You have declined the contract')
      // Could redirect or show message
    }
  }

  const handleSignatureSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast('Please sign before submitting')
      return
    }

    if (!contract) {
      toast('Contract information not found')
      return
    }

    setIsSaving(true)
    try {
      const signatureData = signatureRef.current.getSignatureData()
      if (!signatureData) {
        toast('Unable to get signature data')
        return
      }

      // Save signature and update contract status
      const updatedContract = await ContractService.saveSignature(contract.id, signatureData)
      
      setCurrentStep('completed')
      setShowSignatureDialog(false)
      toast('Contract signed successfully!')

      // Update contract state with the returned contract (includes tenant_sign_url)
      setContract(prev => prev ? {
        ...prev,
        status: 'signed',
        signature_data: signatureData,
        tenant_sign_url: updatedContract.tenant_sign_url,
        signed_at: new Date().toISOString()
      } : prev)

    } catch (err) {
      toast('Failed to save signature', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
      console.error('Error saving signature:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const [contractContent, setContractContent] = useState<string>('')
  const [loadingContent, setLoadingContent] = useState(false)

  useEffect(() => {
    const generateContent = async () => {
      if (!contract?.template) return
      
      setLoadingContent(true)
      try {
        const filledContent = await ContractService.fillTemplate(
          contract.template, 
          contract.contract_data,
          contract.tenant_sign_url
        )
        setContractContent(filledContent)
      } catch (error) {
        console.error('Error generating contract content:', error)
        setContractContent('<div class="text-red-500">Error loading contract content</div>')
      } finally {
        setLoadingContent(false)
      }
    }

    generateContent()
  }, [contract])

  const renderContractContent = () => {
    if (!contract?.template) return null

    if (loadingContent) {
      return (
        <div className="text-gray-500 italic p-6">Loading contract content...</div>
      )
    }
    
    return (
      <div 
        className="prose max-w-none p-6 bg-white border rounded-lg shadow-sm print:shadow-none print:border-none"
        dangerouslySetInnerHTML={{ __html: contractContent }}
      />
    )
  }

  const getStatusBadge = () => {
    if (!contract) return null

    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft', icon: IconFileText },
      pending_signature: { variant: 'outline' as const, label: 'Pending Signature', icon: IconPencil },
      signed: { variant: 'default' as const, label: 'Signed', icon: IconCheck },
      completed: { variant: 'default' as const, label: 'Completed', icon: IconCheck },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled', icon: IconX },
    }

    const config = statusConfig[contract.status as keyof typeof statusConfig] || statusConfig.draft
    const StatusIcon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <StatusIcon size={14} />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <IconX size={48} className="mx-auto text-red-500 mb-4" />
            <CardTitle className="text-red-600">Lỗi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-gray-600">Không tìm thấy hợp đồng</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Hợp đồng thuê nhà</h1>
              <p className="text-gray-600 text-sm">
                {contract.tenant?.full_name} - {contract.apartment?.unit_number}
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Contract Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconEye size={20} />
              Thông tin hợp đồng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Khách thuê:</strong> {contract.tenant?.full_name}</div>
              <div><strong>CMND/CCCD:</strong> {contract.tenant?.id_number || 'N/A'}</div>
              <div><strong>Điện thoại:</strong> {contract.tenant?.phone || 'N/A'}</div>
              <div><strong>Email:</strong> {contract.tenant?.email || 'N/A'}</div>
              <div><strong>Số phòng:</strong> {contract.apartment?.unit_number}</div>
              <div><strong>Tòa nhà:</strong> {contract.building?.name}</div>
              <div><strong>Giá thuê:</strong> {contract.contract_data?.rent_price ? formatToVND(Number(contract.contract_data.rent_price)) : 'N/A'}</div>
              <div><strong>Ngày tạo:</strong> {new Date(contract.created_at).toLocaleDateString('vi-VN')}</div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Content */}
        <Card>
          <CardHeader>
            <CardTitle>Nội dung hợp đồng</CardTitle>
            <p className="text-sm text-gray-600">
              Vui lòng đọc kỹ nội dung hợp đồng trước khi ký
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {renderContractContent()}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {currentStep === 'reading' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-lg font-medium">
                  Bạn có đồng ý với các điều khoản trong hợp đồng này?
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleDisagree}
                    className="flex items-center gap-2"
                  >
                    <IconX size={16} />
                    Không đồng ý
                  </Button>
                  <Button
                    onClick={handleAgree}
                    className="flex items-center gap-2"
                  >
                    <IconCheck size={16} />
                    Đồng ý và ký hợp đồng
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed State */}
        {currentStep === 'completed' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <div className="space-y-4">
                <IconCheck size={48} className="mx-auto text-green-600" />
                <h3 className="text-xl font-semibold text-green-800">
                  Hợp đồng đã được ký thành công!
                </h3>
                <p className="text-green-700">
                  Cảm ơn bạn đã ký hợp đồng. Bản copy sẽ được gửi đến email của bạn trong thời gian sớm nhất.
                </p>
                {contract.signed_at && (
                  <p className="text-sm text-green-600">
                    Ngày ký: {new Date(contract.signed_at).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ký hợp đồng</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Vui lòng ký tên của bạn vào ô bên dưới để xác nhận đồng ý với hợp đồng.
            </p>
            
            <SignatureCanvas
              ref={signatureRef}
              title="Chữ ký của bạn"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSignatureDialog(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSignatureSubmit}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <IconCheck size={16} />
                  Xác nhận ký hợp đồng
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 