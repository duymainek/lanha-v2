import React, { useEffect, useState } from 'react';
import { NotificationQueueItem } from '../data/types';
import { fetchNotificationsFromSupabase, updateNotificationInSupabase } from '../data/roomDataSource';
import { supabase } from '../utils/supabaseClient';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Table, TableColumn } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { Badge } from '../components/Badge';
import { SearchIcon, PencilIcon, EyeIcon, EllipsisVerticalIcon } from '../components/icons';
import { PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';

export const NotificationManagementPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NotificationQueueItem | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof NotificationQueueItem; direction: 'ascending' | 'descending' } | null>(null);

  // Fetch notifications from Supabase
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchNotificationsFromSupabase();
      setNotifications(data);
    } catch (e: any) {
      alert(e.message || 'Error loading notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter, search
  let filteredNotifications = notifications;
  if (searchTerm) {
    filteredNotifications = filteredNotifications.filter(n =>
      (n.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Sort
  const sortedNotifications = React.useMemo(() => {
    if (!sortConfig) return filteredNotifications;
    const { key, direction } = sortConfig;
    return [...filteredNotifications].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') return direction === 'ascending' ? valA - valB : valB - valA;
      if (typeof valA === 'string' && typeof valB === 'string') return direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return 0;
    });
  }, [filteredNotifications, sortConfig]);

  // Pagination
  const totalItems = sortedNotifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedNotifications = sortedNotifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Update notification status
  const handleUpdateStatus = async (item: NotificationQueueItem, status: string) => {
    setIsLoading(true);
    try {
      await updateNotificationInSupabase(item.id, { status });
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Error updating status');
    } finally {
      setIsLoading(false);
    }
  };

  // Xóa notification
  const handleRemoveNotification = async (item: NotificationQueueItem) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('notification_queue')
        .delete()
        .eq('id', item.id);
      if (error) throw new Error(error.message);
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Error removing notification');
    } finally {
      setIsLoading(false);
    }
  };

  // Sort handler
  const handleSortRequest = (key: keyof NotificationQueueItem) => {
    setSortConfig(prev => {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (prev && prev.key === key && prev.direction === 'ascending') direction = 'descending';
      return { key, direction };
    });
    setCurrentPage(1);
  };

  // Table columns
  const columnsWithActions: TableColumn<NotificationQueueItem>[] = [
    { header: 'Title', accessor: 'title', },
    { header: 'Created Date', accessor: 'created_at', render: (item) => new Date(item.created_at).toLocaleString('en-US') },
    { header: 'Tenant', accessor: 'tenant', render: (item) => item.tenant?.full_name || '-' },
    { header: 'Invoice', accessor: 'invoice', render: (item) => item.invoice?.invoice_number || '-' },
    { header: 'Status', accessor: 'status', render: (item) => <Badge colorClass={item.status === 'Sent' ? 'bg-green-100 text-green-700' : (item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>{item.status}</Badge> },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right relative',
      render: (item: NotificationQueueItem) => (
        <div className="flex justify-end items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 action-menu-trigger-${String(item.id)}`}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActiveActionMenu(item.id); }}
            aria-haspopup="true"
            aria-expanded={activeActionMenu === item.id}
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Button>
          {activeActionMenu === item.id && (
            <div className={`action-menu-content-${String(item.id)} absolute right-0 mt-2 w-40 bg-card-bg border border-border-color rounded-md shadow-lg z-10 py-1 top-full`}>
              <button
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleUpdateStatus(item, 'Sent'); }}
                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-100 flex items-center"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" /> Send
              </button>
              <button
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleRemoveNotification(item); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" /> Remove
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 border-b border-border-color">
          <Input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            Icon={SearchIcon}
            className="w-full md:col-span-3"
          />
        </div>
        <Table<NotificationQueueItem>
          columns={columnsWithActions}
          data={paginatedNotifications}
          isLoading={isLoading}
          onRowClick={(item) => { if (!activeActionMenu) alert(JSON.stringify(item, null, 2)); }}
          sortConfig={sortConfig}
          onSortRequest={handleSortRequest}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(v) => setItemsPerPage(Number(v))}
          totalItems={totalItems}
        />
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Notification Status' : ''}>
        {editingItem && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleUpdateStatus(editingItem, editingItem.status === 'Sent' ? 'Pending' : 'Sent');
              handleCloseModal();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                className="w-full border rounded p-2"
                value={editingItem.status || ''}
                onChange={e => setEditingItem({ ...editingItem, status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="Sent">Sent</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>Hủy</Button>
              <Button type="submit">Lưu thay đổi</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};