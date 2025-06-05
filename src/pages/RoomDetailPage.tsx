import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchRoomsFromSupabase, fetchTenantsFromSupabase, fetchBuildingsFromSupabase, fetchInvoicesFromSupabase, updateTenantInSupabase } from '../data/roomDataSource';
import type { Room, Tenant, SupabaseBuilding, SupabaseInvoiceRaw } from '../data/types';
import React from 'react';
import { Table, TableColumn } from '../components/Table';
import { InvoiceStatus } from '../data/types';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { PencilIcon } from '../components/icons';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { LinkIcon } from 'lucide-react';
import { TenantEditModal } from './TenantModals';
import { LogoutIcon } from '../components/icons';

export const RoomDetailPage = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState<SupabaseBuilding | null>(null);
  const [primaryTenant, setPrimaryTenant] = useState<Tenant | null>(null);
  const [leaseRange, setLeaseRange] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('No data');
  const [activeTab, setActiveTab] = useState<'invoices' | 'tenants'>('invoices');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invoices, setInvoices] = useState<SupabaseInvoiceRaw[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SupabaseInvoiceRaw | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showLinkExitedModal, setShowLinkExitedModal] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchRoomsFromSupabase(),
      fetchTenantsFromSupabase(),
      fetchBuildingsFromSupabase(),
      fetchInvoicesFromSupabase()
    ]).then(([rooms, tenantsData, buildings, invoicesData]) => {
      setTenants(tenantsData);
      setInvoices(invoicesData);
      const r = rooms.find(r => String(r.id) === String(roomId)) || null;
      setRoom(r);
      if (r) {
        // Building
        const b = buildings.find(b => b.id === r.building_id) || null;
        setBuilding(b);
        // Primary tenant
        const t = tenantsData.find(t => t.apartment_id === r.id && t.is_primary) || null;
        setPrimaryTenant(t);
        // Lease range
        if (t && t.move_in_date && t.move_out_date) {
          setLeaseRange(`${formatDate(t.move_in_date)} - ${formatDate(t.move_out_date)}`);
        } else {
          setLeaseRange('No data');
        }
        // Payment status: get latest invoice for this room
        const inv = invoicesData.filter(inv => inv.apartment_id === r.id).sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())[0];
        if (inv) {
          if (inv.status === 'paid') setPaymentStatus('Paid (last period)');
          else if (inv.status === 'unpaid') setPaymentStatus('Due next period');
          else if (inv.status === 'overdue') setPaymentStatus('Overdue');
          else setPaymentStatus(inv.status);
        } else {
          setPaymentStatus('No invoice');
        }
      }
      setLoading(false);
    });
  }, [roomId]);

  // Lọc invoices và tenants theo phòng này
  const roomInvoices = (room && invoices) ? invoices.filter(inv => inv.apartment_id === room.id) : [];
  const roomTenants = (room && tenants) ? tenants.filter(t => t.apartment_id === room.id) : [];

  // Lọc tenants đã exit (move_out_date < hôm nay và apartment_id null hoặc khác room.id)
  const exitedTenants = tenants.filter(t => {
    if (!t.move_out_date) return false;
    const moveOut = new Date(t.move_out_date);
    const today = new Date();
    return moveOut < today && (!t.apartment_id || t.apartment_id !== room?.id);
  });

  const handleUnlinkTenant = async (tenant: Tenant) => {
    if (!window.confirm(`Are you sure you want to unlink tenant "${tenant.full_name}" from this room?`)) return;
    await updateTenantInSupabase(tenant.id, { apartment_id: null, is_primary: false });
    // reload tenants
    const tenantsData = await fetchTenantsFromSupabase();
    setTenants(tenantsData);
  };

  if (loading) return <div className="p-8 text-center text-base text-gray-500">Loading...</div>;
  if (!room) return <div className="p-8 text-center text-red-600 text-base font-medium">Room not found</div>;

  return (
    <div className="w-full min-h-screen bg-white p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-2">{'>'}</span>
        <Link to="/rooms" className="hover:text-gray-700">Rooms</Link>
        <span className="mx-2">{'>'}</span>
        <span className="text-gray-900 font-medium">{room.unit_number}</span>
      </nav>
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Room Detail: {room.unit_number}</h1>
      {/* Info Card */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
          {/* Left Column */}
          <div className="space-y-6">
            <InfoRow label="Status">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${room.status === 'Rented' ? 'bg-blue-100 text-blue-700' : room.status === 'Vacant' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{room.status === 'Rented' ? 'In Progress' : room.status === 'Vacant' ? 'Available' : room.status}</span>
            </InfoRow>
            <InfoRow label="Payment Status">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">{paymentStatus}</span>
            </InfoRow>
            <InfoRow label="Price">
              <span className="text-gray-800 text-base font-normal">{room.display_price?.toLocaleString('vi-VN') || room.price.toLocaleString('vi-VN')} / month</span>
            </InfoRow>
          </div>
          {/* Right Column */}
          <div className="space-y-6">
            <InfoRow label="Building">
              <span className="text-gray-900 text-base font-medium">{building ? `${building.name} - ${building.address}${room.floor ? ` - Floor ${room.floor}` : ''}` : room.building_id}</span>
            </InfoRow>
            <InfoRow label="Lease Period">
              <span className="text-gray-800 text-base font-normal">{leaseRange}</span>
            </InfoRow>
            <InfoRow label="Primary Tenant">
              <span className="text-gray-900 text-base font-medium">{primaryTenant ? primaryTenant.full_name : 'No data'}</span>
            </InfoRow>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="mb-4">
        <div className="flex border-b border-slate-200">
          <button
              className={`ml-2 px-4 py-2 text-base font-medium focus:outline-none ${activeTab === 'invoices' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-blue-600'}`}
            onClick={() => setActiveTab('invoices')}
          >
            Invoices
          </button>
          <button
             className={`ml-2 px-4 py-2 text-base font-medium focus:outline-none ${activeTab === 'tenants' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-blue-600'}`}
           onClick={() => setActiveTab('tenants')}
          >
            Tenants
          </button>
        </div>
      </div>
      {/* Tab Content */}
      <div>
        {activeTab === 'invoices' && (
          <InvoiceTable invoices={roomInvoices} onRowClick={setSelectedInvoice} />
        )}
        {activeTab === 'tenants' && (
          <>
            <div className="mb-2 flex justify-end">
              <Button onClick={() => setShowLinkExitedModal(true)} variant="secondary">
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
            <TenantTable tenants={roomTenants} onRowClick={setSelectedTenant} onUnlink={handleUnlinkTenant} />
          </>
        )}
      </div>
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onEdit={undefined}
        />
      )}
      {/* Modal liên kết tenant đã rời đi */}
      <LinkExitedTenantModal
        isOpen={showLinkExitedModal}
        onClose={() => setShowLinkExitedModal(false)}
        onLink={async (tenantIds) => {
          if (!room) return;
          setLinking(true);
          setLinkError(null);
          try {
            await Promise.all(tenantIds.map(id => updateTenantInSupabase(id, { apartment_id: room.id, })));
            setShowLinkExitedModal(false);
            // reload tenants
            const tenantsData = await fetchTenantsFromSupabase();
            setTenants(tenantsData);
          } catch (e: any) {
            setLinkError(e.message || 'Error linking tenants');
          } finally {
            setLinking(false);
          }
        }}
        linking={linking}
        error={linkError}
        roomTenants={roomTenants}
      />
      {selectedTenant && (
        <TenantEditModal
          tenant={selectedTenant}
          isOpen={!!selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onSave={async (data) => {

            if (!selectedTenant) return;
            const { apartment, building, ...newData } = data;
            
            await updateTenantInSupabase(selectedTenant.id, newData);
            setSelectedTenant(null);
            // reload tenants
            const tenantsData = await fetchTenantsFromSupabase();
            setTenants(tenantsData);
        
          }}
        />
      )}
    </div>
  );
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center min-h-[32px] space-x-4">
      <span className="text-gray-500 text-base font-normal w-40 block">{label}</span>
      <div className="text-gray-900 text-base font-medium flex-1">{children}</div>
    </div>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function InvoiceTable({ invoices, onRowClick }: { invoices: SupabaseInvoiceRaw[]; onRowClick: (inv: SupabaseInvoiceRaw) => void }) {
  if (!invoices.length) return <div className="p-4 text-gray-500 rounded-lg">No invoices found.</div>;
  const columns: TableColumn<SupabaseInvoiceRaw>[] = [
    { header: 'Invoice #', accessor: 'invoice_number', className: 'font-medium' },
    { header: 'Issue Date', accessor: (item) => formatDate(item.issue_date) },
    { header: 'Due Date', accessor: (item) => formatDate(item.due_date) },
    { header: 'Status', accessor: 'status', render: (item) => (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${item.status === 'paid' ? 'bg-green-100 text-green-700' : item.status === 'unpaid' ? 'bg-yellow-100 text-yellow-700' : item.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{item.status}</span>
    ) },
    { header: 'Total', accessor: (item) => `₫ ${item.total?.toLocaleString('vi-VN')}` },
  ];
  return (
    <Table<SupabaseInvoiceRaw>
      columns={columns}
      data={invoices}
      emptyMessage="No invoices found."
      onRowClick={onRowClick}
    />
  );
}

function TenantTable({ tenants, onRowClick, onUnlink }: { tenants: Tenant[]; onRowClick: (tenant: Tenant) => void; onUnlink: (tenant: Tenant) => void }) {
  if (!tenants.length) return <div className="p-4 text-gray-500">No tenants found.</div>;
  const columns: TableColumn<Tenant>[] = [
    { header: 'Full Name', accessor: 'full_name', className: 'font-medium' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email', accessor: 'email' },
    { header: 'Move In', accessor: (item) => formatDate(item.move_in_date) },
    { header: 'Move Out', accessor: (item) => formatDate(item.move_out_date) },
    { header: 'Type', accessor: 'tenant_type', render: (item) => (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${item.is_primary ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{item.is_primary ? 'Primary' : 'Secondary'}</span>
    ) },
    { header: '', accessor: 'id', render: (item) => (
      <button onClick={e => { e.stopPropagation(); onUnlink(item); }} className="text-red-500 hover:text-red-700 p-1" title="Unlink">
        <LogoutIcon className="w-4 h-4" />
      </button>
    ) },
  ];
  return (
    <Table<Tenant>
      columns={columns}
      data={tenants}
      emptyMessage="No tenants found."
      onRowClick={onRowClick}
    />
  );
}

// Modal liên kết tenant đã rời đi
function LinkExitedTenantModal({ isOpen, onClose, onLink, linking, error, roomTenants }: {
  isOpen: boolean;
  onClose: () => void;
  onLink: (tenantIds: string[]) => void;
  linking: boolean;
  error: string | null;
  roomTenants: Tenant[];
}) {
  const [tenantList, setTenantList] = React.useState<Tenant[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchTenantsFromSupabase()
        .then(data => {
          // Lọc ra tenants không phải primary và chưa thuộc roomTenants
          const roomTenantIds = new Set(roomTenants.map(t => t.id));
          setTenantList(data.filter(t => !t.is_primary && !roomTenantIds.has(t.id)));
        })
        .finally(() => setLoading(false));
      setSelectedIds([]);
    }
  }, [isOpen, roomTenants]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev: string[]) => prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Link Secondary Tenants to Room">
      <div>
        {loading ? (
          <div className="p-4 text-gray-500">Loading...</div>
        ) : tenantList.length === 0 ? (
          <div className="p-4 text-gray-500">No secondary tenants found.</div>
        ) : (
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Move Out Date</th>
              </tr>
            </thead>
            <tbody>
              {tenantList.map((t: Tenant) => (
                <tr key={t.id} className="border-b">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => handleSelect(t.id)} />
                  </td>
                  <td className="px-3 py-2">{t.full_name}</td>
                  <td className="px-3 py-2">{t.email}</td>
                  <td className="px-3 py-2">{formatDate(t.move_out_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
      <div className="flex justify-end mt-4 gap-2">
        <Button onClick={onClose} variant="secondary">Close</Button>
        <Button onClick={() => onLink(selectedIds)} disabled={linking || selectedIds.length === 0} variant="primary">Link</Button>
      </div>
    </Modal>
  );
} 