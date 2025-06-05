import * as React from 'react';
import type { Room, SupabaseInvoiceRaw } from '../data/types';
import { Table, TableColumn } from './Table';
import { Button } from './Button';
import { Badge } from './Badge';
import { Pagination } from './Pagination';
import { PlusIcon, EyeIcon, PencilIcon, EllipsisVerticalIcon } from './icons';
import { InvoiceAddModal } from './InvoiceAddModal';
import { addInvoiceToSupabase, updateInvoiceInSupabase } from '../data/roomDataSource';

// Placeholder cho modal chi tiết hóa đơn (có thể import từ InvoiceManagementPage nếu cần)
const InvoiceDetailModal = ({ invoice, isOpen, onClose }: { invoice: SupabaseInvoiceRaw | null; isOpen: boolean; onClose: () => void }) => {
  if (!invoice) return null;
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>Modal chi tiết hóa đơn (đang phát triển)</div>
  );
};

export const RoomBillingSection: React.FC<{ room: Room; invoices: SupabaseInvoiceRaw[]; reloadInvoices: () => void }> = ({ room, invoices, reloadInvoices }) => {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [activeActionMenu, setActiveActionMenu] = React.useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<SupabaseInvoiceRaw | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filter invoices theo apartment_id
  let filtered = invoices.filter(inv => inv.apartment_id === room.id);
  if (statusFilter) filtered = filtered.filter(inv => inv.status === statusFilter);
  if (search) filtered = filtered.filter(inv => inv.invoice_number.toLowerCase().includes(search.toLowerCase()));
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Table columns
  const columns: TableColumn<SupabaseInvoiceRaw>[] = [
    { header: 'Số hóa đơn', accessor: 'invoice_number' },
    { header: 'Ngày lập', accessor: 'issue_date' },
    { header: 'Ngày đến hạn', accessor: 'due_date' },
    { header: 'Tổng tiền', accessor: (item) => item.total.toLocaleString('vi-VN') + ' ₫', className: 'text-right' },
    { header: 'Trạng thái', accessor: (item) => <Badge>{item.status}</Badge> },
    {
      header: 'Thao tác',
      accessor: 'id',
      className: 'text-right',
      render: (item) => (
        <div className="flex justify-end items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 action-menu-trigger-${item.id}`}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActiveActionMenu(String(item.id)); }}
            aria-haspopup="true"
            aria-expanded={activeActionMenu === String(item.id)}
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Button>
          {activeActionMenu === String(item.id) && (
            <div className={`action-menu-content-${item.id} absolute right-0 mt-2 w-40 bg-card-bg border border-border-color rounded-md shadow-lg z-10 py-1 top-full`}>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedInvoice(item); setIsDetailModalOpen(true); setActiveActionMenu(null); }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 flex items-center"
              >
                <EyeIcon className="h-4 w-4 mr-2" /> Xem chi tiết
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveActionMenu(null); setSelectedInvoice(item); /* TODO: mở modal sửa */ alert('Chức năng sửa sẽ được bổ sung'); }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" /> Sửa
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  // Tổng kết
  const totalAmount = filtered.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPending = filtered.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Thêm hóa đơn
  const handleAddInvoice = async (data: Partial<SupabaseInvoiceRaw>) => {
    setIsLoading(true);
    setError(null);
    try {
      await addInvoiceToSupabase({ ...data, apartment_id: room.id });
      reloadInvoices();
      setIsAddModalOpen(false);
    } catch (e: any) { setError(e.message); } finally { setIsLoading(false); }
  };

  // Sửa hóa đơn (placeholder, có thể mở rộng sau)
  const handleEditInvoice = async (data: Partial<SupabaseInvoiceRaw>) => {
    setIsLoading(true);
    setError(null);
    try {
      if (selectedInvoice) {
        await updateInvoiceInSupabase(selectedInvoice.id, { ...data, apartment_id: room.id });
        reloadInvoices();
        setIsDetailModalOpen(false);
      }
    } catch (e: any) { setError(e.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="font-semibold text-lg">Lịch sử hóa đơn phòng {room.unit_number}</div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Tìm kiếm số hóa đơn..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-border-color rounded px-3 py-1"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-border-color rounded px-3 py-1"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="paid">Đã thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
            <option value="overdue">Quá hạn</option>
          </select>
          <Button onClick={()=>setIsAddModalOpen(true)} leftIcon={<PlusIcon className="h-5 w-5" />}>Thêm hóa đơn</Button>
        </div>
      </div>
      <div className="flex gap-8">
        <div><b>Tổng tiền:</b> <span className="text-lg font-bold text-green-700">{totalAmount.toLocaleString('vi-VN')} ₫</span></div>
        <div><b>Chưa thanh toán:</b> <span className="text-lg font-bold text-red-700">{totalPending.toLocaleString('vi-VN')} ₫</span></div>
      </div>
      <Table<SupabaseInvoiceRaw>
        columns={columns}
        data={paginated}
        isLoading={isLoading}
        onRowClick={(item) => { if (!activeActionMenu) { setSelectedInvoice(item); setIsDetailModalOpen(true); } }}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={totalItems}
      />
      {paginated.length === 0 && !isLoading && <div className="text-center text-text-muted py-8">Chưa có hóa đơn nào cho phòng này.</div>}
      {error && <div className="text-red-600">{error}</div>}
      {/* Modals */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isDetailModalOpen}
        onClose={()=>setIsDetailModalOpen(false)}
      />
      <InvoiceAddModal
        isOpen={isAddModalOpen}
        onClose={()=>setIsAddModalOpen(false)}
        reloadInvoices={reloadInvoices}
        onSave={handleAddInvoice}
        isLoading={isLoading}
      />
    </div>
  );
}; 