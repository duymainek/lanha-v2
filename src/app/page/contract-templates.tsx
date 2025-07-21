import React, { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { IconPlus, IconEdit, IconTrash, IconDotsVertical, IconFileText, IconEye } from "@tabler/icons-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import type { SupabaseContractTemplate } from "@/data/types"
import { 
  fetchContractTemplatesFromSupabase,
  deleteContractTemplateFromSupabase,
  updateContractTemplateInSupabase
} from "@/data/supabase_data_source"
import { ContractTemplatePreviewModal } from "@/components/contract-template-preview-modal"

export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<SupabaseContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [previewTemplate, setPreviewTemplate] = useState<SupabaseContractTemplate | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const templatesData = await fetchContractTemplatesFromSupabase()
      setTemplates(templatesData)
    } catch (err) {
      toast("Failed to load contract templates", {
        description: err instanceof Error ? err.message : "Unknown error"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      await deleteContractTemplateFromSupabase(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast("Template deleted successfully")
    } catch (err) {
      toast("Failed to delete template", {
        description: err instanceof Error ? err.message : "Unknown error"
      })
    }
  }

  const handleToggleStatus = async (template: SupabaseContractTemplate) => {
    try {
      const updatedTemplate = await updateContractTemplateInSupabase(template.id, {
        is_active: !template.is_active
      })
      
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? updatedTemplate : t
      ))
      
      toast(`Template ${updatedTemplate.is_active ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
      toast("Failed to update template status", {
        description: err instanceof Error ? err.message : "Unknown error"
      })
    }
  }

  const handleEdit = (id: string) => {
    navigate(`/contract-templates/edit/${id}`)
  }

  const handlePreview = (template: SupabaseContractTemplate) => {
    setPreviewTemplate(template)
    setShowPreviewModal(true)
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            </div>
                  </div>
      </SidebarInset>
      
      {/* Preview Modal */}
      <ContractTemplatePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        template={previewTemplate}
      />
    </SidebarProvider>
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
              <div>
                <h1 className="text-3xl font-bold">Contract Templates</h1>
                <p className="text-gray-600 mt-1">
                  Manage contract templates for your rental agreements
                </p>
              </div>
              <Button 
                onClick={() => navigate('/contract-templates/create')}
                className="flex items-center gap-2"
              >
                <IconPlus size={16} />
                New Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <IconFileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
                  <p className="text-gray-600 mb-4">Create your first contract template to get started</p>
                  
                </div>
              ) : (
                templates.map(template => (
                  <Card key={template.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <IconDotsVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(template.id)}>
                              <IconEdit size={16} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePreview(template)}>
                              <IconEye size={16} className="mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(template.id)}
                              className="text-red-600"
                            >
                              <IconTrash size={16} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {template.fields.length} fields
                          </Badge>
                          <Badge 
                            variant={template.is_active ? "default" : "secondary"}
                          >
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status</span>
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={() => handleToggleStatus(template)}
                          />
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 