import React, { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TablePro } from "@/components/ui/table-pro"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { IconDotsVertical, IconPlus, IconEye, IconEdit, IconTrash, IconShare, IconFileText, IconCheck, IconX, IconPencil, IconTemplate, IconChartBar, IconSignature, IconDownload } from "@tabler/icons-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import type { Contract, SupabaseContractTemplate } from "@/data/types"
import { fetchContractsFromSupabase, deleteContractFromSupabase, fetchContractTemplatesFromSupabase } from "@/data/supabase_data_source"
import { ContractService } from "@/services/ContractService"
import { formatToVND } from "@/utils/currency_utils"
import { AdminSignatureManager } from "@/components/admin-signature-manager"

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [templates, setTemplates] = useState<SupabaseContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState("contracts")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [contractsData, templatesData] = await Promise.all([
          fetchContractsFromSupabase(),
          fetchContractTemplatesFromSupabase()
        ])
        setContracts(contractsData)
        setTemplates(templatesData)
      } catch (err) {
        toast("Failed to load data", { 
          description: err instanceof Error ? err.message : "Unknown error" 
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDelete = async (contract: Contract) => {
    if (!confirm(`Are you sure you want to delete the contract for "${contract.tenant?.full_name}"?`)) return
    
    setIsDeleting(contract.id)
    try {
      await deleteContractFromSupabase(contract.id)
      setContracts(prev => prev.filter(t => t.id !== contract.id))
      toast("Contract deleted successfully")
    } catch (err) {
      toast("Failed to delete contract", { 
        description: err instanceof Error ? err.message : "Unknown error" 
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleCopyShareLink = (shareToken: string) => {
    const shareLink = ContractService.generateShareLink(shareToken)
    navigator.clipboard.writeText(shareLink)
    toast("Share link copied to clipboard!")
  }

  const handleDownloadContract = async (contract: Contract) => {
    if (contract.status !== 'signed' && contract.status !== 'completed') {
      toast("Only signed contracts can be downloaded with signatures")
      return
    }

    setIsDownloading(contract.id)
    try {
      await ContractService.downloadSignedContract(contract)
      toast("Contract downloaded successfully!")
    } catch (err) {
      toast("Failed to download contract", { 
        description: err instanceof Error ? err.message : "Unknown error" 
      })
    } finally {
      setIsDownloading(null)
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

  const getContractStats = () => {
    const total = contracts.length
    const signed = contracts.filter(c => c.status === 'signed' || c.status === 'completed').length
    const pending = contracts.filter(c => c.status === 'pending_signature').length
    const draft = contracts.filter(c => c.status === 'draft').length

    return { total, signed, pending, draft }
  }

  const contractColumns: Array<{
    label: string
    accessor?: keyof Contract
    render?: (row: Contract) => React.ReactNode
  }> = [
    { 
      label: "Tenant", 
      render: (row: Contract) => (
        <div>
          <div className="font-medium">{row.tenant?.full_name}</div>
          <div className="text-xs text-gray-500">{row.tenant?.phone || 'No phone'}</div>
        </div>
      )
    },
    { 
      label: "Unit", 
      render: (row: Contract) => (
        <div>
          <div className="font-medium">{row.apartment?.unit_number}</div>
          <div className="text-xs text-gray-500">{row.apartment?.building?.name}</div>
        </div>
      )
    },
    { 
      label: "Template", 
      render: (row: Contract) => (
        <div className="max-w-xs truncate">
          {row.template?.name || "Unknown Template"}
        </div>
      )
    },
    {
      label: "Status",
      render: (row: Contract) => (
        <div className="flex items-center gap-2">
          {getStatusBadge(row.status)}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyShareLink(row.share_token)}
            className="h-6 w-6 p-0"
            title="Copy Share Link"
          >
            <IconShare size={12} />
          </Button>
        </div>
      )
    },
    {
      label: "Monthly Rent",
      render: (row: Contract) => {
        const rentPrice = row.contract_data?.rent_price
        return rentPrice ? formatToVND(Number(rentPrice)) : 'N/A'
      }
    },
    {
      label: "Created",
      render: (row: Contract) => new Date(row.created_at).toLocaleDateString('en-US')
    },
  ]

  const templateColumns: Array<{
    label: string
    accessor?: keyof SupabaseContractTemplate
    render?: (row: SupabaseContractTemplate) => React.ReactNode
  }> = [
    { 
      label: "Template Name", 
      render: (row: SupabaseContractTemplate) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-gray-500">{row.description || 'No description'}</div>
        </div>
      )
    },
    {
      label: "Fields",
      render: (row: SupabaseContractTemplate) => (
        <Badge variant="outline">{row.fields.length} fields</Badge>
      )
    },
    {
      label: "Status",
      render: (row: SupabaseContractTemplate) => (
        <Badge variant={row.is_active ? "default" : "secondary"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      label: "Updated",
      render: (row: SupabaseContractTemplate) => new Date(row.updated_at).toLocaleDateString('en-US')
    },
  ]

  const contractActions = (row: Contract) => {
    const isSigned = row.status === 'signed' || row.status === 'completed'
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0"
            disabled={isDeleting === row.id || isDownloading === row.id}
          >
            {isDownloading === row.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
            ) : (
              <IconDotsVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/contracts/preview/${row.id}`)}>
            <IconEye className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
          {/* Only show Edit if not signed */}
          {!isSigned && (
            <DropdownMenuItem onClick={() => navigate(`/contracts/edit/${row.id}`)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {/* Only show Download if signed */}
          {isSigned && (
            <DropdownMenuItem onClick={() => handleDownloadContract(row)}>
              <IconDownload className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={() => handleDelete(row)}
            className="text-red-600"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const templateActions = (row: SupabaseContractTemplate) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <IconDotsVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/contract-templates/edit/${row.id}`)}>
          <IconEdit className="mr-2 h-4 w-4" />
          Edit Template
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const contractStats = getContractStats()

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Contract Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage rental contracts, templates, and agreements
                </p>
              </div>
            </div>

            {/* Navigation Sidebar */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3">
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      <Button
                        variant={activeSection === "contracts" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection("contracts")}
                      >
                        <IconFileText className="mr-2 h-4 w-4" />
                        Contracts
                      </Button>
                      <Button
                        variant={activeSection === "templates" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection("templates")}
                      >
                        <IconTemplate className="mr-2 h-4 w-4" />
                        Templates
                      </Button>
                      <Button
                        variant={activeSection === "statistics" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection("statistics")}
                      >
                        <IconChartBar className="mr-2 h-4 w-4" />
                        Statistics
                      </Button>
                      <Button
                        variant={activeSection === "signature" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection("signature")}
                      >
                        <IconSignature className="mr-2 h-4 w-4" />
                        Admin Signature
                      </Button>
                    </div>
                  </CardContent>
              </div>

              {/* Main Content */}
              <div className="col-span-9">
                {activeSection === "contracts" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-semibold">Contracts</h2>
                        <p className="text-gray-600 text-sm">Manage all rental agreements</p>
                      </div>
                      <Button 
                        onClick={() => navigate('/contracts/create')}
                        className="flex items-center gap-2"
                      >
                        <IconPlus size={16} />
                        Create Contract
                      </Button>
                    </div>

                    {/* Contracts Table */}
                    <Card>
                      <CardContent>
                        <TablePro<Contract>
                          data={contracts}
                          columns={contractColumns}
                          actions={contractActions}
                          rowKey={(row) => row.id}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeSection === "templates" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-semibold">Contract Templates</h2>
                        <p className="text-gray-600 text-sm">Manage reusable contract templates</p>
                      </div>
                      <Button 
                        onClick={() => navigate('/contract-templates/create')}
                        className="flex items-center gap-2"
                      >
                        <IconPlus size={16} />
                        Create Template
                      </Button>
                    </div>

                    {/* Templates Table */}
                    <Card>
                      <CardContent>
                        <TablePro<SupabaseContractTemplate>
                          data={templates}
                          columns={templateColumns}
                          actions={templateActions}
                          rowKey={(row) => row.id}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeSection === "statistics" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold">Contract Statistics</h2>
                      <p className="text-gray-600 text-sm">View contract usage and performance metrics</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Contract Status Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Contract Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Signed</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500"
                                    style={{ width: `${contractStats.total > 0 ? (contractStats.signed / contractStats.total) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{contractStats.signed}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Pending</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-orange-500"
                                    style={{ width: `${contractStats.total > 0 ? (contractStats.pending / contractStats.total) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{contractStats.pending}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Draft</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gray-500"
                                    style={{ width: `${contractStats.total > 0 ? (contractStats.draft / contractStats.total) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{contractStats.draft}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Template Usage */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Template Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {templates.slice(0, 5).map(template => {
                              const usage = contracts.filter(c => c.template_id === template.id).length
                              return (
                                <div key={template.id} className="flex justify-between items-center">
                                  <span className="text-sm truncate">{template.name}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500"
                                        style={{ width: `${contractStats.total > 0 ? (usage / contractStats.total) * 100 : 0}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium">{usage}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeSection === "signature" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold">Admin Signature</h2>
                      <p className="text-gray-600 text-sm">Manage your signature for all contracts</p>
                    </div>

                    <AdminSignatureManager />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 