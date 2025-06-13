import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TablePro } from "@/components/ui/table-pro"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditSheet } from "@/components/ui/edit-sheet"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { fetchRoomsFromSupabase, updateRoomInSupabase } from "@/data/supabase_data_source"
import type { Room } from "@/data/types"
import { Button } from "@/components/ui/button"
import { IconDotsVertical } from "@tabler/icons-react"
import { StatusRoomBadge } from "@/components/ui/status-room-badge"
import { formatToVND } from "@/utils/currency_utils"
import { formatDateToDDMMYYYY, formatDateToYYYYMMDD } from "@/utils/date_utils"
import FilterDropdown from "@/components/ui/filter-dropdown"
import { useNavigate } from "react-router-dom"

export default function RoomsPage() {
  const [data, setData] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [openSheet, setOpenSheet] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<string[]>(["all"])
  const [selectedStatus, setSelectedStatus] = useState<string[]>(["all"])
  const [buildingList, setBuildingList] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const rooms = await fetchRoomsFromSupabase()
        console.log(rooms)
        setData(rooms)
        setBuildingList(rooms.map(room => room.building?.name || "").filter((name, index, self) => self.indexOf(name) === index))
      } catch (err) {
        toast("Failed to fetch rooms", { description: err instanceof Error ? err.message : "Unknown error" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const columns = [
    { label: "ID", accessor: "id" as keyof Room },
    { label: "Room No", accessor: "unit_number" as keyof Room },
    { label: "Building", accessor: "building.name" as keyof Room, render: (row: Room) => row.building?.name },
    { label: "Rent", accessor: "price" as keyof Room, render: (row: Room) => formatToVND(row.price) },
    { label: "Status", accessor: "status" as keyof Room, render: (row: Room) => <StatusRoomBadge nextAvailableDate={row.next_available_date || null} /> },
    { label: "Next Available Date", accessor: "next_available_date" as keyof Room, render: (row: Room) => formatDateToDDMMYYYY(row.next_available_date || "") },
  ]

  const rowActions = (row: Room) => (
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
        <DropdownMenuItem onClick={() => handleView(row)}>View</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(row)}>Edit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setOpenSheet(true)
  }

  const handleView = (room: Room) => {
    navigate(`/rooms/${room.id}`)
  }

  // Generate fields for EditSheet from Room model
  const getFields = (room: Room | null) => {
    if (!room) return []
    return [
      { label: "Room No", name: "unit_number", value: room.unit_number || "", autoComplete: "off" },
      { label: "Price", name: "price", value: String(room.price ?? ""), type: "number", autoComplete: "off" },
      { label: "Next Available Date", name: "next_available_date", value: formatDateToYYYYMMDD(room.next_available_date || ""), type: "date", autoComplete: "off" },
      { label: "Deposit", name: "deposit", value: String(room.deposit ?? ""), type: "number", autoComplete: "off" },
      { label: "Electricity Price", name: "electricity_price", value: String(room.electricity_price ?? ""), type: "number", autoComplete: "off" },
      { label: "Water Price", name: "water_price", value: String(room.water_price ?? ""), type: "number", autoComplete: "off" },
    ]
  }

  const handleSave = async (newValues: Record<string, string>) => {
    if (!editingRoom) return
    setIsSaving(true)
    try {
      const updatePayload = {
        ...editingRoom,
        ...newValues,
      }
      await updateRoomInSupabase(editingRoom.id, updatePayload)
      toast.success("Room updated successfully", { description: `Room ${editingRoom.unit_number} updated successfully` })
      setData(prev => prev.map(r => r.id === editingRoom.id ? updatePayload : r))
      setOpenSheet(false)
      setEditingRoom(null)
    } catch (error) {
      toast("Failed to update room", { description: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsSaving(false)
    }
  }

  // Hàm tính status giống StatusRoomBadge
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

  // Filtered data
  const filteredData = data.filter(room => {
    const buildingName = room.building?.name || ""
    const matchBuilding = selectedBuilding.includes("all") || selectedBuilding.includes(buildingName)
    const status = getRoomStatus(room.next_available_date || null)
    const matchStatus = selectedStatus.includes("all") || selectedStatus.includes(status)
    return matchBuilding && matchStatus
  })

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
            <div className="mb-2">
              <h2 className="scroll-m-20 text-2xl font-bold tracking-tight">Rooms</h2>
              <p className="text-muted-foreground text-base pb-8">Here is a list of your rooms!</p>
              <div className="flex flex-wrap gap-3 items-center mb-2">
                <FilterDropdown
                  options={buildingList.map(name => ({ value: name, label: name, checked: selectedBuilding.includes(name) }))}
                  buttonLabel="Buildings"
                  onChange={setSelectedBuilding}
                />
                <FilterDropdown
                  options={[
                    { value: "available", label: "Available", checked: selectedStatus.includes("available") },
                    { value: "occupied", label: "Occupied", checked: selectedStatus.includes("occupied") },
                    { value: "coming_soon", label: "Coming Soon", checked: selectedStatus.includes("coming_soon") },
                  ]}
                  buttonLabel="Status"
                  onChange={setSelectedStatus}
                />
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
          title="Edit Room"
          description="Edit room information"
          loading={isSaving}
          onSave={handleSave}
          fields={getFields(editingRoom)}
        />
      </SidebarInset>
    </SidebarProvider>
  )
} 