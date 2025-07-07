import type { BuildingExpense, SupabaseBuilding } from "@/data/types"
import type { EditSheetField } from "@/components/ui/edit-sheet"
import { addBuildingExpense, updateBuildingExpense } from "@/data/supabase_data_source"
import { toast } from "sonner"

export function getExpenseFields(
  expense: BuildingExpense | null,
  buildingList: SupabaseBuilding[],
  expenseTypes: {id: string, name: string}[]
): EditSheetField[] {
  return [
    {
      label: "Building",
      name: "building_id",
      value: expense?.building?.id ? String(expense.building.id) : "",
      type: "select",
      required: false,
      options: buildingList.map(b => ({ value: b.id, label: b.name }))
    },
    {
      label: "Expense Type",
      name: "expense_id",
      value: expense?.expense_id || "",
      type: "select",
      required: true,
      options: expenseTypes.map(t => ({ value: t.id, label: t.name }))
    },
    {
      label: "Amount",
      name: "amount",
      value: expense?.amount ? String(expense.amount) : "",
      type: "number",
      required: true,
    },
    {
      label: "Note",
      name: "note",
      value: expense?.note || "",
      type: "text",
      required: false,
    },
  ]
}

export async function handleExpenseSave(
  values: Record<string, string>,
  mode: "add" | "edit",
  editingExpense: BuildingExpense | null,
  setData?: (fn: (prev: BuildingExpense[]) => BuildingExpense[]) => void,
  options?: { onSuccess?: () => void, onError?: (err: unknown) => void }
): Promise<void> {
  try {
    if ( !values.expense_id || !values.amount) {
      toast("Please fill in all required fields")
      options?.onError?.(new Error("Missing required fields"))
      return
    }
    const payload = {
      building_id: values.building_id ? Number(values.building_id) : undefined,
      amount: Number(values.amount),
      note: values.note,
      expense_id: values.expense_id,
    }
    if (mode === "add") {
      const added = await addBuildingExpense(payload)
      toast.success("Expense added successfully")
      if (setData) setData(prev => [added, ...prev])
    } else if (mode === "edit" && editingExpense) {
      const updated = await updateBuildingExpense(editingExpense.id, payload)
      toast.success("Expense updated successfully")
      if (setData) setData(prev => prev.map(e => e.id === editingExpense.id ? updated : e))
    }
    options?.onSuccess?.()
  } catch (err) {
    toast("Failed to save expense", { description: err instanceof Error ? err.message : "Unknown error" })
    options?.onError?.(err)
  }
} 