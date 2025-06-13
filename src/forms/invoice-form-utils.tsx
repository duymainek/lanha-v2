import type { SupabaseInvoiceRaw, Room, Tenant, SupabaseTenant } from "@/data/types"
import type { EditSheetField } from "@/components/ui/edit-sheet"
import { addInvoiceToSupabase, updateInvoiceInSupabase } from "@/data/supabase_data_source"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatToVND } from "@/utils/currency_utils"

interface RoomOption {
  label: string;
  value: number;
  room: Room;
}
interface TenantOption {
  label: string;
  value: string;
  tenant?: SupabaseTenant;
}

interface ViewInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: SupabaseInvoiceRaw
  roomOptions?: RoomOption[]
  tenantOptions?: TenantOption[]
}

export function ViewInvoiceDialog({
  open,
  onOpenChange,
  invoice ,
  roomOptions = [],
  tenantOptions = [],
}: ViewInvoiceDialogProps) {
  if (!invoice) return null;
  console.log('invoice', invoice)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[78vw] max-w-none max-h-[80vh] flex flex-col px-12 py-8"
        style={{ width: '78vw', maxWidth: '78vw',  margin: '0 auto', borderRadius: 16 }}
      >
        <DialogHeader>
          <DialogTitle>Invoice Detail</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-2 hide-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-1">Apartment</label>
              <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">
                {invoice.apartment_id ? roomOptions.find((r) => r.value === invoice.apartment_id)?.label || '' : ''}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{invoice.invoice_number}</div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4 md:col-span-2">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{invoice.issue_date}</div>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{invoice.due_date}</div>
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Tenant</label>
                <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{invoice.tenant_id ? tenantOptions.find((t) => t.value === invoice.tenant_id)?.label || '' : ''}</div>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <div className="mb-4">
              <div className="font-semibold mb-1">Rent</div>
              <table className="min-w-full border border-border-color rounded-lg bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Description</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase">Unit Price</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoice_items.filter(i => i.item_type === 'rent').map((item, idx) => (
                    <tr key={idx} className="border-t border-border-color">
                      <td className="px-4 py-2 text-sm">{item.item_type}</td>
                      <td className="px-4 py-2 text-sm">{item.description}</td>
                      <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-sm">{formatToVND(item.unit_price)}</td>
                      <td className="px-4 py-2 text-right text-sm font-semibold">{formatToVND(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-1">Additional Items</div>
              <table className="min-w-full border border-border-color rounded-lg bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-center">Type</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-center">Description</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-center">Prev</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-center">Current</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-center">Quantity</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-center">Unit Price</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoice_items
                    .filter(item => item.item_type !== 'rent')
                    .map((item, idx) => (
                      <tr key={idx} className="border-t border-border-color">
                        <td className="px-4 py-2 text-sm text-center">{item.item_type}</td>
                        <td className="px-4 py-2 text-sm text-center">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-center">{item.item_type === 'electricity' ? item.previous_reading ?? '' : ''}</td>
                        <td className="px-4 py-2 text-sm text-center">{item.item_type === 'electricity' ? item.current_reading ?? '' : ''}</td>
                        <td className="px-4 py-2 text-sm text-center">{item.item_type === 'water' ? item.quantity : item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-center">{formatToVND(item.unit_price)}</td>
                        <td className="px-4 py-2 text-sm text-center font-semibold">{formatToVND(item.total)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t border-border-color pt-4 mt-4 mb-6">
            <div className="font-semibold mb-2">Additional Charges</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-1">Additional Fees</label>
                <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{invoice.additional_fees ?? 0}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discounts</label>
                <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{invoice.discounts ?? 0}</div>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 mt-4 mb-8">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <div className="w-full border rounded-md p-2 min-h-[48px] text-sm bg-muted">{invoice.notes ?? ''}</div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 border-t border-border-color pt-4">
            <div className="flex flex-col items-start">
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <div className="text-lg font-semibold">{formatToVND(invoice.subtotal)}</div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-base">Total <span className="font-bold">{formatToVND(invoice.total)}</span></div>
              <div className="flex flex-row gap-2 mt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Đóng</Button>
                </DialogClose>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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