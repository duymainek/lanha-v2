import React, { useEffect, useState } from 'react';
import { Tenant } from '../data/types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Table, TableColumn } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { Avatar } from '../components/Avatar';
import { SearchIcon, PlusIcon, PencilIcon, EyeIcon, EllipsisVerticalIcon } from '../components/icons';
import { fetchTenantsFromSupabase, updateTenantInSupabase, addTenantToSupabase } from '../data/roomDataSource';
import { TenantDetailModal, TenantEditModal, TenantAddModal } from './TenantModals';

const tenantTableColumns: TableColumn<Tenant>[] = [
  { header: 'Name', accessor: 'full_name', render: (item) => <div className="flex items-center"><Avatar src={item.id_card_front_url || ''} name={item.full_name} size="sm" /><span className="ml-3">{item.full_name}</span></div> },
  { header: 'Email', accessor: 'email' },
  { header: 'Building', accessor: (item) => item.building?.name  },
  { header: 'Room', accessor: (item) => item.apartment?.unit_number  },
  { header: 'Start', accessor: 'move_in_date' },
  {
    header: 'Status',
    accessor: 'move_out_date',
    render: (item) => {
      const today = new Date();
      const moveOutDate = item.move_out_date ? new Date(item.move_out_date) : null;
      const isActive = !moveOutDate || moveOutDate > today;
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {isActive ? 'Active' : 'Moved Out'}
        </span>
      );
    }
  },
];

export const TenantManagementPage: React.FC = () => {
  const pageTitle = "Tenants";
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ apartment_id: string; tenant_type: string }>({ apartment_id: '', tenant_type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<Partial<Tenant>>({});
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchTenantsFromSupabase()
      .then(setTenants)
      .catch(e => setFetchError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter, search
  let filteredTenants = tenants;
  if (filters.apartment_id) filteredTenants = filteredTenants.filter(t => String(t.apartment_id) === filters.apartment_id);
  if (filters.tenant_type) filteredTenants = filteredTenants.filter(t => t.tenant_type === filters.tenant_type);
  if (searchTerm) filteredTenants = filteredTenants.filter(t => t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.phone || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const totalItems = filteredTenants.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTenants = filteredTenants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Form handlers
  const handleOpenAdd = () => {
    setIsAddModalOpen(true);
  };
  
  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailModalOpen(true);
  };
  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsEditModalOpen(true);
  };
  const handleSaveEdit = async (data: Partial<Tenant>) => {
    setIsLoading(true);
    try {
      // Map data sang SupabaseTenant (loại bỏ các trường nested object)
      const {
        apartment,
        building,
        ...supabaseData
      } = data;
      // Nếu có apartment_id trong apartment object thì ưu tiên lấy
      if (apartment && apartment.id) {
        (supabaseData as any).apartment_id = apartment.id;
      }
      // Nếu có selectedTenant (edit)
      if (selectedTenant && selectedTenant.id) {
        await updateTenantInSupabase(selectedTenant.id, supabaseData);
      } else {
        await addTenantToSupabase(supabaseData);
      }
      const tenants = await fetchTenantsFromSupabase();
      setTenants(tenants);
      setIsEditModalOpen(false);
      setSelectedTenant(null);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi lưu tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAdd = async (data: Partial<Tenant>) => {
    setIsLoading(true);
    try {
      // Map data sang SupabaseTenant (loại bỏ các trường nested object)
      const { apartment, building, ...supabaseData } = data;
      if (apartment && apartment.id) {
        (supabaseData as any).apartment_id = apartment.id;
      }
      await addTenantToSupabase(supabaseData);
      const tenants = await fetchTenantsFromSupabase();
      setTenants(tenants);
      setIsAddModalOpen(false);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi thêm tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const columnsWithActions: TableColumn<Tenant>[] = [
    ...tenantTableColumns,
    {
      header: '',
      accessor: 'id',
      className: 'text-right relative',
      render: (item: Tenant) => (
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
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleViewDetails(item); }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 flex items-center"
              >
                <EyeIcon className="h-4 w-4 mr-2" /> View Details
              </button>
              <button
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleEdit(item); }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" /> Edit
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-text-main">{pageTitle}</h1>
        <Button onClick={handleOpenAdd} leftIcon={<PlusIcon className="h-5 w-5" />}>Add New</Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 border-b border-border-color">
          <Input
            type="text"
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            Icon={SearchIcon}
            className="w-full"
          />
        </div>
          <Table<Tenant>
          columns={columnsWithActions}
          data={paginatedTenants}
          isLoading={isLoading}
          onRowClick={(item) => { if (!activeActionMenu) handleViewDetails(item); }}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
        />
      </Card>
      <TenantDetailModal
        tenant={selectedTenant}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={handleEdit}
      />
      <TenantEditModal
        tenant={selectedTenant}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
      />
      <TenantAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveAdd}
        isLoading={isLoading}
      />
    </div>
  );
};