import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { Skeleton } from "@/components/ui/skeleton"
import { getRoomDetail } from "@/data/supabase_data_source"
import type { RoomDetailData, Tenant } from "@/data/types"
import { Calendar, MoreHorizontal } from 'lucide-react';
import { formatDateToDDMMYYYY, } from "@/utils/date_utils"
import { formatToVND } from "@/utils/currency_utils"
import { Badge } from "@/components/ui/badge"
import { TablePro } from "@/components/ui/table-pro"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { EditSheet } from "@/components/ui/edit-sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { handleTenantSave } from "@/forms/tenant-form-utils"
import { removeTenantFromSupabase, fetchTenantsFromSupabase, updateTenantInSupabase } from "@/data/supabase_data_source"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


export default function RoomDetailPage() {
  const { roomId } = useParams()
  const [roomDetail, setRoomDetail] = useState<RoomDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return
    setLoading(true)
    getRoomDetail(Number(roomId))
      .then(setRoomDetail)
      .finally(() => setLoading(false))
  }, [roomId])

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader roomName={roomDetail?.room.unit_number} />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-2 py-4 px-4 lg:px-6">
            {loading ? (
              <div className="flex flex-1 flex-col">
                <div className="flex flex-col gap-4 py-4 px-4 lg:px-2">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              </div>
            ) : roomDetail ? (
              <RoomDetailPanel data={roomDetail} />
            ) : (
              <div className="p-8 text-center">Không tìm thấy phòng</div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function RoomDetailPanel({ data }: { data: RoomDetailData }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'tenants' | 'invoices'>('tenants')
  const [openSheet, setOpenSheet] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>(data.tenants)
  const [openLinkDialog, setOpenLinkDialog] = useState(false)
  const [allTenants, setAllTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")
  const [isLinking, setIsLinking] = useState(false)
  

  // Helper
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'occupied': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'coming_soon': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'available': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  const getStatusText = (status?: string) => {
    switch (status) {
      case 'occupied': return 'Occupied';
      case 'coming_soon': return 'Coming Soon';
      case 'available': return 'Available';
      default: return 'Unknown';
    }
  };

  // Tenant phân loại
  const primaryTenant = data.primaryTenant;
  const getRoomStatus = (date: string | null) => {
    if (!date) return 'available'
    const nextDate = new Date(date)
    const twoMonthsFromNow = new Date()
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)
    if (nextDate > twoMonthsFromNow) {
      return 'occupied'
    }
    return 'coming_soon'
  }

  // Sinh fields cho EditSheet
  const getFields = (tenant: Tenant | null) => {
    return [
      { label: "Full Name", name: "full_name", value: tenant?.full_name || "", autoComplete: "off", required: true },
      { label: "Phone", name: "phone", value: tenant?.phone || "", autoComplete: "off" },
      { label: "Email", name: "email", value: tenant?.email || "", autoComplete: "off" },
      { label: "ID Number", name: "id_number", value: tenant?.id_number || "", autoComplete: "off" },
      { label: "Nationality", name: "nationality", value: tenant?.nationality || "", autoComplete: "off" },
      { label: "Notes", name: "notes", value: tenant?.notes || "", autoComplete: "off" },
    ]

  }

  // Xử lý lưu (edit)
  const handleSave = async (values: Record<string, string>) => {
    setIsSaving(true)
    try {
      if (editingTenant) {
        const payload = {
          ...values,
          apartment_id: String(data.room.id),
          move_in_date: values.move_in_date ? String(values.move_in_date) : '',
          move_out_date: values.move_out_date ? String(values.move_out_date) : '',
          is_primary: editingTenant.tenant_type === 'primary' ? 'true' : 'false',
        }
        console.log('payload', payload)
      
        await handleTenantSave(payload, "edit", editingTenant, setTenants, {
          onSuccess: () => {
            setOpenSheet(false)
            setEditingTenant(null)
          }
        })
      }
    } catch (err) {
      toast("Cannot update tenant", { description: err instanceof Error ? err.message : "Unknown error" })
    } finally {
      setIsSaving(false)
    }
  }

  // Xử lý xóa tenant
  const handleDelete = async () => {
    if (!deletingTenant) return
    try {
      await removeTenantFromSupabase(deletingTenant.id)
      toast.success('Tenant deleted')
      setTenants(prev => prev.filter(t => t.id !== deletingTenant.id))
      setOpenDeleteDialog(false)
      setDeletingTenant(null)
    } catch (err) {
      toast("Cannot delete tenant", { description: err instanceof Error ? err.message : "Unknown error" })
    }
  }

  // Link User logic
  const handleOpenLinkDialog = async () => {
    setOpenLinkDialog(true)
    try {
      const all = await fetchTenantsFromSupabase()
      setAllTenants(all)
    } catch (err) {
      toast("Không thể tải danh sách tenants", { description: err instanceof Error ? err.message : "Unknown error" })
    }
  }

  const handleLinkUser = async () => {
    if (!selectedTenantId) return
    setIsLinking(true)
    try {
      // Kiểm tra nếu phòng đã có primary thì chỉ cho phép dependent
      const hasPrimary = tenants.some(t => t.tenant_type === 'primary')
      const updateData: Record<string, string> = {
        apartment_id: String(data.room.id),
        tenant_type: hasPrimary ? 'dependent' : 'primary',
      }
      await updateTenantInSupabase(selectedTenantId, updateData)
      toast.success('Đã liên kết tenant vào phòng')
      // Cập nhật lại danh sách tenants của phòng
      setTenants(prev => [
        ...prev,
        {
          ...(allTenants.find(t => t.id === selectedTenantId) as Tenant),
          apartment_id: data.room.id,
          tenant_type: updateData.tenant_type,
        }
      ])
      setOpenLinkDialog(false)
      setSelectedTenantId("")
    } catch (err) {
      toast("Không thể liên kết tenant", { description: err instanceof Error ? err.message : "Unknown error" })
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center">
                <span className="text-stone-600 font-bold text-lg">R</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">{data.room.unit_number}</h1>
                <p className="text-stone-600">{data.building?.address}</p>
              </div>
            </div>
          </div>

          {/* Room Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center space-x-2">
              <span className="text-stone-500 text-sm font-medium w-20">Status</span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColor(getRoomStatus(data.room.next_available_date ?? ''))}`}>
                {getStatusText(getRoomStatus(data.room.next_available_date ?? ''))}
              </span>
            </div>
            {/* Tenant */}
            <div className="flex items-center space-x-2">
              <span className="text-stone-500 text-sm font-medium w-20">Tenant</span>
              <span className="text-stone-900 text-sm font-normal">{primaryTenant?.full_name}</span>
            </div>
            {/* Next Available Date */}
            <div className="flex items-center space-x-2">
              <span className="text-stone-500 text-sm font-medium w-20">Last Date</span>
              <span className="text-stone-900 text-sm font-normal flex items-center gap-2">
                <Calendar className="w-3 h-3 text-stone-500" />
                {formatDateToDDMMYYYY(data.room.next_available_date ?? '')}
              </span>
            </div>
            {/* Latest invoice status */}
            <div className="flex items-center space-x-2">
              <span className="text-stone-500 text-sm font-medium w-20">Latest Inv</span>
              <span className="text-stone-900 text-sm font-normal">
                {data.latestInvoice?.status === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>
          {/* Right Column */}
          <div className="space-y-4">
            
            {/* Electricity Price */}
            <div className="flex items-center space-x-2">
              <span className="text-stone-500 text-sm font-medium w-20">Elec. Price</span>
              <span className="text-stone-900 text-sm font-normal">{formatToVND(data.room.electricity_price ?? 0)}</span>
            </div>
            {/* Water Price */}
            <div className="flex items-center space-x-2">
              <span className="text-stone-500 text-sm font-medium w-20">Water Price</span>
              <span className="text-stone-900 text-sm font-normal">{formatToVND(data.room.water_price ?? 0)}</span>
            </div>
            {/* Elect. current */}
            <div className="flex items-center space-x-2">
              <span className="text-stone-500 text-sm font-medium w-20 mt-0.5">Elec. No</span>
              <span className="text-stone-900 text-sm font-normal">{data.utilityReading?.reading_value} kWh</span>
            </div>
          </div>
        </div>
        </div>

        {/* Tabs */}
          <div className="border-b border-stone-200">
            <nav className="flex space-x-8">
              {[
                { id: 'tenants', label: 'Tenants' },
                { id: 'invoices', label: 'Invoices' }
              ].map((tabItem) => (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id as typeof tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    tab === tabItem.id
                      ? 'border-stone-500 text-stone-900'
                      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {tabItem.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-0">
            {/* Tenants Tab */}
            {tab === 'tenants' && (
              <>
                <div className="flex justify-end mb-2">
                  <Button size="sm" variant="outline" onClick={handleOpenLinkDialog}>Link User</Button>
                </div>
                <TablePro
                  columns={[
                    { label: "Full Name", accessor: "full_name" },
                    { label: "Phone", accessor: "phone" },
                    { label: "Status", render: (row) => (
                      <Badge variant="outline" className="flex items-center justify-center gap-1 px-1.5">
                        {Date.now() > new Date(row.move_out_date ?? '').getTime() ? "Inactive" : "Active"}
                      </Badge>
                    ) },
                    { label: "Type", render: (row) => (
                      <Badge variant="outline" className="flex items-center justify-center gap-1 px-1.5">
                        {row.tenant_type === "primary" ? "Primary" : "Dependent"}
                      </Badge>
                    ) },
                  ]}
                  data={tenants}
                  rowKey={row => row.id}
                  actions={(row) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                          size="icon"
                        >
                          <MoreHorizontal />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => { setEditingTenant(row); setOpenSheet(true); }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setDeletingTenant(row); setOpenDeleteDialog(true); }}
                          disabled={row.tenant_type === "primary" && tenants.filter(t => t.tenant_type === "primary").length === 1}
                          className={row.tenant_type === "primary" && tenants.filter(t => t.tenant_type === "primary").length === 1 ? "text-gray-400" : "text-red-600"}
                        >Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  selectable={false}
                />
                <EditSheet
                  open={openSheet}
                  onOpenChange={setOpenSheet}
                  title={editingTenant ? "Edit Tenant" : ""}
                  description={editingTenant ? "Chỉnh sửa thông tin tenant" : ""}
                  loading={isSaving}
                  onSave={handleSave}
                  fields={getFields(editingTenant)}
                />
                <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xác nhận xóa tenant</DialogTitle>
                    </DialogHeader>
                    <div>Bạn có chắc chắn muốn xóa tenant <b>{deletingTenant?.full_name}</b> không?</div>
                    <DialogFooter>
                      <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
                      <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Dialog Link User */}
                <Dialog open={openLinkDialog} onOpenChange={setOpenLinkDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Liên kết tenant vào phòng</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium">Chọn tenant</label>
                        <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn tenant để liên kết" />
                          </SelectTrigger>
                          <SelectContent>
                            {allTenants
                              .filter(t => {
                                // Nếu phòng đã có primary thì ẩn các tenant primary
                                if (tenants.some(tt => tt.tenant_type === 'primary')) {
                                  return t.tenant_type !== 'primary'
                                }
                                return true
                              })
                              .filter(t => t.apartment_id === null || t.apartment_id === undefined)
                              .map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpenLinkDialog(false)}>Hủy</Button>
                        <Button onClick={handleLinkUser} disabled={!selectedTenantId || isLinking}>
                          {isLinking ? 'Đang liên kết...' : 'Liên kết'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* Invoices Tab */}
            {tab === 'invoices' && (
              <>
                <TablePro
                  columns={[
                    { label: "Invoice No.", render: (row) => (
                      <button
                        className="text-primary underline hover:text-primary/80 cursor-pointer bg-transparent border-0 p-0 italic"
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/invoice/${row.id}`)
                        }}
                      >
                        {row.invoice_number}
                      </button>
                    ) },
                    { label: "Tenant", accessor: "tenants", render: (row) => row.tenants?.full_name },
                    { label: "Created", accessor: "issue_date", render: (row) => formatDateToDDMMYYYY(row.issue_date) },
                    { label: "Amount", accessor: "total", render: (row) => formatToVND(row.total) },
                    { label: "Status", accessor: "status", render: (row) => (
                      <Badge className={
                        row.status === 'paid'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : row.status === 'overdue'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200 px-2 py-1 border'
                      }>
                        {row.status === 'paid' ? 'Paid' : row.status === 'overdue' ? 'Overdue' : 'Unpaid'}
                      </Badge>
                    ) },
                  ]}
                  data={data.invoices}
                  rowKey={row => row.id}
                  selectable={false}
                />
                
              </>
            )}
          </div>
        </div>
    </div>
  )
} 