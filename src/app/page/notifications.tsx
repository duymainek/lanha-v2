import { useEffect, useState, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TablePro } from "@/components/ui/table-pro"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditSheet } from "@/components/ui/edit-sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { fetchNotificationsFromSupabase, updateNotificationInSupabase } from "@/data/supabase_data_source"
import type { NotificationQueueItem } from "@/data/types"
import FilterDropdown from "@/components/ui/filter-dropdown"
import { useNavigate } from "react-router-dom"

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<NotificationQueueItem[]>([])
  const [openSheet, setOpenSheet] = useState(false)
  const [editingNotification, setEditingNotification] = useState<NotificationQueueItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deletingNotification, setDeletingNotification] = useState<NotificationQueueItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string[]>([""])
  const [openSendDialog, setOpenSendDialog] = useState(false)
  const [zaloToken, setZaloToken] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedRows, setSelectedRows] = useState<NotificationQueueItem[]>([])

  // Memoize options for FilterDropdown
  const statusOptions = useMemo(() => [
    { value: "Pending", label: "Pending", checked: statusFilter.includes("Pending") },
    { value: "Sent", label: "Sent", checked: statusFilter.includes("Sent") },
  ], [statusFilter])

  // Filtered data
  const filteredData = data.filter(n => {
    if (statusFilter.includes("all")) return n.status !== 'Removed';
    return n.status !== 'Removed' && statusFilter.includes(n.status || "");
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notifications = await fetchNotificationsFromSupabase()
        setData(notifications)
      } catch (err) {
        toast("Failed to load notifications", { description: err instanceof Error ? err.message : "Unknown error" })
      }
    }
    fetchData()
  }, [])

  // Handle save (edit)
  const handleSave = async (values: Record<string, string>) => {
    setIsSaving(true)
    try {
      if (editingNotification) {
        await updateNotificationInSupabase(editingNotification.id, {
          title: values.title,
          status: values.status,
        })
        toast.success('Notification updated successfully')
        setData(prev => prev.map(n => n.id === editingNotification.id ? { ...n, ...values } : n))
        setOpenSheet(false)
        setEditingNotification(null)
      }
    } catch (err) {
      toast("Failed to update notification", { description: err instanceof Error ? err.message : "Unknown error" })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete (set status = Removed)
  const handleDelete = async () => {
    if (!deletingNotification) return
    try {
      await updateNotificationInSupabase(deletingNotification.id, { status: 'Removed' })
      toast.success('Notification deleted')
      setData(prev => prev.filter(n => n.id !== deletingNotification.id))
      setOpenDeleteDialog(false)
      setDeletingNotification(null)
    } catch (err) {
      toast("Failed to delete notification", { description: err instanceof Error ? err.message : "Unknown error" })
    }
  }

  // Generate fields for EditSheet
  const getFields = (notification: NotificationQueueItem | null) => [
    { label: "Title", name: "title", value: notification?.title || "", required: true },
    { label: "Status", name: "status", value: notification?.status || "Pending", type: "select", options: [
      { value: "Pending", label: "Pending" },
      { value: "Sent", label: "Sent" },
    ] },
  ]

  // Send Zalo ZNS
  const handleSendZalo = async (zaloToken: string) => {
    console.log('selectedRows', selectedRows)

    setIsSending(true)
    for (const notification of selectedRows) {
      const invoice = notification.invoice;
      const tenant = invoice?.tenants || notification.tenant;
      if (!invoice || !tenant?.phone) { 
        toast.error(`Notification ${notification.id} missing invoice or phone!`)
        continue;
      }
      try {
        // Tính toán các giá trị cần thiết
        const formatCurrency = (v: number) => v?.toLocaleString('vi-VN') || "0";
        const electricityAmount = invoice.invoice_items?.find(i => i.item_type === 'electricity')?.total || 0;
        const waterAmount = invoice.invoice_items?.find(i => i.item_type === 'water')?.total || 0;
        const rentAmount = invoice.invoice_items?.find(i => i.item_type === 'rent')?.total || 0;
        let zaloData;
        if (invoice.status === "paid") {
          zaloData = {
            phone: `84${tenant.phone.replace(/^0+/, '')}`,
            template_id: "432591",
            template_data: {
              price: formatCurrency(invoice.total).replace(/[^\d.]/g, ''),
              Invoice_number: invoice.invoice_number,
              customer_name: tenant.full_name,
              room: invoice.apartments?.unit_number || ""
            },
            tracking_id: `inv_${invoice.id}`
          }
        } else {
          zaloData = {
            phone: `84${tenant.phone.replace(/^0+/, '')}`,
            template_id: "435321",
            template_data: {
              customer_name: tenant.full_name,
              contract_number: invoice.invoice_number,
              transfer_amount: invoice.total.toString(),
              bank_transfer_note: `Thanh toan hoa don phong ${invoice.apartments?.unit_number || ""}`,
              electricity: formatCurrency(electricityAmount).replace(/[^\d.]/g, ''),
              water: formatCurrency(waterAmount).replace(/[^\d.]/g, ''),
              incidental: formatCurrency(invoice.additional_fees || 0).replace(/[^\d.]/g, ''),
              deductions: formatCurrency(invoice.discounts || 0).replace(/[^\d.]/g, ''),
              total_price: formatCurrency(invoice.total).replace(/[^\d.]/g, ''),
              room_price: formatCurrency(rentAmount).replace(/[^\d.]/g, '')
            },
            tracking_id: `inv_${invoice.id}`
          }
        }
        const zaloResponse = await fetch('https://business.openapi.zalo.me/message/template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': zaloToken || '',
          },
          body: JSON.stringify(zaloData)
        });
        
        const responseData = await zaloResponse.json();
        
        if (!zaloResponse.ok || responseData.error) {
          const errorMessage = responseData.message || await zaloResponse.text();
          toast.error(`Gửi Zalo thất bại cho ${tenant.full_name}, ${errorMessage}`)
        } else {
          await updateNotificationInSupabase(notification.id, { status: 'Sent' })
          setData(prev => prev.map(n => n.id === notification.id ? { ...n, status: 'Sent' } : n))
          toast.success(`Đã gửi Zalo cho ${tenant.full_name}`)
        }
      } catch (error) {
        toast.error(`Lỗi gửi Zalo cho ${tenant?.full_name || ""}, ${error}`)
      }
    }
    setIsSending(false)
    setOpenSendDialog(false)
    setZaloToken("")
  }

  const handleRemoveSelected = async (rows: NotificationQueueItem[]) => {
    if (!window.confirm(`Are you sure you want to delete ${rows.length} notifications?`)) return;
    await Promise.all(rows.map(row => updateNotificationInSupabase(row.id, { status: 'Removed' })));
    setData(prev => prev.filter(n => !rows.some(r => r.id === n.id)));
  }

  const handleSendSelected = async (rows: NotificationQueueItem[]) => {
    setSelectedRows(rows)
    setOpenSendDialog(true)
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
              <h2 className="scroll-m-20 text-2xl font-bold tracking-tight">Notifications</h2>
              <div className="flex gap-2">
              </div>
            </div>
            <div className="flex gap-2">
              <FilterDropdown
                options={statusOptions}
                buttonLabel="Status"
                onChange={setStatusFilter}
              />
            </div>
            <TablePro
              columns={[
                { label: "Invoice No.", render: (row: NotificationQueueItem) => row.invoice?.invoice_number ? (
                  <button
                    className="text-primary underline hover:text-primary/80 cursor-pointer bg-transparent border-0 p-0 italic"
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      if (row.invoice) {
                        navigate(`/invoice/${row.invoice.id}`)
                      }
                    }}
                  >
                    {row.invoice.invoice_number}
                  </button>
                ) : "-" },
                { label: "Title", accessor: "title" },
                { label: "Tenant", render: (row: NotificationQueueItem) => row.tenant?.full_name || "-" },
                { label: "Created", accessor: "created_at", render: (row: NotificationQueueItem) => new Date(row.created_at).toLocaleString() },
                { label: "Status", accessor: "status", render: (row: NotificationQueueItem) => (
                  <Badge className={
                    row.status === 'Sent'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200 px-2 py-1 border'
                  }>
                    {row.status === 'Sent' ? 'Sent' : 'Pending'}
                  </Badge>
                ) },
              ]}
              data={filteredData}
              rowKey={(row: NotificationQueueItem) => row.id}
              onRemoveSelected={handleRemoveSelected}
              onSendSelected={handleSendSelected}
            />
            <EditSheet
              open={openSheet}
              onOpenChange={setOpenSheet}
              title={editingNotification ? "Edit Notification" : ""}
              description={editingNotification ? "Edit notification" : ""}
              loading={isSaving}
              onSave={handleSave}
              fields={getFields(editingNotification)}
            />
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Delete</DialogTitle>
                </DialogHeader>
                <div>Are you sure you want to delete notification <b>{deletingNotification?.title}</b>?</div>
                <DialogFooter>
                  <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                  <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openSendDialog} onOpenChange={setOpenSendDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enter Zalo ZNS Token</DialogTitle>
                </DialogHeader>
                <div className="mb-2 text-muted-foreground">Please enter your Zalo ZNS token to process notifications.</div>
                <a
                  href="https://developers.zalo.me/tools/explorer/922320635620582055"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline mb-4 inline-block"
                >
                  Click here to get your token
                </a>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 mb-2"
                  placeholder="Zalo ZNS Token"
                  value={zaloToken}
                  onChange={e => setZaloToken(e.target.value)}
                  disabled={isSending}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpenSendDialog(false)} disabled={isSending}>Cancel</Button>
                  <Button onClick={() => handleSendZalo(zaloToken)} disabled={!zaloToken || isSending}>
                    {isSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 