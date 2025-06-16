import type { SupabaseInvoiceRaw, Room, Tenant } from "@/data/types"
import type { EditSheetField } from "@/components/ui/edit-sheet"
import { addInvoiceToSupabase, updateInvoiceInSupabase } from "@/data/supabase_data_source"
import { toast } from "sonner"

export function getInvoiceFields(invoice: SupabaseInvoiceRaw | null, roomList: Room[], tenantList: Tenant[]): EditSheetField[] {
  return [
    {
      label: "Room",
      name: "apartment_id",
      value: invoice?.apartment_id ? String(invoice.apartment_id) : "",
      type: "select",
      required: true,
      options: roomList.map(r => ({ value: r.id, label: `${r.building?.name || ''} - ${r.unit_number}` }))
    },
    {
      label: "Tenant",
      name: "tenant_id",
      value: invoice?.tenant_id || "",
      type: "select",
      required: true,
      options: tenantList.map(t => ({ value: t.id, label: t.full_name }))
    },
    {
      label: "Invoice Number",
      name: "invoice_number",
      value: invoice?.invoice_number || "",
      type: "text",
      required: true,
    },
    {
      label: "Issue Date",
      name: "issue_date",
      value: invoice?.issue_date || new Date().toISOString().slice(0, 10),
      type: "date",
      required: true,
    },
    {
      label: "Due Date",
      name: "due_date",
      value: invoice?.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      type: "date",
      required: true,
    },
    {
      label: "Status",
      name: "status",
      value: invoice?.status || "unpaid",
      type: "select",
      required: true,
      options: [
        { value: "unpaid", label: "Unpaid" },
        { value: "paid", label: "Paid" },
        { value: "overdue", label: "Overdue" },
      ]
    },
    {
      label: "Total",
      name: "total",
      value: invoice?.total ? String(invoice.total) : "",
      type: "number",
      required: true,
    },
    {
      label: "Notes",
      name: "notes",
      value: invoice?.notes || "",
      type: "text",
      required: false,
    },
  ]
}

export async function handleInvoiceSave(
  values: SupabaseInvoiceRaw,
  mode: "add" | "edit",
  editingInvoice: SupabaseInvoiceRaw | null,
  options?: { onSuccess?: () => void, onError?: (err: unknown) => void }
): Promise<void> {
  try {
    if (!values.apartment_id || !values.tenant_id || !values.invoice_number || !values.issue_date || !values.due_date || !values.status || !values.total) {
      toast("Please fill in all required fields")
      options?.onError?.(new Error("Missing required fields"))
      return
    }
   
    if (mode === "add") {
      await addInvoiceToSupabase(values)
      toast.success("Invoice added successfully")
    } else if (mode === "edit" && editingInvoice) {
      await updateInvoiceInSupabase(editingInvoice.id, values)
      toast.success("Invoice updated successfully")
    }
    options?.onSuccess?.()
  } catch (err) {
    toast("Failed to save invoice", { description: err instanceof Error ? err.message : "Unknown error" })
    options?.onError?.(err)
  }
} 