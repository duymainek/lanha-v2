import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { IconArrowLeft, IconEye, IconDeviceFloppy } from "@tabler/icons-react"
import type { 
  SupabaseContractTemplate, 
  ContractTemplateField,
  Contract
} from "@/data/types"
import { 
  fetchContractTemplatesFromSupabase,
  fetchContractByIdFromSupabase,
  updateContractInSupabase
} from "@/data/supabase_data_source"
import { ContractService } from "@/services/ContractService"

export default function EditContractPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<SupabaseContractTemplate[]>([])
  const [contract, setContract] = useState<Contract | null>(null)
  const [contractData, setContractData] = useState<Record<string, string | number | boolean | Date | null>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("preview")

  const selectedTemplate = templates.find(t => t.id === contract?.template_id)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        const [contractData, templatesData] = await Promise.all([
          fetchContractByIdFromSupabase(id),
          fetchContractTemplatesFromSupabase()
        ])
        
        // Check if contract is signed - redirect to preview if so
        if (contractData.status === 'signed' || contractData.status === 'completed') {
          toast("Cannot edit signed contract", {
            description: "Signed contracts cannot be modified. You can view the contract or download the PDF."
          })
          navigate(`/contracts/preview/${id}`)
          return
        }
        
        setContract(contractData)
        setTemplates(templatesData.filter(t => t.is_active))
        setContractData(contractData.contract_data || {})
      } catch (err) {
        toast("Failed to load contract", {
          description: err instanceof Error ? err.message : "Unknown error"
        })
        navigate('/contracts')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleFieldChange = (fieldName: string, value: string | number | boolean | Date | null) => {
    setContractData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleSave = async () => {
    if (!contract || !selectedTemplate) {
      toast("Contract data not available")
      return
    }

    // Validate required fields
    const requiredFields = selectedTemplate.fields.filter(f => f.required) || []
    const missingFields = requiredFields.filter(field => 
      !contractData[field.name] || contractData[field.name] === ''
    )

    if (missingFields.length > 0) {
      toast("Please fill in all required fields", {
        description: `Missing: ${missingFields.map(f => f.label).join(', ')}`
      })
      return
    }

    setIsSaving(true)
    try {
      await updateContractInSupabase(contract.id, {
        contract_data: contractData
      })
      
      toast("Contract updated successfully!")
      navigate(`/contracts/preview/${contract.id}`)
    } catch (err) {
      toast("Failed to update contract", {
        description: err instanceof Error ? err.message : "Unknown error"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderFieldInput = (field: ContractTemplateField) => {
    const value = contractData[field.name] || field.defaultValue || ""
    
    switch (field.type) {
      case 'date':
        return (
          <Input
            type="date"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
      
      case 'select':
        return (
          <Select
            value={typeof value === 'string' ? value : ''}
            onValueChange={(val) => handleFieldChange(field.name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      default:
        return (
          <Input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
    }
  }

  const [previewContent, setPreviewContent] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    const generatePreview = async () => {
      if (!selectedTemplate || !contract) return
      
      setLoadingPreview(true)
      try {
        const filledContent = await ContractService.fillTemplate(
          selectedTemplate, 
          contractData,
          contract.tenant_sign_url
        )
        setPreviewContent(filledContent)
      } catch (error) {
        console.error('Error generating preview:', error)
        setPreviewContent('<div class="text-red-500">Error loading preview</div>')
      } finally {
        setLoadingPreview(false)
      }
    }

    generatePreview()
  }, [selectedTemplate, contractData, contract])

  const renderPreview = () => {
    if (!selectedTemplate || !contract) {
      return <div className="text-gray-500 italic">Contract data not available</div>
    }

    if (loadingPreview) {
      return <div className="text-gray-500 italic">Loading preview...</div>
    }

    return (
      <div 
        className="prose max-w-none border rounded-lg p-6 bg-white print:shadow-none print:border-none"
        dangerouslySetInnerHTML={{ __html: previewContent }}
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
              </Button>
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
                  <h1 className="text-3xl font-bold">Edit Contract</h1>
                  <p className="text-gray-600 mt-1">
                    Modify contract details and information
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || !selectedTemplate}
                className="flex items-center gap-2"
              >
                <IconDeviceFloppy size={16} />
                {isSaving ? "Updating..." : "Update Contract"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Contract Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contract Info (Read-only) */}
                  <div className="space-y-4 pb-4 border-b">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Template</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">{contract.template?.name}</div>
                        <div className="text-xs text-gray-500">
                          {selectedTemplate?.fields.length} fields
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tenant</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                                 <div className="font-medium">{contract.tenant?.full_name}</div>
                         <div className="text-xs text-gray-500">
                           {contract.apartment?.unit_number} - {contract.apartment?.building?.name}
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Fields */}
                  {selectedTemplate && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-base font-semibold">Contract Details</Label>
                        <Badge variant="outline">
                          {selectedTemplate.fields.length} fields
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedTemplate.fields.map(field => (
                          <div key={field.name} className="mb-2">
                            <Label className="flex items-center gap-1 mb-1 block">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            <div className="mt-0.5">{renderFieldInput(field)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contract Preview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconEye size={20} />
                    Contract Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="preview" className="flex items-center gap-2">
                        <IconEye size={16} />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="mt-4">
                      <div className="border rounded-lg p-4 bg-gray-50 h-96 overflow-auto">
                        {renderPreview()}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 