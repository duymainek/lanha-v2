import React, { useState, useEffect } from "react"
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
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { IconArrowLeft, IconEye, IconDeviceFloppy, IconShare } from "@tabler/icons-react"
import type { 
  SupabaseContractTemplate, 
  ContractTemplateField,
  Tenant,
  ContractFormData 
} from "@/data/types"
import { 
  fetchContractTemplatesFromSupabase,
  fetchTenantsFromSupabase,
  createContractInSupabase 
} from "@/data/supabase_data_source"
import { ContractService } from "@/services/ContractService"
import { formatToVND } from "@/utils/currency_utils"

export default function CreateContractPage() {
  const [templates, setTemplates] = useState<SupabaseContractTemplate[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [contractData, setContractData] = useState<Record<string, string | number | boolean | Date | null>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")
  const navigate = useNavigate()

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
  const selectedTenant = tenants.find(t => t.id === selectedTenantId)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesData, tenantsData] = await Promise.all([
          fetchContractTemplatesFromSupabase(),
          fetchTenantsFromSupabase()
        ])
        setTemplates(templatesData.filter(t => t.is_active))
        setTenants(tenantsData)
      } catch (err) {
        toast("Failed to load data", {
          description: err instanceof Error ? err.message : "Unknown error"
        })
      }
    }
    fetchData()
  }, [])

  // Auto-fill data khi chọn tenant
  useEffect(() => {
    if (selectedTenant && selectedTemplate) {
      const autoFilledData: Record<string, string | number | boolean | Date | null> = {}
      
      // Auto-fill tenant data
      autoFilledData.tenant_name = selectedTenant.full_name
      autoFilledData.tenant_id_number = selectedTenant.id_number
      autoFilledData.tenant_phone = selectedTenant.phone
      autoFilledData.tenant_email = selectedTenant.email
      
      // Auto-fill apartment/building data
      if (selectedTenant.apartment && selectedTenant.building) {
        autoFilledData.apartment_number = selectedTenant.apartment.unit_number
        autoFilledData.building_name = selectedTenant.building.name
        autoFilledData.building_address = selectedTenant.building.address
        autoFilledData.rent_price = selectedTenant.apartment.price
        autoFilledData.deposit_amount = (selectedTenant.apartment as unknown as Record<string, number>).deposit || selectedTenant.apartment.price
        autoFilledData.electricity_price = (selectedTenant.apartment as unknown as Record<string, number>).electricity_price || 3500
        autoFilledData.water_price = (selectedTenant.apartment as unknown as Record<string, number>).water_price || 25000
      }
      
      // Auto-fill dates
      autoFilledData.contract_date = new Date().toISOString().slice(0, 10)
      if (selectedTenant.move_in_date) {
        autoFilledData.lease_start_date = selectedTenant.move_in_date.slice(0, 10)
      }
      if (selectedTenant.move_out_date) {
        autoFilledData.lease_end_date = selectedTenant.move_out_date.slice(0, 10)
      }
      
      // Calculate rental period if dates available
      if (autoFilledData.lease_start_date && autoFilledData.lease_end_date) {
        const start = new Date(autoFilledData.lease_start_date as string)
        const end = new Date(autoFilledData.lease_end_date as string)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
        autoFilledData.rental_period = diffMonths
      }
      
      setContractData(prev => ({ ...prev, ...autoFilledData }))
    }
  }, [selectedTenant, selectedTemplate])

  const handleFieldChange = (fieldName: string, value: string | number | boolean | Date | null) => {
    setContractData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleSave = async () => {
    if (!selectedTemplateId) {
      toast("Please select a template")
      return
    }
    
    if (!selectedTenantId) {
      toast("Please select a tenant")
      return
    }

    if (!selectedTenant?.apartment_id) {
      toast("Tenant is not assigned to any apartment")
      return
    }

    // Validate required fields
    const requiredFields = selectedTemplate?.fields.filter(f => f.required) || []
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
      const formData: ContractFormData = {
        tenant_id: selectedTenantId,
        apartment_id: selectedTenant.apartment_id,
        template_id: selectedTemplateId,
        contract_data: contractData
      }

      const newContract = await createContractInSupabase(formData)
      toast("Contract created successfully!")
      
      // Generate share link 
      const shareLink = ContractService.generateShareLink(newContract.share_token)
      toast("Share link generated", {
        description: "You can copy the link to send to tenant",
        action: {
          label: "Copy Link",
          onClick: () => {
            navigator.clipboard.writeText(shareLink)
            toast("Link copied to clipboard!")
          }
        }
      })
      
      navigate(`/contracts`)
    } catch (err) {
      toast("Failed to create contract", {
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
      if (!selectedTemplate) return
      
      setLoadingPreview(true)
      try {
        const filledContent = await ContractService.fillTemplate(selectedTemplate, contractData)
        setPreviewContent(filledContent)
      } catch (error) {
        console.error('Error generating preview:', error)
        setPreviewContent('<div class="text-red-500">Error loading preview</div>')
      } finally {
        setLoadingPreview(false)
      }
    }

    generatePreview()
  }, [selectedTemplate, contractData])

  const renderPreview = () => {
    if (!selectedTemplate) {
      return <div className="text-gray-500 italic">Please select a template to preview</div>
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

  return (
    <SidebarProvider
    style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties}>
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
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Create New Contract</h1>
                  <p className="text-gray-600 mt-1">
                    Create a rental agreement for your tenant
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || !selectedTemplateId || !selectedTenantId}
                className="flex items-center gap-2"
              >
                <IconDeviceFloppy size={16} />
                {isSaving ? "Creating..." : "Create Contract"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Contract Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template Selection */}
                  <div className="mb-4">
                    <Label className="mb-1 block">Select Template *</Label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose contract template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-gray-500">
                                {template.fields.length} fields
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tenant Selection */}
                  <div className="mb-4">
                    <Label className="mb-1 block">Select Tenant *</Label>
                    <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose tenant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            <div>
                              <div className="font-medium">{tenant.full_name}</div>
                              <div className="text-xs text-gray-500">
                                {tenant.apartment?.unit_number || "No apartment"} - {tenant.building?.name || "N/A"}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic Fields */}
                  {selectedTemplate && (
                    <div className="space-y-4 border-t pt-4">
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
                      <TabsTrigger value="info" className="flex items-center gap-2">
                        <IconShare size={16} />
                        Info
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="mt-4">
                      <div className="border rounded-lg p-4 bg-gray-50 h-96 overflow-auto">
                        {renderPreview()}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="info" className="mt-4">
                      <div className="space-y-4">
                        {selectedTenant && (
                          <div>
                            <h4 className="font-semibold mb-2">Tenant Information</h4>
                            <div className="text-sm space-y-1">
                              <div><strong>Name:</strong> {selectedTenant.full_name}</div>
                              <div><strong>ID Number:</strong> {selectedTenant.id_number || "Not provided"}</div>
                              <div><strong>Phone:</strong> {selectedTenant.phone || "Not provided"}</div>
                              <div><strong>Email:</strong> {selectedTenant.email || "Not provided"}</div>
                            </div>
                          </div>
                        )}
                        
                        {selectedTenant?.apartment && (
                          <div>
                            <h4 className="font-semibold mb-2">Apartment Information</h4>
                            <div className="text-sm space-y-1">
                              <div><strong>Unit Number:</strong> {selectedTenant.apartment.unit_number}</div>
                              <div><strong>Building:</strong> {selectedTenant.building?.name || "N/A"}</div>
                              <div><strong>Area:</strong> {selectedTenant.apartment.area}m²</div>
                              <div><strong>Monthly Rent:</strong> {formatToVND(selectedTenant.apartment.price)}/month</div>
                              <div><strong>Security Deposit:</strong> {formatToVND((selectedTenant.apartment as unknown as Record<string, number>).deposit || 0)}</div>
                            </div>
                          </div>
                        )}
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