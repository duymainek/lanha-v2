import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, RoomStatus, SupabaseBuilding } from '../data/types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Table, TableColumn } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { RoomStatusBadge } from '../components/Badge';
import { SearchIcon, PencilIcon, EyeIcon, EllipsisVerticalIcon } from '../components/icons';
import { fetchRoomsFromSupabase, fetchBuildingsFromSupabase, updateRoomInSupabase } from '../data/roomDataSource';
import { BuildingTabBar } from '../components/BuildingTabBar';

const roomTableColumns: TableColumn<Room>[] = [
  { header: 'Room No.', accessor: 'unit_number', sortable: true, sortKey: 'unit_number', className: 'text-center' },
  { header: 'Building', accessor: (item) => item.building_id, className: 'text-center' },
  { header: 'Area', accessor: 'area', sortable: true, sortKey: 'area', className: 'text-center' },
  { header: 'Rent', accessor: (item) => item.price.toLocaleString('vi-VN'), sortable: true, sortKey: 'price', className: 'text-left' },
  { header: 'Status', accessor: (item) => <RoomStatusBadge status={item.status} />, sortable: true, sortKey: 'status', className: 'text-left' },
];

export const RoomManagementPage: React.FC = () => {
  const pageTitle = "Rooms";
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<SupabaseBuilding[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Room; direction: 'ascending' | 'descending' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<Partial<Room>>({});
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsFetching(true);
    fetchRoomsFromSupabase()
      .then(setRooms)
      .catch(e => setFetchError(e.message))
      .finally(() => setIsFetching(false));
  }, []);

  useEffect(() => {
    setIsLoadingBuildings(true);
    fetchBuildingsFromSupabase()
      .then(setBuildings)
      .catch(() => setBuildings([]))
      .finally(() => setIsLoadingBuildings(false));
  }, []);

  const buildingOptions = buildings.map(b => ({ value: b.id, label: b.name }));

  // Filter, search, sort
  let filteredRooms = rooms;
  if (selectedBuildingId) filteredRooms = filteredRooms.filter(r => r.building_id === selectedBuildingId);
  if (searchTerm) filteredRooms = filteredRooms.filter(r => r.unit_number.toLowerCase().includes(searchTerm.toLowerCase()));
  if (sortConfig) {
    filteredRooms = [...filteredRooms].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
      if (typeof valA === 'string' && typeof valB === 'string') return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return 0;
    });
  }
  const totalItems = filteredRooms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedRooms = filteredRooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Form handlers
  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({});
    setIsModalOpen(true);
  };
  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({ ...room });
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setFormData({});
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    if (type === 'number') processedValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: validate formData
    if (editingRoom) {
      await updateRoomInSupabase(editingRoom.id, formData as Room);
    } else {
      // TODO: implement addRoomToSupabase
    }
    handleCloseModal();
    // Reload rooms
    setIsFetching(true);
    fetchRoomsFromSupabase()
      .then(setRooms)
      .catch(e => setFetchError(e.message))
      .finally(() => setIsFetching(false));
  };

  const columnsWithActions: TableColumn<Room>[] = [
    ...roomTableColumns,
    {
      header: '',
      accessor: (item) => String(item.id),
      className: 'text-center relative',
      render: (item: Room) => (
        <div className="flex justify-center items-center">
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
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/rooms/${item.id}`); }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 flex items-center"
              >
                <EyeIcon className="h-4 w-4 mr-2" /> View Details
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  if (fetchError) {
    return <div className="p-6 text-red-600">Lỗi khi tải dữ liệu phòng: {fetchError}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-text-main">{pageTitle}</h1>
        <Button onClick={handleOpenAdd}>Add New</Button>
      </div>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 border-b border-border-color">
          <Input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            Icon={SearchIcon}
            className="w-full"
          />
        </div>
        <div className="pb-4 flex items-center">
          <BuildingTabBar
            buildings={buildings}
            selectedBuildingId={String(selectedBuildingId || '')}
            onSelect={(val: string) => setSelectedBuildingId(Number(val))}
          />
        </div>
        <Table<Room>
          columns={columnsWithActions}
          data={paginatedRooms}
          isLoading={isFetching}
          onRowClick={(item) => { if (!activeActionMenu) navigate(`/rooms/${item.id}`); }}
          sortConfig={sortConfig}
          onSortRequest={key => setSortConfig(prev => {
            let direction: 'ascending' | 'descending' = 'ascending';
            if (prev && prev.key === key && prev.direction === 'ascending') direction = 'descending';
            return { key, direction };
          })}
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
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingRoom ? 'Edit Room' : 'Add New Room'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="unit_number"
            name="unit_number"
            label="Unit Number"
            type="text"
            value={formData.unit_number || ''}
            onChange={handleInputChange}
            required
          />
          <Select
            id="building_id"
            name="building_id"
            label="Building"
            value={formData.building_id || ''}
            onChange={handleInputChange}
            options={buildingOptions}
            required
          />
          <Input
            id="bedrooms"
            name="bedrooms"
            label="Bedrooms"
            type="number"
            value={formData.bedrooms || 1}
            onChange={handleInputChange}
            required
            min={1}
          />
          <Input
            id="bathrooms"
            name="bathrooms"
            label="Bathrooms"
            type="number"
            value={formData.bathrooms || 1}
            onChange={handleInputChange}
            required
            min={1}
          />
          <Input
            id="area"
            name="area"
            label="Area (m²)"
            type="number"
            value={formData.area || 0}
            onChange={handleInputChange}
            required
            min={0}
          />
          <Input
            id="price"
            name="price"
            label="Price"
            type="number"
            value={formData.price || 0}
            onChange={handleInputChange}
            required
            min={0}
          />
          <Select
            id="status"
            name="status"
            label="Status"
            value={formData.status || ''}
            onChange={handleInputChange}
            options={Object.values(RoomStatus).map(status => ({ value: status, label: status }))}
            required
          />
          <Input
            id="minimum_rental_period"
            name="minimum_rental_period"
            label="Minimum Rental Period (months)"
            type="number"
            value={formData.minimum_rental_period || 1}
            onChange={handleInputChange}
            required
            min={1}
          />
          <Input
            id="deposit"
            name="deposit"
            label="Deposit"
            type="number"
            value={formData.deposit || 0}
            onChange={handleInputChange}
            required
            min={0}
          />
          {/* Thêm các trường khác nếu cần */}
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">
              {editingRoom ? 'Save Changes' : 'Add Room'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};