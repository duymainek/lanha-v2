import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TablePro } from "@/components/ui/table-pro"
import { EditSheet } from "@/components/ui/edit-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import {
  fetchTenantsFromSupabase,
  fetchBuildingsFromSupabase,
  fetchRoomsFromSupabase,
  removeTenantFromSupabase,
} from "@/data/supabase_data_source"
import type { Tenant, SupabaseBuilding, Room } from "@/data/types"
import { IconDotsVertical, IconPlus } from "@tabler/icons-react"
import { IconUserCheck, IconUserMinus } from "@tabler/icons-react"
import FilterDropdown from "@/components/ui/filter-dropdown"
import { getTenantFields, handleTenantSave } from "@/forms/tenant-form-utils"

export default function TenantsPage() {
  const [data, setData] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [openSheet, setOpenSheet] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<string[]>(["all"])
  const [selectedType, setSelectedType] = useState<string[]>(["all"])
  const [selectedStatus, setSelectedStatus] = useState<string[]>(["all"])
  const [buildingList, setBuildingList] = useState<SupabaseBuilding[]>([])
  const [roomList, setRoomList] = useState<Room[]>([])
  const [sheetMode, setSheetMode] = useState<"add" | "edit">("add")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [tenants, buildings, rooms] = await Promise.all([
          fetchTenantsFromSupabase(),
          fetchBuildingsFromSupabase(),
          fetchRoomsFromSupabase(),
        ])
        setData(tenants)
        setBuildingList(buildings)
        setRoomList(rooms)
      } catch (err) {
        toast("Failed to load tenants list", { description: err instanceof Error ? err.message : "Unknown error" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtered data
  const filteredData = data.filter(tenant => {
    const buildingIdStr = tenant.building && tenant.building.id ? String(tenant.building.id) : ""
    let matchBuilding = false;
    if (selectedBuilding.includes("all")) {
      matchBuilding = true;
    } else if (selectedBuilding.includes("N/A")) {
      matchBuilding = !buildingIdStr;
    } else {
      matchBuilding = Boolean(buildingIdStr) && selectedBuilding.includes(buildingIdStr);
    }
    const matchType = selectedType.includes("all") || selectedType.includes(tenant.tenant_type || "")
    const matchSearch = !search || tenant.full_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = selectedStatus.includes("all") || selectedStatus.includes(Date.now() > new Date(tenant.move_out_date ?? '').getTime() ? "inactive" : "active")
    return matchBuilding && matchType && matchSearch && matchStatus
  })

  // Table columns
  const columns = [
    { label: "Full Name", accessor: "full_name" as keyof Tenant },
    { label: "Phone", accessor: "phone" as keyof Tenant },
    { label: "Status", render: (row: Tenant) => (
      <Badge variant="outline" className="flex items-center gap-1 px-1.5">
        {Date.now() > new Date(row.move_out_date ?? '').getTime() ? "Inactive" : "Active"}
      </Badge>
    ) },
    { label: "Room", render: (row: Tenant) => row.apartment?.unit_number || "N/A" },
    { label: "Building", render: (row: Tenant) => row.building?.name || "N/A" },
    { label: "Type", render: (row: Tenant) => (
      <Badge variant="outline" className="flex items-center gap-1 px-1.5">
        {row.tenant_type === "primary" ? <IconUserCheck size={16} /> : <IconUserMinus size={16} />}
        {row.tenant_type === "primary" ? "Primary" : "Dependent"}
      </Badge>
    ) },
  ]

  // Actions cho từng dòng (DropdownMenu giống rooms)
  const rowActions = (row: Tenant) => (
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
        <DropdownMenuItem onClick={() => handleEdit(row)}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDelete(row)} disabled={isDeleting}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Xử lý mở sheet edit
  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setSheetMode("edit")
    setOpenSheet(true)
  }

  // Xử lý mở sheet add
  const handleAdd = () => {
    setEditingTenant(null)
    setSheetMode("add")
    setOpenSheet(true)
  }

  // Xử lý xóa tenant
  const handleDelete = async (tenant: Tenant) => {
    if (!window.confirm(`Are you sure you want to delete tenant "${tenant.full_name}"?`)) return
    setIsDeleting(true)
    try {
      await removeTenantFromSupabase(tenant.id)
      toast.success("Tenant deleted successfully")
      setData(prev => prev.filter(t => t.id !== tenant.id))
    } catch (err) {
      toast("Failed to delete tenant", { description: err instanceof Error ? err.message : "Unknown error" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Sinh fields cho EditSheet
  const getFields = (tenant: Tenant | null) => getTenantFields(tenant, roomList)

  // Xử lý lưu (add/edit)
  const handleSave = async (values: Record<string, string>) => {
    setIsSaving(true)
    await handleTenantSave(
      values,
      sheetMode,
      editingTenant,
      setData,
      {
        onSuccess: () => {
          setOpenSheet(false)
          setEditingTenant(null)
        },
        onError: () => {},
      }
    )
    setIsSaving(false)
  }

  // Đảm bảo selectedBuilding là string[]
  const selectedBuildingStrArr = (selectedBuilding as string[]).filter(v => typeof v === 'string');
  const optionsBuilding = [
    ...buildingList.map(b => ({
      value: String(b.id),
      label: b.name,
      checked: selectedBuildingStrArr.includes(String(b.id))
    })),
    { value: "N/A", label: "N/A", checked: selectedBuildingStrArr.includes("N/A") }
  ];

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
          <div className="flex flex-col gap-2 py-4 px-4 lg:px-6">
            <div className="mb-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div className="w-full">
                <div className="flex flex-row items-center justify-between mb-2">
                  <h2 className="scroll-m-20 text-2xl font-bold tracking-tight">Tenants</h2>
                  <Button size="sm" onClick={handleAdd}>
                    <IconPlus className="size-4 mr-2" />
                    <span className="hidden lg:inline">Add Tenant</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3 items-center mb-2">
                  <Input
                    placeholder="Search by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-48 h-8"
                  />
                  <FilterDropdown
                    options={optionsBuilding}
                    buttonLabel="Buildings"
                    onChange={vals => setSelectedBuilding((vals as string[]).filter(v => typeof v === 'string'))}
                  />
                  <FilterDropdown
                    options={[
                      { value: "primary", label: "Primary", checked: selectedType.includes("primary") },
                      { value: "dependent", label: "Dependent", checked: selectedType.includes("dependent") },
                    ]}
                    buttonLabel="Type"
                    onChange={setSelectedType}
                  />
                   <FilterDropdown
                    options={[
                      { value: "active", label: "Active", checked: selectedType.includes("active") },
                      { value: "inactive", label: "Inactive", checked: selectedType.includes("inactive") },
                    ]}
                    buttonLabel="Status"
                    onChange={setSelectedStatus}
                  />
                </div>
              </div>
            </div>
            {loading ? (
              <div className="flex flex-1 flex-col">
                <div className="flex flex-col gap-4 py-4 px-4 lg:px-2">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              </div>
            ) : (
              <TablePro
                columns={columns}
                data={filteredData}
                rowKey={row => row.id}
                actions={rowActions}
              />
            )}
          </div>
        </div>
        <EditSheet
          open={openSheet}
          onOpenChange={setOpenSheet}
          title={sheetMode === "add" ? "Add Tenant" : "Edit Tenant"}
          description={sheetMode === "add" ? "Enter new tenant information" : "Edit tenant information"}
          loading={isSaving}
          onSave={handleSave}
          fields={getFields(editingTenant)}
        />
      </SidebarInset>
    </SidebarProvider>
  )
} 