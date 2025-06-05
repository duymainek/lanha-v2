import * as React from 'react';
import type { Room, Tenant } from '../data/types';
import { Table, TableColumn } from './Table';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { PencilIcon, EyeIcon, EllipsisVerticalIcon, PlusIcon, UsersIcon } from './icons';
import { TenantDetailModal, TenantEditModal, TenantAddModal } from '../pages/TenantModals';
import { fetchTenantsFromSupabase, addTenantToSupabase, updateTenantInSupabase } from '../data/roomDataSource';

export const RoomTenantSection: React.FC<{ room: Room; tenants: Tenant[]; reloadTenants: () => void }> = ({ room, tenants, reloadTenants }) => {
  const [search, setSearch] = React.useState('');
  const [activeActionMenu, setActiveActionMenu] = React.useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = React.useState<Tenant | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Search/filter
  const filteredTenants = tenants.filter(t => t.full_name.toLowerCase().includes(search.toLowerCase()));

  // Table columns
  const columns: TableColumn<Tenant>[] = [
    { header: '', accessor: (item) => <Avatar src={item.id_card_front_url || ''} name={item.full_name} size="sm" />, className: 'text-center' },
    { header: 'Tên', accessor: 'full_name', className: 'font-semibold' },
    { header: 'Email', accessor: 'email' },
    { header: 'SĐT', accessor: 'phone' },
    { header: 'Loại', accessor: (item) => item.is_primary ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Chính</span> : 'Phụ', className: 'text-center' },
    { header: 'Ngày vào', accessor: 'move_in_date' },
    { header: 'Ngày ra', accessor: 'move_out_date' },
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
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActiveActionMenu(item.id); }}
            aria-haspopup="true"
            aria-expanded={activeActionMenu === item.id}
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Button>
          {activeActionMenu === item.id && (
            <div className={`action-menu-content-${item.id} absolute right-0 mt-2 w-40 bg-card-bg border border-border-color rounded-md shadow-lg z-10 py-1 top-full`}>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedTenant(item); setIsDetailModalOpen(true); setActiveActionMenu(null); }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 flex items-center"
              >
                <EyeIcon className="h-4 w-4 mr-2" /> Xem chi tiết
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedTenant(item); setIsEditModalOpen(true); setActiveActionMenu(null); }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" /> Sửa
              </button>
              {!item.is_primary && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setActiveActionMenu(null);
                    if (!window.confirm('Đặt cư dân này làm chính?')) return;
                    setIsLoading(true);
                    try {
                      // Đặt tất cả tenants của phòng này về is_primary=false, sau đó set item.is_primary=true
                      const updateAll = tenants.filter(t => t.apartment_id === room.id && t.is_primary).map(t => updateTenantInSupabase(t.id, { is_primary: false }));
                      await Promise.all(updateAll);
                      await updateTenantInSupabase(item.id, { is_primary: true });
                      reloadTenants();
                    } catch (e: any) { setError(e.message); } finally { setIsLoading(false); }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center"
                >
                  <UsersIcon className="h-4 w-4 mr-2" /> Đặt làm chính
                </button>
              )}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setActiveActionMenu(null);
                  if (!window.confirm('Xóa cư dân này khỏi phòng?')) return;
                  setIsLoading(true);
                  try {
                    await updateTenantInSupabase(item.id, { apartment_id: null });
                    reloadTenants();
                  } catch (e: any) { setError(e.message); } finally { setIsLoading(false); }
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  // Thêm mới tenant
  const handleAddTenant = async (data: Partial<Tenant>) => {
    setIsLoading(true);
    setError(null);
    try {
      await addTenantToSupabase({ ...data, apartment_id: room.id });
      reloadTenants();
      setIsAddModalOpen(false);
    } catch (e: any) { setError(e.message); } finally { setIsLoading(false); }
  };

  // Sửa tenant
  const handleEditTenant = async (data: Partial<Tenant>) => {
    setIsLoading(true);
    setError(null);
    try {
      if (selectedTenant) {
        await updateTenantInSupabase(selectedTenant.id, { ...data, apartment_id: room.id });
        reloadTenants();
        setIsEditModalOpen(false);
      }
    } catch (e: any) { setError(e.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="font-semibold text-lg">Danh sách cư dân phòng {room.unit_number}</div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Tìm kiếm tên cư dân..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-border-color rounded px-3 py-1"
          />
          <Button onClick={()=>setIsAddModalOpen(true)} leftIcon={<PlusIcon className="h-5 w-5" />}>Thêm cư dân</Button>
        </div>
      </div>
      <Table<Tenant>
        columns={columns}
        data={filteredTenants}
        isLoading={isLoading}
        onRowClick={(item) => { if (!activeActionMenu) { setSelectedTenant(item); setIsDetailModalOpen(true); } }}
      />
      {filteredTenants.length === 0 && !isLoading && <div className="text-center text-text-muted py-8">Chưa có cư dân nào cho phòng này.</div>}
      {error && <div className="text-red-600">{error}</div>}
      {/* Modals */}
      <TenantDetailModal
        tenant={selectedTenant}
        isOpen={isDetailModalOpen}
        onClose={()=>setIsDetailModalOpen(false)}
        onEdit={(tenant: Tenant) => { setSelectedTenant(tenant); setIsEditModalOpen(true); }}
      />
      <TenantEditModal
        tenant={selectedTenant}
        isOpen={isEditModalOpen}
        onClose={()=>setIsEditModalOpen(false)}
        onSave={handleEditTenant}
      />
      <TenantAddModal
        isOpen={isAddModalOpen}
        onClose={()=>setIsAddModalOpen(false)}
        onSave={handleAddTenant}
        isLoading={isLoading}
      />
    </div>
  );
}; 