import React, { useEffect, useState } from 'react';
import { fetchBuildingExpenses, addBuildingExpense, updateBuildingExpense, removeBuildingExpense, fetchBuildingsFromSupabase } from '../data/roomDataSource';
import type { BuildingExpense, SupabaseBuilding } from '../data/types';
import { Table, TableColumn } from '../components/Table';
import { Card } from '../components/Card';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/Button';

const EXPENSE_TYPES = [
  { value: 'water', label: 'Water' },
  { value: 'electricity', label: 'Electricity' },
];

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<BuildingExpense[]>([]);
  const [buildings, setBuildings] = useState<SupabaseBuilding[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BuildingExpense | null>(null);
  const [form, setForm] = useState({
    building_id: '',
    expense_type: 'water',
    amount: '',
    note: '',
  });
  const [error, setError] = useState('');
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expensesData, buildingsData] = await Promise.all([
        fetchBuildingExpenses(),
        fetchBuildingsFromSupabase(),
      ]);
      setExpenses(expensesData);
      setBuildings(buildingsData);
    } catch (err: any) {
      setError(err.message || 'Error loading data');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ building_id: '', expense_type: 'water', amount: '', note: '' });
    setShowModal(true);
    setError('');
  };
  const openEdit = (item: BuildingExpense) => {
    setEditing(item);
    setForm({
      building_id: String(item.building_id),
      expense_type: item.expense_type,
      amount: String(item.amount),
      note: item.note || '',
    });
    setShowModal(true);
    setError('');
  };
  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setError('');
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setLoading(true);
    try {
      await removeBuildingExpense(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error deleting');
    }
    setLoading(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.building_id || !form.expense_type || !form.amount) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        building_id: Number(form.building_id),
        expense_type: form.expense_type as 'water' | 'electricity',
        amount: Number(form.amount),
        note: form.note,
      };
      if (editing) {
        await updateBuildingExpense(editing.id, payload);
      } else {
        await addBuildingExpense(payload);
      }
      closeModal();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error saving');
    }
    setLoading(false);
  };

  const columns: TableColumn<BuildingExpense>[] = [
    { header: 'Building', accessor: (item) => item.building?.name || '', sortable: false },
    { header: 'Expense Type', accessor: (item) => item.expense_type === 'water' ? 'Water' : 'Electricity', sortable: false },
    { header: 'Amount', accessor: (item) => item.amount.toLocaleString('en-US'), sortable: false },
    { header: 'Note', accessor: (item) => item.note || '', sortable: false },
    { header: 'Created Date', accessor: (item) => new Date(item.created_at).toLocaleDateString('en-US'), sortable: false },
    {
      header: '',
      accessor: () => '',
      render: (item) => (
        <div className="flex justify-end items-center relative">
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 action-menu-trigger-${String(item.id)}`}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActiveActionMenu(String(item.id)); }}
            aria-haspopup="true"
            aria-expanded={activeActionMenu === String(item.id)}
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Button>
          {activeActionMenu === String(item.id) && (
            <div className={`action-menu-content-${String(item.id)} absolute right-0 mt-2 w-32 bg-white border border-border-color rounded-md shadow-lg z-50 py-1 top-full`}>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveActionMenu(null); openEdit(item); }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" /> Sửa
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveActionMenu(null); handleDelete(item.id); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" /> Xóa
              </button>
            </div>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="p-6">
      <Card title="Building Expenses Management">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-text-muted">List of water and electricity expenses for each building.</span>
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark" onClick={openAdd}>Add Expense</button>
        </div>
        <Table columns={columns} data={expenses} isLoading={loading} emptyMessage="No expenses found." />
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </Card>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Building</label>
                <select className="w-full border rounded px-3 py-2" value={form.building_id} onChange={e => setForm(f => ({ ...f, building_id: e.target.value }))} required>
                  <option value="">-- Select Building --</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expense Type</label>
                <select className="w-full border rounded px-3 py-2" value={form.expense_type} onChange={e => setForm(f => ({ ...f, expense_type: e.target.value }))} required>
                  {EXPENSE_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300" onClick={closeModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};