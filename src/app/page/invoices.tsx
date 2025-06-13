import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TablePro } from "@/components/ui/table-pro"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { IconDotsVertical, IconPlus } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { fetchInvoicesFromSupabase, fetchRoomsFromSupabase, fetchTenantsFromSupabase, removeInvoiceFromSupabase, updateInvoiceStatusInSupabase } from "@/data/supabase_data_source"
import { AddInvoiceDialog } from "@/components/invoice/add-invoice-dialog"
import { EditInvoiceDialog } from "@/components/invoice/edit-invoice-dialog"
import { toast } from "sonner"
import { formatToVND } from "@/utils/currency_utils"
import { formatDateToDDMMYYYY } from "@/utils/date_utils"
import type { SupabaseInvoiceRaw, Room, Tenant, InvoiceItem } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import FilterDropdown from "@/components/ui/filter-dropdown"
import { ViewInvoiceDialog } from "@/forms/invoice-form-utils"

function InvoiceStatusBadge({ status }: { status: string }) {
  let color = "";
  let label = status;
  switch (status) {
    case "paid":
      color = "bg-green-100 text-green-700 border-green-200";
      label = "Paid";
      break;
    case "overdue":
      color = "bg-red-100 text-red-700 border-red-200";
      label = "Overdue";
      break;
    default:
      color = "bg-yellow-50 text-yellow-700 border-yellow-200";
      label = "Unpaid";
  }
  return <Badge className={color + " px-2 py-1 border"}>{label}</Badge>;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<SupabaseInvoiceRaw[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<SupabaseInvoiceRaw | null>(null)
  const [roomOptions, setRoomOptions] = useState<{ label: string; value: number; room: Room }[]>([])
  const [tenantOptions, setTenantOptions] = useState<{ label: string; value: string; tenant: Tenant }[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string[]>(["all"])
  const [selectedStatus, setSelectedStatus] = useState<string[]>(["all"])
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<SupabaseInvoiceRaw | null>(null)

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [inv, rooms, tenants] = await Promise.all([
          fetchInvoicesFromSupabase(),
          fetchRoomsFromSupabase(),
          fetchTenantsFromSupabase(),
        ])

        setInvoices(inv)
        setRoomOptions(
          rooms.map((room: Room) => ({
            label: `${room.building?.name || ''} - ${room.unit_number}`,
            value: room.id,
            room,
          }))
        )
        setTenantOptions(
          tenants.map((tenant: Tenant) => ({
            label: tenant.full_name,
            value: tenant.id,
            tenant,
          }))
        )
      } catch (err) {
        toast("Failed to fetch data", { description: err instanceof Error ? err.message : "Unknown error" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtered data
  const filteredData = invoices.filter(inv => {
    const roomIdStr = inv.apartment_id ? String(inv.apartment_id) : ""
    const matchRoom = selectedRoom.includes("all") || (roomIdStr && selectedRoom.includes(roomIdStr))
    const matchStatus = selectedStatus.includes("all") || selectedStatus.includes(inv.status || "")
    return matchRoom && matchStatus
  })

  // Table columns
  const columns = [
    { label: "Invoice No.", accessor: "invoice_number" as keyof SupabaseInvoiceRaw },
    { label: "Room", accessor: "apartments" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => `${row.buildings?.name} - ${row.apartments?.unit_number}` },
    { label: "Tenant", accessor: "tenants" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => row.tenants?.full_name },
    { label: "Created", accessor: "issue_date" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => formatDateToDDMMYYYY(row.issue_date) },
    { label: "Amount", accessor: "total" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => formatToVND(row.total) },
    { label: "Status", accessor: "status" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => <InvoiceStatusBadge status={row.status} /> },
  ]

  // Actions
  const handleEdit = (row: SupabaseInvoiceRaw) => {
    setEditingInvoice(row)
    console.log(row)
    setOpenEditDialog(true)
  }
  const handleAdd = () => {
    setEditingInvoice(null)
    setOpenAddDialog(true)
  }
  const handleDelete = async (row: SupabaseInvoiceRaw) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return
    try {
      await removeInvoiceFromSupabase(row.id)
      setInvoices(prev => prev.filter(inv => inv.id !== row.id))
      toast.success('Invoice deleted')
    } catch (err) {
      toast("Failed to delete invoice", { description: err instanceof Error ? err.message : "Unknown error" })
    }
  }
  const handleMarkPaid = async (row: SupabaseInvoiceRaw) => {
    if (row.status === 'paid') return;
    try {
      await updateInvoiceStatusInSupabase(row.id, 'paid');
      toast.success('Đã đánh dấu hóa đơn đã thanh toán!');
      const inv = await fetchInvoicesFromSupabase();
      setInvoices(inv);
    } catch (err) {
      toast("Không thể cập nhật trạng thái hóa đơn", { description: err instanceof Error ? err.message : "Unknown error" })
    }
  }
  const rowActions = (row: SupabaseInvoiceRaw) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
          size="icon"
        >
          <IconDotsVertical />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={() => { console.log('row', row); setViewingInvoice(row); setOpenViewDialog(true); }}>View</DropdownMenuItem>
        {row.status !== 'paid' && (
          <DropdownMenuItem onClick={() => handleMarkPaid(row)} className="text-green-600">Mark Paid</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleDelete(row)} className="text-red-600">Delete</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(row)}>Edit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Xóa hàng loạt
  const handleRemoveSelected = async (selectedRows: SupabaseInvoiceRaw[]) => {
    if (!selectedRows.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} invoices?`)) return;
    try {
      for (const inv of selectedRows) {
        await removeInvoiceFromSupabase(inv.id)
      }
      setInvoices(prev => prev.filter(inv => !selectedRows.some(sel => sel.id === inv.id)))
      toast.success('Selected invoices deleted')
    } catch (err) {
      toast("Failed to delete invoices", { description: err instanceof Error ? err.message : "Unknown error" })
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 py-4 px-4 lg:px-6">
            <div className="flex flex-row items-center justify-between mb-2">
              <h2 className="scroll-m-20 text-2xl font-bold tracking-tight">Invoices</h2>
              <Button size="sm" onClick={handleAdd}>
                <IconPlus className="size-4 mr-2" />
                <span className="hidden lg:inline">Add Invoice</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center mb-2">
              <FilterDropdown
                options={roomOptions.map(opt => ({
                  value: String(opt.value),
                  label: opt.label,
                  checked: selectedRoom.includes(String(opt.value)),
                }))}
                buttonLabel="Room"
                onChange={setSelectedRoom}
              />
              <FilterDropdown
                options={[
                  { value: "paid", label: "Paid", checked: selectedStatus.includes("paid") },
                  { value: "overdue", label: "Overdue", checked: selectedStatus.includes("overdue") },
                  { value: "unpaid", label: "Unpaid", checked: selectedStatus.includes("unpaid") },
                ]}
                buttonLabel="Status"
                onChange={setSelectedStatus}
              />
            </div>
            {loading ? (
              <div className="flex flex-1 flex-col">
                <div className="flex flex-col gap-4 py-4 px-4 lg:px-6">
                  <div className="h-[400px] w-full bg-muted rounded" />
                </div>
              </div>
            ) : (
              <TablePro
                columns={columns}
                data={filteredData}
                rowKey={row => row.id}
                actions={rowActions}
                onRemoveSelected={handleRemoveSelected}
              />
            )}
          </div>
        </div>
        {/* Dialog add invoice */}
        <AddInvoiceDialog
          open={openAddDialog}
          onOpenChange={setOpenAddDialog}
          onSubmit={async () => {
            try {
              const data = await fetchInvoicesFromSupabase()
              setInvoices(data)
              setOpenAddDialog(false)
              setOpenEditDialog(false)
            } catch (err) {
              toast("Failed to refresh invoices", { description: err instanceof Error ? err.message : "Unknown error" })
            }
          }}
          roomOptions={roomOptions}
          tenantOptions={tenantOptions}
        />
        {/* Dialog edit invoice */}
        {editingInvoice && (
          <EditInvoiceDialog
            open={openEditDialog}
            onOpenChange={setOpenEditDialog}
            initialInvoice={{
              apartment_id: editingInvoice.apartment_id ?? null,
              tenant_id: editingInvoice.tenant_id ?? null,
              issue_date: editingInvoice.issue_date,
              due_date: editingInvoice.due_date,
              invoice_number: editingInvoice.invoice_number,
              status: editingInvoice.status,
              items: (editingInvoice.invoice_items as InvoiceItem[]) ?? [],
              additional_fees: editingInvoice.additional_fees ?? 0,
              discounts: editingInvoice.discounts ?? 0,
              notes: editingInvoice.notes ?? '',
              total: editingInvoice.total ?? 0,
              subtotal: editingInvoice.subtotal ?? 0,
            }}
            onSubmit={async () => {
              try {
                const data = await fetchInvoicesFromSupabase()
                setInvoices(data)
              } catch (err) {
                toast("Failed to refresh invoices", { description: err instanceof Error ? err.message : "Unknown error" })
              }
              setOpenAddDialog(false)
              setOpenEditDialog(false)
            }}
            roomOptions={roomOptions}
            tenantOptions={tenantOptions}
          />
        )}
        {/* Dialog view invoice */}
        {viewingInvoice && (
          <ViewInvoiceDialog
            open={openViewDialog}
            onOpenChange={(open) => { setOpenViewDialog(open); if (!open) setViewingInvoice(null); }}
            invoice={viewingInvoice}
            roomOptions={roomOptions}
            tenantOptions={tenantOptions}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
} 