import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconX, IconEye, IconCode, IconFileText } from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SupabaseContractTemplate } from "@/data/types"
import { ContractService } from "@/services/ContractService"

interface ContractTemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  template: SupabaseContractTemplate | null
}

export function ContractTemplatePreviewModal({
  isOpen,
  onClose,
  template
}: ContractTemplatePreviewModalProps) {
  const [previewContent, setPreviewContent] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    const generatePreview = async () => {
      if (!template || !template.content) {
        setPreviewContent('<div class="text-gray-500 italic">No content to preview</div>')
        return
      }

      // Create sample data for preview
      const sampleData: Record<string, string | number | boolean> = {}
      template.fields.forEach(field => {
        switch (field.type) {
          case 'date':
            sampleData[field.name] = new Date().toLocaleDateString('en-US')
            break
          case 'number':
            sampleData[field.name] = field.name.includes('price') ? 1500000 : 
                                     field.name.includes('deposit') ? 3000000 :
                                     field.name.includes('period') ? 12 : 1000000
            break
          default:
            sampleData[field.name] = `[Sample ${field.label}]`
        }
      })

      setLoadingPreview(true)
      try {
        const filledContent = await ContractService.fillTemplate(template, sampleData)
        setPreviewContent(filledContent)
      } catch (error) {
        console.error('Error generating preview:', error)
        setPreviewContent('<div class="text-red-500">Error loading preview</div>')
      } finally {
        setLoadingPreview(false)
      }
    }

    if (isOpen && template) {
      generatePreview()
    }
  }, [template, isOpen])

  if (!template) return null

  const renderPreview = () => {
    if (loadingPreview) {
      return <div className="text-gray-500 italic p-4">Loading preview...</div>
    }

    return (
      <div 
        className="prose prose-sm max-w-none bg-white p-4 rounded-lg border"
        dangerouslySetInnerHTML={{ __html: previewContent }}
      />
    )
  }

  const renderRawContent = () => {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
          {template.content || 'No content'}
        </pre>
      </div>
    )
  }

  const renderFields = () => {
    if (template.fields.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <IconFileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No fields detected in this template</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {template.fields.map((field, index) => (
          <div key={field.name} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-700">{index + 1}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{field.label}</span>
                <Badge variant="outline" className="text-xs">
                  {field.type}
                </Badge>
                {field.required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {`{${field.name}}`}
              </div>
              {field.placeholder && (
                <div className="text-xs text-gray-600 mt-1">
                  Placeholder: "{field.placeholder}"
                </div>
              )}
              {field.defaultValue && (
                <div className="text-xs text-gray-600 mt-1">
                  Default: "{field.defaultValue}"
                </div>
              )}
              {field.options && field.options.length > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  Options: {field.options.map(opt => opt.label).join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{template.name}</DialogTitle>
              {template.description && (
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <IconX size={16} />
            </Button>
          </div>
          
          {/* Template Stats */}
          <div className="flex items-center gap-4 pt-2">
            <Badge variant="outline">
              {template.fields.length} fields
            </Badge>
            <Badge variant={template.is_active ? "default" : "secondary"}>
              {template.is_active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-xs text-gray-500">
              Created: {new Date(template.created_at).toLocaleDateString('en-US')}
            </span>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="preview" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <IconEye size={16} />
                Preview
              </TabsTrigger>
              <TabsTrigger value="fields" className="flex items-center gap-2">
                <IconFileText size={16} />
                Fields ({template.fields.length})
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex items-center gap-2">
                <IconCode size={16} />
                Raw HTML
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
              {renderPreview()}
            </TabsContent>
            
            <TabsContent value="fields" className="flex-1 overflow-auto mt-4">
              {renderFields()}
            </TabsContent>
            
            <TabsContent value="raw" className="flex-1 overflow-auto mt-4">
              {renderRawContent()}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
} 