import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Room, SupabaseTenant, InvoiceItem, SupabaseInvoiceRaw } from "@/data/types"
import { fetchUtilityReadingsByApartment } from '@/data/supabase_data_source'
import { formatToVND } from "@/utils/currency_utils"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { handleInvoiceSave } from "@/forms/invoice-form-utils"

export interface InvoiceForm {
  apartment_id: number | null
  tenant_id: string | null
  issue_date: string
  due_date: string
  invoice_number: string
  status: string
  items: InvoiceItem[]
  additional_fees?: number
  discounts?: number
  notes?: string
  total: number
  subtotal: number
}

interface RoomWithTenants extends Room {
  tenants?: SupabaseTenant[];
}

interface RoomOption {
  label: string;
  value: number;
  room: RoomWithTenants;
}
interface TenantOption {
  label: string;
  value: string;
  tenant?: SupabaseTenant;
}

interface AddInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (invoice: InvoiceForm) => void
  onCancel?: () => void
  roomOptions?: RoomOption[]
  tenantOptions?: TenantOption[]
}

function genInvoiceNumber(room: RoomWithTenants | undefined, issueDate: string): string {
  if (!room || !issueDate) return '';
  const month = String(new Date(issueDate).getMonth() + 1).padStart(2, '0');
  const year = String(new Date(issueDate).getFullYear()).slice(-2);
  return `INV-${month}-${year}-${room.building_id}-${room.id}`;
}

export function AddInvoiceDialog({
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  roomOptions = [],
  tenantOptions = [],
}: AddInvoiceDialogProps) {
  const defaultForm: InvoiceForm = {
    apartment_id: null,
    tenant_id: null,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoice_number: "",
    status: "unpaid",
    items: [],
    additional_fees: 0,
    discounts: 0,
    notes: "",
    total: 0,
    subtotal: 0,
  };
  const [form, setForm] = React.useState<InvoiceForm>(defaultForm)
  const [loadingRoom, setLoadingRoom] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Khi chọn phòng, tự động khởi tạo items mặc định
  const handleApartmentChange = async (apartmentId: number) => {
    const room = roomOptions.find((r: RoomOption) => r.value === apartmentId)?.room;
    let tenantId: string | null = null;
    if (room && tenantOptions && Array.isArray(tenantOptions)) {
      const primaryTenant = tenantOptions.find(
        (t) => t.tenant?.apartment_id === room.id && t.tenant?.is_primary
      );
      tenantId = primaryTenant ? primaryTenant.value : null;
    }
    setLoadingRoom(true);
    try {
      const utilityReadings = await fetchUtilityReadingsByApartment(apartmentId);
      const defaultItems: InvoiceItem[] = [];
      defaultItems.push({
        id: 0,
        invoice_id: 0,
        item_type: "rent",
        description: "Rent",
        quantity: 1,
        unit_price: room?.price || 0,
        total: room?.price || 0,
        previous_reading: undefined,
        current_reading: undefined,
        discount: undefined,
        created_at: undefined,
      });
      defaultItems.push({
        id: 0,
        invoice_id: 0,
        item_type: "electricity",
        description: "Electricity",
        quantity: 0,
        unit_price: room?.electricity_price || 0,
        total: 0,
        previous_reading: utilityReadings.electricity?.reading_value ?? 0,
        current_reading: utilityReadings.electricity?.reading_value ?? 0,
        discount: undefined,
        created_at: undefined,
      });
      defaultItems.push({
        id: 0,
        invoice_id: 0,
        item_type: "water",
        description: "Water",
        quantity: utilityReadings.water?.reading_value??1,
        unit_price: room?.water_price || 0,
        total: (utilityReadings.water?.reading_value || 1) * (room?.water_price || 80000),
        previous_reading: undefined,
        current_reading: undefined,
        discount: undefined,
        created_at: undefined,
      });
      setForm(f => ({
        ...f,
        apartment_id: apartmentId,
        tenant_id: tenantId,
        invoice_number: genInvoiceNumber(room, f.issue_date),
        items: defaultItems,
        total: defaultItems.reduce((sum, i) => sum + (i.total || 0), 0) + (form.additional_fees || 0) - (form.discounts || 0),
        subtotal: defaultItems.reduce((sum, i) => sum + (i.total || 0), 0),
      }));
    } finally {
      setLoadingRoom(false);
    }
  };

  const handleItemChange = (idx: number, key: keyof InvoiceItem, value: string | number) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [key]: value };
      if(key === 'current_reading'){
        items[idx].quantity = Number(value) - Number(items[idx].previous_reading);
        items[idx].total = items[idx].quantity * items[idx].unit_price;
      }
      if (key === 'quantity' ) {
        const q = Number(items[idx].quantity) || 0;
        const u = Number(items[idx].unit_price) || 0;
        items[idx].total = q * u;
      }
      f.total = items.reduce((sum, i) => sum + (i.total || 0), 0) + (f.additional_fees || 0) - (f.discounts || 0);
      f.subtotal = items.reduce((sum, i) => sum + (i.total || 0), 0);
      return { ...f, items };
    });
  };
  const handleRemoveItem = (idx: number) => {
    setForm(f => {
      const items = [...f.items];
      items.splice(idx, 1);
      return { ...f, items };
    });
  };

  const handleIssueDateChange = (date: string) => {
    setForm(f => {
      const room = roomOptions.find((r: RoomOption) => r.value === f.apartment_id)?.room;
      return {
        ...f,
        issue_date: date,
        invoice_number: genInvoiceNumber(room, date),
      };
    });
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    form.items.forEach((item, idx) => {
      if (Number(item.quantity) < 0) {
        errors.push(`Item #${idx + 1} (${item.description}): Quantity must be greater than or equal to 0.`)
      }
      if (Number(item.unit_price) < 0) {
        errors.push(`Item #${idx + 1} (${item.description}): Unit price must be greater than or equal to 0.`)
      }
      if ((item.item_type === 'electricity' || item.item_type === 'water') && item.previous_reading !== undefined && item.current_reading !== undefined) {
        if (Number(item.current_reading) < Number(item.previous_reading)) {
          errors.push(`Item #${idx + 1} (${item.description}): Current reading must be greater than or equal to previous reading.`)
        }
      }
    });
    if (form.discounts !== undefined && Number(form.discounts) < 0) {
      errors.push('Discounts cannot be negative.')
    }
    if (form.additional_fees !== undefined && Number(form.additional_fees) < 0) {
      errors.push('Additional fees cannot be negative.')
    }
    return errors;
  }

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error('Please fix the errors below:', {
        description: <ul className="list-disc pl-5">
          {errors.map((err, idx) => <li key={idx}>{err}</li>)}
        </ul>
      });
      setIsSubmitting(false);
      return;
    }
    // Mapping dữ liệu sang values cho util
    const values = {
      apartment_id: form.apartment_id ? Number(form.apartment_id) : null,
      tenant_id: form.tenant_id || null,
      invoice_number: form.invoice_number,
      issue_date: form.issue_date,
      due_date: form.due_date,
      status: form.status,
      total: Number(form.total),
      notes: form.notes || "",
      invoice_items: form.items,
      subtotal: Number(form.subtotal),
      additional_fees: form.additional_fees ? Number(form.additional_fees) : 0,
      discounts: form.discounts ? Number(form.discounts) : 0,
    } as SupabaseInvoiceRaw
    handleInvoiceSave(
      values,
      "add",
      null,
      {
        onSuccess: () => {
          onSubmit(form)
          setIsSubmitting(false)
          resetForm()
        },
        onError: () => setIsSubmitting(false),
      }
    )
  }

  const resetForm = () => {
    setForm(defaultForm);
    setLoadingRoom(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) resetForm();
      onOpenChange(o);
    }}>
      <DialogContent
        className="w-[78vw] max-w-none max-h-[80vh] flex flex-col px-12 py-8"
        style={{ width: '78vw', maxWidth: '78vw',  margin: '0 auto', borderRadius: 16 }}
      >
        <DialogHeader>
          <DialogTitle>Add Invoice</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-2 hide-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-1">Apartment</label>
              <Select value={form.apartment_id ? String(form.apartment_id) : ""} onValueChange={v => handleApartmentChange(Number(v))} >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {roomOptions.map((opt: RoomOption) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <Input value={form.invoice_number} readOnly />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4 md:col-span-2">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <Input type="date" value={form.issue_date} onChange={e => handleIssueDateChange(e.target.value)} />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Tenant</label>
                <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{form.tenant_id ? tenantOptions.find((t: TenantOption) => t.value === form.tenant_id)?.label || "" : ""}</div>
              </div>
            </div>
          </div>
          {loadingRoom ? (
            <div className="flex flex-col gap-6 my-8">
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-32 w-full mb-2" />
              <Skeleton className="h-8 w-1/4 mb-2" />
              <Skeleton className="h-32 w-full mb-2" />
              <Skeleton className="h-8 w-1/4 mb-2" />
              <Skeleton className="h-20 w-full mb-2" />
            </div>
          ) : (
            <>
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
                      {form.items.filter(i => i.item_type === 'rent').map((item, idx) => (
                        <tr key={idx} className="border-t border-border-color">
                          <td className="px-4 py-2 text-sm">{item.item_type}</td>
                          <td className="px-4 py-2 text-sm">
                            {item.description}
                          </td>
                          <td className="px-4 py-2 text-center text-sm">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            {formatToVND(item.unit_price)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-semibold">
                            {formatToVND(item.total)}
                          </td>
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
                        <th className="px-2 py-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items
                        .map((item, idx) => ({ item, idx }))
                        .filter(({ item }) => item.item_type !== 'rent')
                        .map(({ item, idx }) => (
                          <tr key={idx} className="border-t border-border-color">
                            <td className="px-4 py-2 text-sm text-center">{item.item_type}</td>
                            <td className="px-4 py-2 text-sm text-center">{item.description}</td>
                            <td className="px-4 py-2 text-sm text-center">
                              {(item.item_type === 'electricity') ? (
                                <Input 
                                  type="number" 
                                  value={item.previous_reading ?? ''} 
                                  onChange={e => handleItemChange(idx, 'previous_reading', Number(e.target.value))} 
                                  className="h-7 text-xs w-24 mx-auto text-center" 
                                />
                              ) : ''}
                            </td>
                            <td className="px-4 py-2 text-sm text-center">
                              {(item.item_type === 'electricity' ) ? (
                                <Input 
                                  type="number" 
                                  value={item.current_reading ?? ''} 
                                  onChange={e => handleItemChange(idx, 'current_reading', Number(e.target.value))} 
                                  className="h-7 text-xs w-24 mx-auto text-center" 
                                />
                              ) : ''}
                            </td>
                            <td className="px-4 py-2 text-sm text-center">
                              {(item.item_type === 'water') ? (
                                <Input 
                                  type="number" 
                                  value={item.quantity} 
                                  min={0} 
                                  onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))} 
                                  className="h-7 text-xs w-24 mx-auto text-center" 
                                />
                              ) : item.quantity}
                            </td>
                            <td className="px-4 py-2 text-sm text-center">
                              {formatToVND(item.unit_price)}
                            </td>
                            <td className="px-4 py-2 text-sm text-center font-semibold">{formatToVND(item.total)}</td>
                            <td className="px-2 py-2 text-center">
                              {(item.item_type === 'service' || item.item_type === 'other') && (
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}><span className="text-red-500">✕</span></Button>
                              )}
                            </td>
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
                    <Input type="number" value={form.additional_fees ?? 0} min={0} onChange={e => {
                      setForm(f => {
                        const newForm = { ...f, additional_fees: Number(e.target.value) };
                        newForm.total = newForm.subtotal + newForm.additional_fees - (newForm.discounts ?? 0);
                        newForm.total = newForm.subtotal + newForm.additional_fees - (newForm.discounts ?? 0);
                        return newForm;
                      });
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discounts</label>
                    <Input type="number" value={form.discounts ?? 0} min={0} onChange={e => {
                      setForm(f => {
                        const newForm = { ...f, discounts: Number(e.target.value) };
                        newForm.total = newForm.subtotal + (newForm.additional_fees ?? 0) - (newForm.discounts ?? 0);
                        return newForm;
                      });
                    }} />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 mt-4 mb-8">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea className="w-full border rounded-md p-2 min-h-[48px] text-sm" placeholder="Add any additional notes here..." value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 border-t border-border-color pt-4">
                <div className="flex flex-col items-start">
                  <div className="text-sm text-muted-foreground">Subtotal</div>
                  <div className="text-lg font-semibold">{formatToVND(form.subtotal)}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-base">Total <span className="font-bold">{formatToVND(form.total)}</span></div>
                  <div className="flex flex-row gap-2 mt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" onClick={() => { resetForm(); if (onCancel) onCancel(); }}>Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Invoice
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 