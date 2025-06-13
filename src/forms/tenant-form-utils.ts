import type { Tenant, Room } from "@/data/types"
import type { EditSheetField } from "@/components/ui/edit-sheet"
import { addTenantToSupabase, updateTenantInSupabase } from "@/data/supabase_data_source"
import { toast } from "sonner"

/**
 * Sinh fields động cho EditSheet Tenant
 */
export function getTenantFields(tenant: Tenant | null, roomList: Room[]): EditSheetField[] {
  const now = new Date()
  const nowStr = now.toISOString().slice(0, 10)
  const getNextAvailableDate = (apartmentId?: number | null) => {
    if (!apartmentId) return null
    const room = roomList.find(r => r.id === apartmentId)
    return room?.next_available_date || null
  }
  const defaultMoveOut = (apartmentId?: number | null) => {
    const next = getNextAvailableDate(apartmentId)
    if (next) return next.slice(0, 10)
    const d = new Date(now)
    d.setMonth(d.getMonth() + 12)
    return d.toISOString().slice(0, 10)
  }
  return [
    { label: "Room", name: "apartment_id", value: tenant?.apartment_id ? String(tenant.apartment_id) : "", type: "select", required: true, options: roomList.map(r => ({ value: String(r.id), label: `${r.unit_number} (${r.building?.name || "Building"})` })) },
    { label: "Full Name", name: "full_name", value: tenant?.full_name || "", autoComplete: "off", required: true },
    { label: "Phone", name: "phone", value: tenant?.phone || "", autoComplete: "off" },
    { label: "Email", name: "email", value: tenant?.email || "", autoComplete: "off" },
    { label: "ID Number", name: "id_number", value: tenant?.id_number || "", autoComplete: "off" },
    { label: "Nationality", name: "nationality", value: tenant?.nationality || "", autoComplete: "off" },
    { label: "Move In", name: "move_in_date", value: tenant?.move_in_date ? tenant.move_in_date.slice(0, 10) : nowStr, type: "date", autoComplete: "off" },
    { label: "Move Out", name: "move_out_date", value: tenant?.move_out_date ? tenant.move_out_date.slice(0, 10) : defaultMoveOut(tenant?.apartment_id), type: "date", autoComplete: "off" },
    { label: "Primary", name: "is_primary", value: tenant?.tenant_type === "primary", type: "checkbox" },
    { label: "Notes", name: "notes", value: tenant?.notes || "", autoComplete: "off" },
  ]
}

/**
 * Xử lý lưu tenant (add/edit), dùng chung cho EditSheet và QuickCreate
 */
export async function handleTenantSave(
  values: Record<string, string>,
  mode: "add" | "edit",
  editingTenant: Tenant | null,
  setData?: (fn: (prev: Tenant[]) => Tenant[]) => void,
  options?: { onSuccess?: () => void, onError?: (err: unknown) => void }
): Promise<void> {
  try {
    if (  !values.full_name ) {
      toast("Please fill in all required fields")
      options?.onError?.(new Error("Missing required fields"))
      return
    }
    const payload = {
      ...values,
      apartment_id: values.apartment_id ? Number(values.apartment_id) : null,
      move_in_date: values.move_in_date,
      move_out_date: values.move_out_date,
      tenant_type: values.is_primary === 'true' ? 'primary' : 'dependent',
      notes: values.notes,
    }
    if (mode === "add") {
      await addTenantToSupabase(payload)
      toast.success("Tenant added successfully")
      if (setData) setData(prev => [...prev, payload as unknown as Tenant])
    } else if (mode === "edit" && editingTenant) {
      await updateTenantInSupabase(editingTenant.id, payload)
      toast.success("Tenant updated successfully")
      if (setData) setData(prev => prev.map(t => t.id === editingTenant.id ? { ...t, ...payload } : t))
    }
    options?.onSuccess?.()
  } catch (err) {
    toast("Failed to save tenant", { description: err instanceof Error ? err.message : "Unknown error" })
    options?.onError?.(err)
  }
} 