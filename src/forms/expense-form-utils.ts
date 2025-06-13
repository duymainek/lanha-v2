import type { BuildingExpense, SupabaseBuilding } from "@/data/types"
import type { EditSheetField } from "@/components/ui/edit-sheet"
import { addBuildingExpense, updateBuildingExpense } from "@/data/supabase_data_source"
import { toast } from "sonner"

export function getExpenseFields(expense: BuildingExpense | null, buildingList: SupabaseBuilding[]): EditSheetField[] {
  return [
    {
      label: "Building",
      name: "building_id",
      value: expense?.building?.id ? String(expense.building.id) : "",
      type: "select",
      required: true,
      options: buildingList.map(b => ({ value: b.id, label: b.name }))
    },
    {
      label: "Expense Type",
      name: "expense_type",
      value: expense?.expense_type || "",
      type: "select",
      required: true,
      options: [
        { value: "water", label: "Water" },
        { value: "electricity", label: "Electricity" },
      ]
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
    if (!values.building_id || !values.expense_type || !values.amount) {
      toast("Please fill in all required fields")
      options?.onError?.(new Error("Missing required fields"))
      return
    }
    const payload = {
      building_id: Number(values.building_id),
      expense_type: values.expense_type as 'water' | 'electricity',
      amount: Number(values.amount),
      note: values.note,
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