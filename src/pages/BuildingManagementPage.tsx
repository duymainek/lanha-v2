import React, { useEffect, useState } from 'react';
import { SupabaseBuilding } from '../data/types';
// MOCK_BUILDINGS is no longer used for initial table data, but might be used by other parts of the app (e.g. select options in other pages)
// import { MOCK_BUILDINGS } from '../data/appData'; 
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Table, TableColumn } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { SearchIcon, PlusIcon, PencilIcon, EyeIcon, EllipsisVerticalIcon } from '../components/icons';
import { fetchBuildingsFromSupabase, updateBuildingInSupabase } from '../data/roomDataSource';

interface BuildingFormData {
  name: string;
  address: string;
  notes?: string; // Was 'notes', maps to Supabase 'description'
}

// Updated table columns to reflect data available from Supabase
// Removed totalRooms and vacantRooms as they are not in the 'buildings' table schema provided
const buildingTableColumns: TableColumn<SupabaseBuilding>[] = [
    { 
      header: 'Name', 
      accessor: 'name', 
      sortable: true, 
      sortKey: 'name', 
      render: (item) => (
        <div className="flex items-center">
          {/* item.imageUrl will be undefined if not mapped from Supabase, Avatar will show initials */}
          <Avatar src={undefined} name={item.name} size="md" />
          <span className="ml-3 font-medium">{item.name}</span>
        </div>
      ) 
    },
    { header: 'Address', accessor: 'address', sortable: true, sortKey: 'address', className: 'max-w-md' }, // Added max-w for address too
    { 
      header: 'Description', 
      accessor: (item) => item.description_en || item.description || '-',
      className: 'max-w-sm', // Constrain the td width
      render: (item) => <p className="truncate">{item.description_en || item.description || '-'}</p>  // p fills the td, truncate applies
    },
];

export const BuildingManagementPage: React.FC = () => {
  const pageTitle = "Buildings";
  const [buildings, setBuildings] = useState<SupabaseBuilding[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupabaseBuilding | null>(null);
  const [formData, setFormData] = useState<BuildingFormData>({ name: '', address: '', notes: '' });
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SupabaseBuilding; direction: 'ascending' | 'descending' } | null>(null);

  useEffect(() => {
    setIsFetching(true);
    fetchBuildingsFromSupabase()
      .then(setBuildings)
      .catch(e => setFetchError(e.message))
      .finally(() => setIsFetching(false));
  }, []);

  // Search & filter
  let filteredBuildings = buildings;
  if (searchTerm) {
    filteredBuildings = filteredBuildings.filter(b =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.description_en || b.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Sort
  const sortedBuildings = React.useMemo(() => {
    if (!sortConfig) return filteredBuildings;
    const { key, direction } = sortConfig;
    return [...filteredBuildings].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') return direction === 'ascending' ? valA - valB : valB - valA;
      if (typeof valA === 'string' && typeof valB === 'string') return direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return 0;
    });
  }, [filteredBuildings, sortConfig]);

  // Pagination
  const totalItems = sortedBuildings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedBuildings = sortedBuildings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Modal handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', address: '', notes: '' });
    setIsModalOpen(true);
  };
  const handleOpenEdit = (building: SupabaseBuilding) => {
    setEditingItem(building);
    setFormData({
      name: building.name,
      address: building.address,
      notes: building.description_en || building.description || '',
    });
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', address: '', notes: '' });
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsFetching(true);
      if (editingItem) {
        await updateBuildingInSupabase(editingItem.id, formData);
      } else {
        // TODO: Thêm hàm addBuildingInSupabase nếu muốn thêm mới
        alert('Chức năng thêm mới chưa được hỗ trợ!');
      }
      const updated = await fetchBuildingsFromSupabase();
      setBuildings(updated);
      handleCloseModal();
    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  // Sort handler
  const handleSortRequest = (key: keyof SupabaseBuilding) => {
    setSortConfig(prev => {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (prev && prev.key === key && prev.direction === 'ascending') direction = 'descending';
      return { key, direction };
    });
    setCurrentPage(1);
  };

  const columnsWithActions: TableColumn<SupabaseBuilding>[] = [
    ...buildingTableColumns,
    {
      header: '',
      accessor: 'id',
      className: 'text-right relative',
      render: (item: SupabaseBuilding) => (
        <div className="flex justify-end items-center">
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
            <div className={`action-menu-content-${String(item.id)} absolute right-0 mt-2 w-40 bg-card-bg border border-border-color rounded-md shadow-lg z-10 py-1 top-full`}>
              <button
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleOpenEdit(item); }}
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
            placeholder="Search buildings by name, address, description..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            Icon={SearchIcon}
            className="w-full md:col-span-2 lg:col-span-3"
          />
        </div>
        {fetchError && (
          <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md">
            Error fetching buildings: {fetchError}. Ensure Supabase is configured correctly and accessible.
          </div>
        )}
        <Table<SupabaseBuilding>
          columns={columnsWithActions}
          data={paginatedBuildings}
          isLoading={isFetching}
          emptyMessage={isFetching ? "Loading buildings..." : (fetchError ? "Could not load buildings." : "No buildings found.")}
          onRowClick={(item) => { if (!activeActionMenu) alert(JSON.stringify(item, null, 2)); }}
          sortConfig={sortConfig}
          onSortRequest={handleSortRequest}
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Building' : 'Add New Building'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            name="name"
            label="Building Name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <Input
            id="address"
            name="address"
            label="Address"
            type="text"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-text-main mb-1">Description (Notes)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleInputChange}
              rows={3}
              className="block w-full border border-border-color rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">
              {editingItem ? 'Save Changes' : 'Add Building'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};