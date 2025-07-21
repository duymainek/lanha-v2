import React, { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { IconArrowLeft, IconEye, IconCode, IconDeviceFloppy, IconTrash, IconEdit, IconWand } from "@tabler/icons-react"
import type { ContractTemplateField } from "@/data/types"
import { ContractTemplateService } from "@/services/ContractTemplateService"
import { ContractService } from "@/services/ContractService"
import { createContractTemplateInSupabase } from "@/data/supabase_data_source"

export default function CreateContractTemplatePage() {
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    content: "",
    fields: [] as ContractTemplateField[]
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [editingField, setEditingField] = useState<ContractTemplateField | null>(null)
  const [showFieldDialog, setShowFieldDialog] = useState(false)
  const navigate = useNavigate()

  const handleContentChange = (content: string) => {
    setTemplateData(prev => {
      // Auto-detect fields from content
      const detectedFields = ContractTemplateService.parseFieldsFromContent(content)
      
      // Merge with existing custom fields, keeping user modifications
      const updatedFields = detectedFields.map(detectedField => {
        const existingField = prev.fields.find((f: ContractTemplateField) => f.name === detectedField.name)
        return existingField ? existingField : detectedField
      })
      
      return { ...prev, content, fields: updatedFields }
    })
  }


  const handleEditField = (field: ContractTemplateField) => {
    setEditingField({ ...field })
    setShowFieldDialog(true)
  }

  const handleSaveField = () => {
    if (!editingField) return
    
    if (!editingField.name.trim()) {
      toast("Please enter field name")
      return
    }
    
    if (!editingField.label.trim()) {
      toast("Please enter field label")
      return
    }

    // Check for duplicate field names
    const existingField = templateData.fields.find(f => f.name === editingField.name)
    const isNewField = !templateData.fields.some(f => f.name === editingField.name)
    
    if (isNewField || !existingField) {
      // Add new field
      setTemplateData(prev => ({
        ...prev,
        fields: [...prev.fields.filter(f => f.name !== editingField.name), editingField]
      }))
    } else {
      // Update existing field
      setTemplateData(prev => ({
        ...prev,
        fields: prev.fields.map(f => f.name === editingField.name ? editingField : f)
      }))
    }

    setEditingField(null)
    setShowFieldDialog(false)
    toast("Field saved successfully")
  }

  const handleRemoveField = (fieldName: string) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.name !== fieldName)
    }))
    toast("Field removed successfully")
  }

  const handleLoadSample = () => {
    const sampleTemplate = ContractTemplateService.createSampleTemplate()
    setTemplateData({
      name: "Basic Rental Agreement",
      description: "Standard rental agreement template",
      content: sampleTemplate.content,
      fields: sampleTemplate.fields
    })
    toast("Sample template loaded successfully")
  }

  const handleSave = async () => {
    if (!templateData.name.trim()) {
      toast("Please enter template name")
      return
    }
    
    if (!templateData.content.trim()) {
      toast("Please enter template content")
      return
    }

    const validation = ContractTemplateService.validateTemplate({
      ...templateData,
      id: "",
      created_at: "",
      updated_at: "",
      file_url: null,
      is_active: true
    })

    if (!validation.isValid) {
      toast("Template validation failed", {
        description: validation.errors.join(", ")
      })
      return
    }

    setIsSaving(true)
    try {
      await createContractTemplateInSupabase({
        name: templateData.name,
        description: templateData.description,
        content: templateData.content,
        fields: templateData.fields,
        file_url: null,
        is_active: true
      })
      
      toast("Template created successfully!")
      navigate(`/contract-templates`)
    } catch (err) {
      toast("Failed to create template", {
        description: err instanceof Error ? err.message : "Unknown error"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const [previewContent, setPreviewContent] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    const generatePreview = async () => {
      if (!templateData.content) {
        setPreviewContent('<div class="text-gray-500 italic">No content to preview</div>')
        return
      }

      // Create sample data for preview
      const sampleData: Record<string, string | number | boolean> = {}
      templateData.fields.forEach(field => {
        switch (field.type) {
          case 'date':
            sampleData[field.name] = new Date().toLocaleDateString('en-US')
            break
          case 'number':
            sampleData[field.name] = 1000000
            break
          default:
            sampleData[field.name] = `[${field.label}]`
        }
      })

      setLoadingPreview(true)
      try {
        const filledContent = await ContractService.fillTemplate({
          ...templateData,
          id: "",
          created_at: "",
          updated_at: "",
          file_url: null,
          is_active: true
        }, sampleData)
        setPreviewContent(filledContent)
      } catch (error) {
        console.error('Error generating preview:', error)
        setPreviewContent('<div class="text-red-500">Error loading preview</div>')
      } finally {
        setLoadingPreview(false)
      }
    }

    generatePreview()
  }, [templateData])

  const renderPreview = () => {
    if (loadingPreview) {
      return <div className="text-gray-500 italic">Loading preview...</div>
    }

    return (
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: previewContent }}
      />
    )
  }

  const renderFieldDialog = () => {
    if (!editingField) return null

    return (
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {templateData.fields.some(f => f.name === editingField.name) ? 'Edit Field' : 'Add New Field'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Field Name</Label>
                <Input
                  value={editingField.name}
                  onChange={(e) => setEditingField(prev => prev ? {...prev, name: e.target.value} : null)}
                  placeholder="e.g., tenant_name"
                />
              </div>
              <div>
                <Label>Field Label</Label>
                <Input
                  value={editingField.label}
                  onChange={(e) => setEditingField(prev => prev ? {...prev, label: e.target.value} : null)}
                  placeholder="e.g., Tenant Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Field Type</Label>
                <Select 
                  value={editingField.type} 
                  onValueChange={(value: 'text' | 'number' | 'date' | 'textarea' | 'select') => setEditingField(prev => prev ? {...prev, type: value} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={editingField.placeholder || ""}
                  onChange={(e) => setEditingField(prev => prev ? {...prev, placeholder: e.target.value} : null)}
                  placeholder="Enter placeholder text..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editingField.required}
                onCheckedChange={(checked) => setEditingField(prev => prev ? {...prev, required: checked} : null)}
              />
              <Label>Required Field</Label>
            </div>

            {editingField.type === 'select' && (
              <div>
                <Label>Options (one per line)</Label>
                <textarea
                  className="w-full h-24 p-3 border rounded-lg resize-none"
                  value={editingField.options?.map(opt => `${opt.value}:${opt.label}`).join('\n') || ''}
                  onChange={(e) => {
                    const options = e.target.value.split('\n')
                      .filter(line => line.trim())
                      .map(line => {
                        const [value, label] = line.split(':')
                        return { value: value?.trim() || '', label: label?.trim() || value?.trim() || '' }
                      })
                    setEditingField(prev => prev ? {...prev, options} : null)
                  }}
                  placeholder="value1:Label 1&#10;value2:Label 2&#10;value3:Label 3"
                />
              </div>
            )}

            <div>
              <Label>Default Value</Label>
              <Input
                value={editingField.defaultValue?.toString() || ""}
                onChange={(e) => setEditingField(prev => prev ? {...prev, defaultValue: e.target.value} : null)}
                placeholder="Enter default value..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveField}>
              Save Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                  onClick={() => navigate('/contract-templates')}
                  className="flex items-center gap-2"
                >
                  <IconArrowLeft size={16} />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Create Contract Template</h1>
                  <p className="text-gray-600 mt-1">
                    Create a new contract template with custom fields
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleLoadSample}
                  className="flex items-center gap-2"
                >
                  <IconWand size={16} />
                  Load Sample
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <IconDeviceFloppy size={16} />
                  {isSaving ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Template Info & Field Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={templateData.name}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={templateData.description}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description..."
                    />
                  </div>

                  {/* Field Management */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-semibold">
                        Template Fields ({templateData.fields.length})
                      </Label>
                    </div>
                    
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {templateData.fields.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No fields detected</p>
                          <p className="text-xs">Add content with placeholders or create custom fields</p>
                        </div>
                      ) : (
                        templateData.fields.map(field => (
                          <div key={field.name} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{field.label}</div>
                              <div className="text-xs text-gray-500 truncate">{`{${field.name}}`}</div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditField(field)}
                                className="h-6 w-6 p-0"
                              >
                                <IconEdit size={12} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveField(field.name)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <IconTrash size={12} />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCode size={20} />
                    Template Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="editor" className="flex items-center gap-2">
                        <IconCode size={16} />
                        Editor
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="flex items-center gap-2">
                        <IconEye size={16} />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="editor" className="mt-4">
                      <div className="space-y-2">
                        <Label>HTML Content</Label>
                        <textarea
                          className="w-full h-96 p-3 border rounded-lg font-mono text-sm resize-none"
                          value={templateData.content}
                          onChange={(e) => handleContentChange(e.target.value)}
                          placeholder="Enter HTML template content...
Use placeholders like {field_name} to mark fields that will be filled with data.

Example:
<h1>RENTAL AGREEMENT</h1>
<p>Tenant Name: {tenant_name}</p>
<p>Unit Number: {apartment_number}</p>
<p>Monthly Rent: {rent_price}</p>"
                        />
                        <div className="text-xs text-gray-500">
                          Use placeholders like {"{field_name}"} to mark fields. 
                          The system will automatically detect and create corresponding fields.
                        </div>
                      </div>
                    </TabsContent>
                    
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
      
      {/* Field Management Dialog */}
      {renderFieldDialog()}
    </SidebarProvider>
  )
} 