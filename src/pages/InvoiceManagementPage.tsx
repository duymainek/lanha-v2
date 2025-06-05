import * as React from 'react';
import { InvoiceStatus, SupabaseInvoiceRaw } from '../data/types';
import { ALL_INVOICE_STATUSES } from '../data/appData';
import { getStatusColor } from '../utils/helpers';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Table, TableColumn } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { Badge } from '../components/Badge';
import { PlusIcon, PencilIcon, EyeIcon, EllipsisVerticalIcon } from '../components/icons';
import { fetchInvoicesFromSupabase, removeInvoiceFromSupabase, updateInvoiceStatusInSupabase } from '../data/roomDataSource';
import { InvoiceEditModal } from '../components/InvoiceEditModal';
import { InvoiceAddModal } from '../components/InvoiceAddModal';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';

const invoiceTableColumns: TableColumn<SupabaseInvoiceRaw>[] = [
  { header: 'ID', accessor: 'id', sortable:true, sortKey: 'id' },
  { header: 'Room', accessor: (item) => `${item.apartments && (item.apartments as any).buildings ? (item.apartments as any).buildings.name : ''} - ${item.apartments?.unit_number || ''}` },
  { header: 'Tenant', accessor: (item) => item.tenants?.full_name || item.tenant_id,},
  { header: 'Created', accessor: 'issue_date',  },
  { header: 'Amount', accessor: (item) => item.total.toLocaleString('vi-VN'),  },
  { header: 'Status', accessor: 'status', sortable: true, sortKey: 'status', render: (item) => <Badge colorClass={getStatusColor(item.status as InvoiceStatus)}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Badge> },
];

export const InvoiceManagementPage: React.FC = () => {
  const pageTitle = "Invoices";
  const [invoices, setInvoices] = React.useState<SupabaseInvoiceRaw[]>([]);
  const [isFetching, setIsFetching] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof SupabaseInvoiceRaw; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<SupabaseInvoiceRaw | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingInvoice, setEditingInvoice] = React.useState<SupabaseInvoiceRaw | null>(null);
  const [filters, setFilters] = React.useState<{ status: string }>({ status: '' });
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [activeActionMenu, setActiveActionMenu] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchInvoices = async () => {
      setIsFetching(true);
      setFetchError(null);
      try {
        const rawInvoices = await fetchInvoicesFromSupabase();
        setInvoices(rawInvoices);
      } catch (e: any) {
        setFetchError(e.message || 'Error fetching invoices.');
        setInvoices([]);
      } finally {
        setIsFetching(false);
      }
    };
    fetchInvoices();
  }, []);

  // Set sort mặc định khi mount
  React.useEffect(() => {
    if (!sortConfig) {
      setSortConfig({ key: 'id', direction: 'descending' });
    }
  }, [sortConfig]);

  // Filter
  const filteredInvoices = React.useMemo(() => {
    let data = invoices;
    if (filters.status) {
      data = data.filter(inv => inv.status === filters.status);
    }
    return data;
  }, [invoices, filters]);

  // Sort
  const sortedInvoices = React.useMemo(() => {
    if (!sortConfig) return filteredInvoices;
    const { key, direction } = sortConfig;
    return [...filteredInvoices].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') return direction === 'ascending' ? valA - valB : valB - valA;
      if (typeof valA === 'string' && typeof valB === 'string') return direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return 0;
    });
  }, [filteredInvoices, sortConfig]);

  // Pagination
  const totalItems = sortedInvoices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedInvoices = sortedInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Actions
  const handleRemove = async (item: SupabaseInvoiceRaw) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hóa đơn ${item.id}?`)) {
      await removeInvoiceFromSupabase(Number(item.id));
      const rawInvoices = await fetchInvoicesFromSupabase();
      setInvoices(rawInvoices);
    }
  };

  const handleMarkPaid = async (item: SupabaseInvoiceRaw) => {
    if (item.status.toLowerCase() === 'paid') return;
    if (!window.confirm(`Mark invoice ${item.id} as Paid?`)) return;
    try {
      await updateInvoiceStatusInSupabase(Number(item.id), 'Paid');
      const rawInvoices = await fetchInvoicesFromSupabase();
      setInvoices(rawInvoices);
    } catch (e: any) {
      alert('Failed to update status: ' + (e.message || e));
    }
  };

  const reloadInvoices = async () => {
    setIsFetching(true);
    try {
      const rawInvoices = await fetchInvoicesFromSupabase();
      setInvoices(rawInvoices);
    } catch (e: any) {
      setFetchError(e.message || 'Error fetching invoices.');
      setInvoices([]);
    } finally {
      setIsFetching(false);
    }
  };

  // Responsive Card Layout
  const renderInvoiceCard = (item: SupabaseInvoiceRaw) => {
    const buildingName = (item.apartments as any)?.buildings?.name || '';
    const roomNumber = item.apartments?.unit_number || '';
    return (
      <div
        key={item.id}
        className="bg-card-bg rounded-xl border border-border-color p-4 mb-5 shadow-sm flex flex-col gap-2"
        style={{ width: '90vw', maxWidth: 340, margin: '0 auto', minWidth: 0 }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold text-base">{item.invoice_number}</div>
          <Badge colorClass={getStatusColor(item.status as InvoiceStatus)}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Badge>
        </div>
        <div className="text-sm text-text-muted mb-1">
          <div className="mb-1"><span className="font-medium">Apartment</span><br />
            <span className="inline-flex items-center gap-1">{buildingName} - {roomNumber}</span>
          </div>
          <div className="flex flex-row gap-8 mb-1">
            <div><span className="font-medium">Issue Date</span><br />{item.issue_date}</div>
            <div><span className="font-medium">Due Date</span><br />{item.due_date}</div>
          </div>
          <div><span className="font-medium">Amount</span><br /><span className="text-lg font-bold text-text-main">{item.total.toLocaleString('vi-VN')} ₫</span></div>
        </div>
        <div className="flex flex-row flex-wrap gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(item)}>View</Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditingInvoice(item); setIsEditModalOpen(true); }}>Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(item)} disabled={item.status.toLowerCase() === 'paid'}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={() => handleRemove(item)}>Delete</Button>
        </div>
      </div>
    );
  };

  // Filter handler
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Sort handler
  const handleSortRequest = (key: keyof SupabaseInvoiceRaw) => {
    setSortConfig(prev => {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (prev && prev.key === key && prev.direction === 'ascending') direction = 'descending';
      return { key, direction };
    });
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-text-main">{pageTitle}</h1>
        <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<PlusIcon className="h-5 w-5" />}>Add New</Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 border-b border-border-color">
          <input
            type="text"
            placeholder="Search invoices..."
            className="border rounded px-3 py-2 w-full md:col-span-2 bg-card-bg text-text-main"
            onChange={e => { /* TODO: implement search */ }}
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('status', e.target.value)}
            options={[{ value: '', label: 'All Statuses' }, ...ALL_INVOICE_STATUSES.map(s => ({ value: s, label: s }))]}
          />
        </div>
        {/* Responsive Card List */}
        <div className="block md:hidden w-full overflow-x-hidden px-0">
          {paginatedInvoices.map(renderInvoiceCard)}
        </div>
        {/* Table for desktop */}
        <div className="hidden md:block">
          <Table<SupabaseInvoiceRaw>
            columns={invoiceTableColumns}
            data={paginatedInvoices}
            isLoading={isFetching}
            onRowClick={(item) => setSelectedInvoice(item)}
            sortConfig={sortConfig}
            onSortRequest={handleSortRequest}
          />
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(v) => setItemsPerPage(Number(v))}
          totalItems={totalItems}
        />
      </Card>

      {isAddModalOpen && (
        <InvoiceAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} reloadInvoices={reloadInvoices} />
      )}
      {isEditModalOpen && editingInvoice && (
        <InvoiceEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} invoice={editingInvoice} reloadInvoices={reloadInvoices} />
      )}
      <InvoiceDetailModal
        invoice={selectedInvoice as any}
        onClose={() => setSelectedInvoice(null)}
        onEdit={(inv: SupabaseInvoiceRaw) => {
          setSelectedInvoice(null);
          setEditingInvoice(inv as any);
          setIsEditModalOpen(true);
        }}
      />
    </div>
  );
};