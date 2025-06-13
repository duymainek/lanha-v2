import { useEffect, useState } from "react"
import { EditSheet } from "@/components/ui/edit-sheet"
import { QuickCreateService } from "@/services/QuickCreateService"
import type { QuickCreateSheetState } from "@/services/QuickCreateService"
import { getTenantFields, handleTenantSave } from "@/forms/tenant-form-utils"
import { fetchRoomsFromSupabase, fetchBuildingsFromSupabase, fetchTenantsFromSupabase } from "@/data/supabase_data_source"
import type { Room, SupabaseBuilding, Tenant } from "@/data/types"
import { getExpenseFields, handleExpenseSave } from "@/forms/expense-form-utils"
import { AddInvoiceDialog } from "@/components/invoice/add-invoice-dialog"

export function QuickCreateSheet() {
  const [state, setState] = useState<QuickCreateSheetState>({ open: false })
  const [roomList, setRoomList] = useState<Room[]>([])
  const [buildingList, setBuildingList] = useState<SupabaseBuilding[]>([])
  const [tenantList, setTenantList] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false)

  useEffect(() => {
    const unsub = QuickCreateService.subscribe(setState)
    return () => unsub()
  }, [])

  useEffect(() => {
    if (state.open && state.type === "tenant") {
      setLoading(true)
      fetchRoomsFromSupabase().then(list => setRoomList(list)).finally(() => setLoading(false))
    }
    if (state.open && state.type === "expenses") {
      setLoading(true)
      fetchBuildingsFromSupabase().then(list => setBuildingList(list)).finally(() => setLoading(false))
    }
    if (state.open && state.type === "invoice") {
      setLoading(true)
      Promise.all([
        fetchRoomsFromSupabase(),
        fetchTenantsFromSupabase()
      ]).then(([rooms, tenants]) => {
        setRoomList(rooms)
        setTenantList(tenants)
        setOpenInvoiceDialog(true)
      }).finally(() => setLoading(false))
    } else if (!state.open) {
      setOpenInvoiceDialog(false)
    }
  }, [state.open, state.type])

  if (!state.open) return null

  if (state.type === "tenant") {
    return (
      <EditSheet
        open={state.open}
        onOpenChange={(open) => { if (!open) QuickCreateService.close() }}
        title={state.title || "Quick Create Tenant"}
        description={state.description}
        fields={getTenantFields(null, roomList)}
        saveLabel={state.saveLabel}
        closeLabel={state.closeLabel}
        loading={loading || state.loading}
        onSave={async (values) => {
          setLoading(true)
          await handleTenantSave(
            values,
            "add",
            null,
            undefined,
            {
              onSuccess: () => {
                QuickCreateService.close()
              },
              onError: () => {},
            }
          )
          setLoading(false)
        }}
      />
    )
  }

  if (state.type === "expenses") {
    return (
      <EditSheet
        open={state.open}
        onOpenChange={(open) => { if (!open) QuickCreateService.close() }}
        title={state.title || "Quick Create Expense"}
        description={state.description}
        fields={getExpenseFields(null, buildingList)}
        saveLabel={state.saveLabel}
        closeLabel={state.closeLabel}
        loading={loading || state.loading}
        onSave={async (values) => {
          setLoading(true)
          await handleExpenseSave(
            values,
            "add",
            null,
            undefined,
            {
              onSuccess: () => {
                QuickCreateService.close()
              },
              onError: () => {},
            }
          )
          setLoading(false)
        }}
      />
    )
  }

  if (state.type === "invoice") {
    // Chuẩn hóa roomOptions, tenantOptions cho AddInvoiceDialog
    const roomOptions = roomList.map(room => ({
      label: `${room.building?.name || ''} - ${room.unit_number}`,
      value: room.id,
      room,
    }))
    const tenantOptions = tenantList.map(tenant => ({
      label: tenant.full_name,
      value: tenant.id,
      tenant,
    }))
    return (
      <AddInvoiceDialog
        open={openInvoiceDialog}
        onOpenChange={(open) => {
          setOpenInvoiceDialog(open)
          if (!open) QuickCreateService.close()
        }}
        onSubmit={() => {
          setOpenInvoiceDialog(false)
          QuickCreateService.close()
        }}
        roomOptions={roomOptions}
        tenantOptions={tenantOptions}
      />
    )
  }

  // Các type khác giữ nguyên logic cũ
  return (
    <EditSheet
      open={state.open}
      onOpenChange={(open) => { if (!open) QuickCreateService.close() }}
      title={state.title || "Quick Create"}
      description={state.description}
      fields={state.fields || []}
      saveLabel={state.saveLabel}
      closeLabel={state.closeLabel}
      loading={state.loading}
      onSave={async (values) => {
        if (state.onSave) await state.onSave(values)
        QuickCreateService.close()
      }}
    />
  )
} 