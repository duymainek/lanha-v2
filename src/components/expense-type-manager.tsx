import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EditSheet } from "@/components/ui/edit-sheet";
import { addExpenseType, updateExpenseType, removeExpenseType, fetchExpenseTypes as fetchExpenseTypesApi } from "@/data/supabase_data_source";
import { SupabaseCacheService } from "@/services/SupabaseCacheService";
import { TablePro } from "@/components/ui/table-pro";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

function ExpenseTypeBadge({ type }: { type: string }) {
  let color = "";
  let label = type;
  switch (type.toLowerCase()) {
    case "water":
      color = "bg-blue-100 text-blue-700 border-blue-200";
      label = "Water";
      break;
    case "electricity":
      color = "bg-yellow-100 text-yellow-700 border-yellow-200";
      label = "Electricity";
      break;
    default:
      color = "bg-gray-100 text-gray-700 border-gray-200";
      label = type;
  }
  return <Badge className={color + " px-2 py-1 border"}>{label}</Badge>;
}

export function ExpenseTypeManager() {
  const [expenseTypes, setExpenseTypes] = React.useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<{id: string, name: string} | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchExpenseTypes = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = await SupabaseCacheService.get('expense_types', fetchExpenseTypesApi);
      setExpenseTypes(cached);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchExpenseTypes();
  }, [fetchExpenseTypes]);

  const handleAdd = async (values: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      await addExpenseType(values.name);
      setOpen(false);
      await fetchExpenseTypes();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row: {id: string, name: string}) => {
    setEditRow(row);
    setEditOpen(true);
  };

  const handleEditSave = async (values: Record<string, string>) => {
    if (!editRow) return;
    setLoading(true);
    setError(null);
    try {
      await updateExpenseType(editRow.id, values.name);
      setEditOpen(false);
      setEditRow(null);
      await fetchExpenseTypes();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: {id: string, name: string}) => {
    if (!window.confirm(`Are you sure you want to delete "${row.name}"?`)) return;
    setLoading(true);
    setError(null);
    try {
      await removeExpenseType(row.id);
      await fetchExpenseTypes();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const actionMenu = (row: {id: string, name: string}) => (
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
        <DropdownMenuItem onClick={e => { e.stopPropagation(); handleEdit(row); }}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDelete(row); }}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const columns = [
    { label: "Expense Type Name", accessor: "name" as const },
    { label: "Display", render: (row: { name: string }) => <ExpenseTypeBadge type={row.name} />, width: 120 },
    {
      label: "",
      render: actionMenu,
      width: 60,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expense Types Management</CardTitle>
        <Button onClick={() => setOpen(true)}>Add Expense Type</Button>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="mb-4">
          <EditSheet
            open={open}
            onOpenChange={setOpen}
            title="Add Expense Type"
            onSave={handleAdd}
            fields={[{ label: "Expense Type Name", name: "name", value: "", required: true }]}
            saveLabel="Save"
            closeLabel="Cancel"
            loading={loading}
          />
          {editRow && (
            <EditSheet
              open={editOpen}
              onOpenChange={setEditOpen}
              title="Edit Expense Type"
              onSave={handleEditSave}
              fields={[{ label: "Expense Type Name", name: "name", value: editRow.name, required: true }]}
              saveLabel="Save"
              closeLabel="Cancel"
              loading={loading}
            />
          )}
        </div>
        <TablePro
          columns={columns}
          data={expenseTypes}
          rowKey={row => row.id}
          selectable={false}
          pagination={true}
        />
      </CardContent>
    </Card>
  );
} 