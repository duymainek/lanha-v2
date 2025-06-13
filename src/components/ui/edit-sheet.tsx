import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface EditSheetField {
  label: string
  name: string
  value: string | boolean
  type?: string
  autoComplete?: string
  required?: boolean
  options?: Array<{ value: string | number; label: string }>
}

interface EditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSave: (values: Record<string, string>) => void
  fields: EditSheetField[]
  saveLabel?: string
  closeLabel?: string
  loading?: boolean
}

export function EditSheet({
  open,
  onOpenChange,
  title,
  description,
  onSave,
  fields,
  saveLabel = "Save changes",
  closeLabel = "Close",
  loading = false,
}: EditSheetProps) {
  const [formState, setFormState] = React.useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {}
    fields.forEach(f => { initial[f.name] = f.value })
    return initial
  })

  React.useEffect(() => {
    // Reset state khi fields thay đổi (mở sheet mới)
    const initial: Record<string, string | boolean> = {}
    fields.forEach(f => { initial[f.name] = f.value })
    setFormState(initial)
  }, [fields, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })
  }

  const handleSave = () => {
    // Convert all values to string for onSave
    const stringValues: Record<string, string> = {}
    Object.keys(formState).forEach(key => {
      stringValues[key] = typeof formState[key] === 'boolean' ? String(formState[key]) : (formState[key] as string)
    })
    onSave(stringValues)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {fields.map((field) => (
            <div className="grid gap-3" key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === 'select' && field.options ? (
                <Select value={formState[field.name] as string} onValueChange={v => setFormState({ ...formState, [field.name]: v })} >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt: { value: string | number; label: string }) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              ) : field.type === 'checkbox' ? (
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={!!formState[field.name]}
                  onCheckedChange={checked => setFormState({ ...formState, [field.name]: !!checked })}
                />
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  value={formState[field.name] as string}
                  onChange={handleInputChange}
                  type={field.type || "text"}
                  autoComplete={field.autoComplete}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>
        <SheetFooter>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saveLabel}
          </Button>
          <SheetClose asChild>
            <Button variant="outline" type="button" disabled={loading}>{closeLabel}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 