import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { IconArrowLeft, IconShare, IconEdit, IconDownload, IconFileText, IconCheck, IconX, IconPencil } from "@tabler/icons-react"
import type { Contract } from "@/data/types"
import { ContractService } from "@/services/ContractService"
import { formatToVND } from "@/utils/currency_utils"

export default function ContractPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const fetchContract = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        const contractData = await ContractService.getContractById(id)
        if (!contractData) {
          toast("Contract not found")
          navigate('/contracts')
          return
        }
        setContract(contractData)
      } catch (err) {
        toast("Failed to load contract", {
          description: err instanceof Error ? err.message : "Unknown error"
        })
        navigate('/contracts')
      } finally {
        setLoading(false)
      }
    }

    fetchContract()
  }, [id, navigate])

  const handleCopyShareLink = () => {
    if (!contract) return
    const shareLink = ContractService.generateShareLink(contract.share_token)
    navigator.clipboard.writeText(shareLink)
    toast("Share link copied to clipboard!")
  }

  const handleDownloadContract = async () => {
    if (!contract) return
    
    if (contract.status !== 'signed' && contract.status !== 'completed') {
      toast("Only signed contracts can be downloaded with signatures")
      return
    }

    setIsDownloading(true)
    try {
      await ContractService.downloadSignedContract(contract)
      toast("Contract downloaded successfully!")
    } catch (err) {
      toast("Failed to download contract", { 
        description: err instanceof Error ? err.message : "Unknown error" 
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft', icon: IconFileText },
      pending_signature: { variant: 'outline' as const, label: 'Pending Signature', icon: IconPencil },
      signed: { variant: 'default' as const, label: 'Signed', icon: IconCheck },
      completed: { variant: 'default' as const, label: 'Completed', icon: IconCheck },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled', icon: IconX },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const StatusIcon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <StatusIcon size={14} />
        {config.label}
      </Badge>
    )
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
          contract.contract_data || {},
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
    if (!contract?.template) {
      return <div className="text-gray-500 italic">No template data available</div>
    }

    if (loadingContent) {
      return <div className="text-gray-500 italic">Loading contract content...</div>
    }

    return (
      <div 
        className="prose max-w-none bg-white p-8 rounded-lg shadow-sm print:shadow-none print:p-0"
        dangerouslySetInnerHTML={{ __html: contractContent }}
      />
    )
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!contract) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Contract not found</h2>
              <p className="text-gray-600 mt-2">The contract you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/contracts')} className="mt-4">
                Back to Contracts
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const isSigned = contract.status === 'signed' || contract.status === 'completed'

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/contracts')}
                  className="flex items-center gap-2"
                >
                  <IconArrowLeft size={16} />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Contract Preview</h1>
                  <p className="text-gray-600 mt-1">
                    View contract details and content
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(contract.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyShareLink}
                  className="h-8 w-8 p-0"
                  title="Copy Share Link"
                >
                  <IconShare size={16} />
                </Button>
                {isSigned && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadContract}
                    disabled={isDownloading}
                    className="h-8 w-8 p-0"
                    title="Download PDF"
                  >
                    {isDownloading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
                    ) : (
                      <IconDownload size={16} />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Contract Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Tenant</h4>
                    <div className="space-y-1">
                      <div className="font-medium">{contract.tenant?.full_name}</div>
                      <div className="text-sm text-gray-500">{contract.tenant?.phone}</div>
                      <div className="text-sm text-gray-500">{contract.tenant?.email}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Property</h4>
                    <div className="space-y-1">
                      <div className="font-medium">{contract.apartment?.unit_number}</div>
                      <div className="text-sm text-gray-500">{contract.apartment?.building?.name}</div>
                      <div className="text-sm text-gray-500">{contract.apartment?.area}m²</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Contract Details</h4>
                    <div className="space-y-1">
                      <div className="font-medium">{contract.template?.name}</div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(contract.created_at).toLocaleDateString('en-US')}
                      </div>
                      {contract.signed_at && (
                        <div className="text-sm text-green-600">
                          Signed: {new Date(contract.signed_at).toLocaleDateString('en-US')}
                        </div>
                      )}
                      {contract.contract_data?.rent_price && (
                        <div className="text-sm text-gray-500">
                          Rent: {formatToVND(Number(contract.contract_data.rent_price))}/month
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {/* Only show Edit button if contract is not signed */}
                {!isSigned && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/contracts/edit/${contract.id}`)}
                    className="flex items-center gap-2"
                  >
                    <IconEdit size={16} />
                    Edit Contract
                  </Button>
                )}
                
                {/* Show additional Download button for signed contracts */}
                {isSigned && (
                  <Button
                    variant="outline"
                    onClick={handleDownloadContract}
                    disabled={isDownloading}
                    className="flex items-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <IconDownload size={16} />
                        Download PDF
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-2"
                >
                  <IconShare size={16} />
                  Copy Share Link
                </Button>
              </div>
            </div>

            {/* Contract Content */}
            <Card className="print:shadow-none print:border-none">
              <CardContent className="p-0">
                {renderContractContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 