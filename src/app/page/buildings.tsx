import * as React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { IconDotsVertical } from "@tabler/icons-react"
import { TablePro } from "@/components/ui/table-pro"
import { fetchBuildingsFromSupabase, updateBuildingInSupabase } from "@/data/supabase_data_source"
import type { SupabaseBuilding } from "@/data/types"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditSheet } from "@/components/ui/edit-sheet"
import { toast } from "sonner"


export default function BuildingsPage() {
  const [data, setData ] = React.useState<SupabaseBuilding[]>([])
  const [loading, setLoading] = React.useState(true)
  const [openSheet, setOpenSheet] = React.useState(false)
  const [editingBuilding, setEditingBuilding] = React.useState<SupabaseBuilding | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const handleRemoveSelected = () => {
    return ;
  }

  // Định nghĩa columns cho TablePro
  const columns = [
    { label: "Id", accessor: "id" as keyof SupabaseBuilding },
    { label: "Name", accessor: "name" as keyof SupabaseBuilding },
    { label: "Address", accessor: "address" as keyof SupabaseBuilding },
  ]

  const handleEdit = (row: SupabaseBuilding) => {
    setEditingBuilding(row)
    setOpenSheet(true)
  }

  const rowActions = (row: SupabaseBuilding) => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )

  React.useEffect(() => {
   const fetchData = async () => {
    const buildings = await fetchBuildingsFromSupabase();
    setData(buildings)
    setLoading(false)
   }
   fetchData()
  }, [])

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
            <div className="flex flex-row items-center justify-between">
              <div className="mb-2">
                <h2 className="scroll-m-20 text-2xl font-bold tracking-tight">Buildings</h2>
                <p className="text-muted-foreground text-base">Here's a list of your buildings!</p>
              </div>
              {/* <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">Add Section</span>
              </Button> */}
            </div>
            {loading ? (
              <div className="flex flex-1 flex-col">
                <div className="flex flex-col gap-4 py-4 px-4 lg:px-6">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              </div>
            ) : (
              <TablePro
                columns={columns}
                data={data}
                rowKey={(row) => row.id}
                actions={rowActions}
                onRemoveSelected={handleRemoveSelected}
              />
            )}
          </div>
        </div>
        {/* Sheet edit building */}
        <EditSheet
          open={openSheet}
          onOpenChange={setOpenSheet}
          title="Edit Building"
          description="Edit building information"
          loading={isSaving}
          onSave={async (newValues) => {
            if (!editingBuilding) return;
            setIsSaving(true);
            try {
              const updatedBuilding = await updateBuildingInSupabase(editingBuilding.id, {
                name: newValues.name,
                address: newValues.address,
              })
              if(updatedBuilding) {
                toast.success("Building updated successfully", {
                  description: `Building ${updatedBuilding.name} updated successfully`,
                })
                setData(prev => prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b))
                setOpenSheet(false)
                setEditingBuilding(null)
              }
            } catch (error) {
              toast("Failed to update building", {
                description: error instanceof Error ? error.message : "Unknown error",
              })
            } finally {
              setIsSaving(false);
            }
          }}
          fields={[
            {
              label: "Name",
              name: "name",
              value: editingBuilding?.name || "",
              autoComplete: "off",
            },
            {
              label: "Address",
              name: "address",
              value: editingBuilding?.address || "",
              autoComplete: "off",
            },
          ]}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
