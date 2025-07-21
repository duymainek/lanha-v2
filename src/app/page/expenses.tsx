import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TablePro } from "@/components/ui/table-pro"
import { EditSheet } from "@/components/ui/edit-sheet"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { IconDotsVertical } from "@tabler/icons-react"
import { useEffect, useState, useMemo } from "react"
import { fetchBuildingExpenses, fetchBuildingsFromSupabase, removeBuildingExpense, fetchExpenseTypes } from "@/data/supabase_data_source"
import type { BuildingExpense, SupabaseBuilding } from "@/data/types"
import { toast } from "sonner"
import FilterDropdown from "@/components/ui/filter-dropdown"
import { getExpenseFields, handleExpenseSave } from "@/forms/expense-form-utils"

function ExpenseTypeBadge({ type }: { type: string }) {
  // Tìm loại chi phí theo name, gán màu động nếu muốn
  const lower = type.toLowerCase();
  let color = "";
  let label = type;
  if (lower === "water") {
    color = "bg-blue-100 text-blue-700 border-blue-200";
    label = "Water";
  } else if (lower === "electricity") {
    color = "bg-yellow-100 text-yellow-700 border-yellow-200";
    label = "Electricity";
  } else {
    color = "bg-gray-100 text-gray-700 border-gray-200";
    label = type;
  }
  return <Badge className={color + " px-2 py-1 border"}>{label}</Badge>;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<BuildingExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [openSheet, setOpenSheet] = useState(false)
  const [editingExpense, setEditingExpense] = useState<BuildingExpense | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<string[]>(["all"])
  const [buildingList, setBuildingList] = useState<SupabaseBuilding[]>([])
  const [expenseType, setExpenseType] = useState<string[]>(["all"])
  const [expenseTypes, setExpenseTypes] = useState<{id: string, name: string}[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string[]>([])
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [expenses, buildings, types] = await Promise.all([
          fetchBuildingExpenses(),
          fetchBuildingsFromSupabase(),
          fetchExpenseTypes(),
        ])
        setExpenses(expenses)
        setBuildingList(buildings)
        setExpenseTypes(types)
      } catch (err) {
        toast("Failed to fetch expenses", { description: err instanceof Error ? err.message : "Unknown error" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const columns = [
    { label: "Created", accessor: "created_at" as keyof BuildingExpense, render: (row: BuildingExpense) => row.created_at?.slice(0, 7) },
    { label: "Amount", accessor: "amount" as keyof BuildingExpense, render: (row: BuildingExpense) => row.amount?.toLocaleString() },
    { label: "Type", accessor: "expense_type" as keyof BuildingExpense, render: (row: BuildingExpense) => <ExpenseTypeBadge type={row.expense_type} /> },
    { label: "Building", accessor: "building.name" as keyof BuildingExpense, render: (row: BuildingExpense) => row.building?.name },
    { label: "Note", accessor: "note" as keyof BuildingExpense },
  ]

  const rowActions = (row: BuildingExpense) => (
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
        <DropdownMenuItem onClick={() => handleDelete(row)} className="text-red-600">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const handleEdit = (row: BuildingExpense) => {
    setEditingExpense(row)
    setOpenSheet(true)
  }
  const handleAdd = () => {
    setEditingExpense(null)
    setOpenSheet(true)
  }
  const handleDelete = async (row: BuildingExpense) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      await removeBuildingExpense(row.id)
      setExpenses(prev => prev.filter(e => e.id !== row.id))
      toast.success('Expense deleted')
    } catch (err) {
      toast("Failed to delete expense", { description: err instanceof Error ? err.message : "Unknown error" })
    }
  }
  const handleRemoveSelected = async (rows: BuildingExpense[]) => {
    if (!rows.length) return
    if (!window.confirm(`Are you sure you want to delete ${rows.length} expenses?`)) return
    try {
      for (const exp of rows) {
        await removeBuildingExpense(exp.id)
      }
      setExpenses(prev => prev.filter(e => !rows.some(sel => sel.id === e.id)))
      toast.success('Selected expenses deleted')
    } catch (err) {
      toast("Failed to delete expenses", { description: err instanceof Error ? err.message : "Unknown error" })
    }
  }

  // Danh sách tháng yyyy-mm từ expenses (không có option All)
  const monthOptions = useMemo(() => {
    const months = Array.from(new Set(expenses.map(e => e.created_at?.slice(0, 7)).filter(Boolean)))
      .sort((a, b) => (a && b ? b.localeCompare(a) : 0));
    return months.map(m => ({ value: m!, label: m!, checked: selectedMonth.includes(m!) }));
  }, [expenses, selectedMonth])

  // Filtered data
  const filteredData = expenses.filter(exp => {
    const matchBuilding = selectedBuilding.length === 0 || selectedBuilding.includes("all") || selectedBuilding.includes(String(exp.building?.id))
    const matchType = expenseType.length === 0 || expenseType.includes("all") || expenseType.includes(exp.expense_type)
    const matchMonth = selectedMonth.length === 0 || selectedMonth.includes(exp.created_at?.slice(0, 7) || "")
    return matchBuilding && matchType && matchMonth
  })

  // EditSheet fields
  const getFields = (expense: BuildingExpense | null) => getExpenseFields(expense, buildingList, expenseTypes)

  const handleSave = async (values: Record<string, string>) => {
    setIsSaving(true)

    await handleExpenseSave(
      values,
      editingExpense ? "edit" : "add",
      editingExpense,
      setExpenses,
      {
        onSuccess: () => {
          setOpenSheet(false)
          setEditingExpense(null)
        },
        onError: () => {},
      }
    )
    setIsSaving(false)
  }

  // Handler cho TablePro
  const handleRowSelectChange = (ids: (string | number)[]) => {
    setSelectedRowIds(ids)
  }

  // Tính tổng amount các record được chọn
  const totalSelectedAmount = filteredData
    .filter(row => selectedRowIds.includes(row.id))
    .reduce((sum, row) => sum + (row.amount || 0), 0)

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
              <h2 className="scroll-m-20 text-2xl font-bold tracking-tight">Expenses</h2>
              <Button size="sm" onClick={handleAdd}>
                <span className="hidden lg:inline">Add Expense</span>
              </Button>
            </div>
            <div className="flex flex-row gap-4 items-center mb-2">
              <FilterDropdown
                options={buildingList.map(b => ({ value: String(b.id), label: b.name, checked: selectedBuilding.includes(String(b.id)) }))}
                buttonLabel="Buildings"
                onChange={setSelectedBuilding}
              />
              <FilterDropdown
                options={expenseTypes.map(opt => ({ value: opt.name, label: opt.name, checked: expenseType.includes(opt.name) }))}
                buttonLabel="Expense"
                onChange={setExpenseType}
              />
              <FilterDropdown
                options={monthOptions}
                buttonLabel="Date"
                onChange={setSelectedMonth}
              />
            </div>
            {loading ? (
              <div className="flex flex-1 flex-col">
                <div className="flex flex-col gap-4 py-4 px-4 lg:px-6">
                  <div className="h-[400px] w-full bg-muted rounded" />
                </div>
              </div>
            ) : (
              <>
                <TablePro
                  columns={columns}
                  data={filteredData}
                  rowKey={row => row.id}
                  actions={rowActions}
                  selectable
                  onRemoveSelected={handleRemoveSelected}
                  onRowSelectChange={handleRowSelectChange}
                  hideSum={false}
                />
                {selectedRowIds.length > 0 && (
                  <div className="mt-2 text-right font-semibold">
                    Total amount: {totalSelectedAmount.toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <EditSheet
          open={openSheet}
          onOpenChange={setOpenSheet}
          title={editingExpense ? "Edit Expense" : "Add Expense"}
          description={editingExpense ? "Edit building expense information" : "Add a new building expense"}
          loading={isSaving}
          onSave={handleSave}
          fields={getFields(editingExpense)}
          saveLabel={editingExpense ? "Update" : "Add"}
        />
      </SidebarInset>
    </SidebarProvider>
  )
} 