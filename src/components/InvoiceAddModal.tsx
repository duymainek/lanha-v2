import * as React from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Modal } from './Modal';
import { addInvoiceToSupabase, fetchRoomsFromSupabase, fetchBuildingsFromSupabase, fetchUtilityReadingsByApartment, fetchTenantsFromSupabase } from '../data/roomDataSource';
import type { Room, Tenant, UtilityReading } from '../data/types';

const STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
];

// Định nghĩa hàm formatDate ngay sau import, trước khi dùng cho state
const formatDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Sinh số hóa đơn theo format INV-MM-YY-<building_id>-<apartment_id>
 * @param {Room} room - Thông tin phòng
 * @param {string} issueDate - Ngày phát hành (YYYY-MM-DD)
 * @returns {string}
 */
function genInvoiceNumber(room: Room | undefined, issueDate: string): string {
  console.log(room);
  if (!room || !issueDate) return '';
  const month = String(new Date(issueDate).getMonth() + 1).padStart(2, '0');
  const year = String(new Date(issueDate).getFullYear()).slice(-2);
  return `INV-${month}-${year}-${room.building_id}-${room.id}`;
}

export const InvoiceAddModal = ({ isOpen, onClose, reloadInvoices }: { isOpen: boolean; onClose: () => void; reloadInvoices?: () => void }) => {
  // State
  const [apartment, setApartment] = React.useState('');
  const [status, setStatus] = React.useState('unpaid');
  const [issueDate, setIssueDate] = React.useState(formatDate(new Date()));
  const [dueDate, setDueDate] = React.useState(formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [notes, setNotes] = React.useState('');
  const [additionalFees, setAdditionalFees] = React.useState(0);
  const [discounts, setDiscounts] = React.useState(0);
  const [rentItems, setRentItems] = React.useState<any[]>([]);
  const [additionalItems, setAdditionalItems] = React.useState<any[]>([]);
  const [showAddItem, setShowAddItem] = React.useState(false);
  const [newItemType, setNewItemType] = React.useState('Rent');
  const [newItemDesc, setNewItemDesc] = React.useState('');
  const [newItemQty, setNewItemQty] = React.useState(1);
  const [newItemUnitPrice, setNewItemUnitPrice] = React.useState(0);
  const newItemTotal = newItemQty * newItemUnitPrice;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [buildings, setBuildings] = React.useState<{ [id: string]: string }>({});
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = React.useState(false);
  const [dueDateTouched, setDueDateTouched] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setIsLoadingRooms(true);
    Promise.all([
      fetchRoomsFromSupabase(),
      fetchBuildingsFromSupabase(),
      fetchTenantsFromSupabase()
    ]).then(([roomList, buildingList, tenantList]) => {
      setRooms(roomList);
      const buildingMap: { [id: string]: string } = {};
      buildingList.forEach(b => { buildingMap[b.id] = b.name; });
      setBuildings(buildingMap);
      setTenants(tenantList);
      setIsLoadingRooms(false);
    }).catch(() => setIsLoadingRooms(false));
  }, [isOpen]);

  React.useEffect(() => {
    if (!apartment) {
      setRentItems([]);
      setAdditionalItems([]);
      return;
    }
    const room = rooms.find(r => r.id === Number(apartment));
    if (!room) return;
    // Tạo rent item
    const rentItem = {
      id: Date.now(),
      item_type: 'rent',
      description: 'Tiền thuê phòng',
      quantity: 1,
      unit_price: room.price,
      total: room.price,
      previous_reading: null,
      current_reading: null,
      discount: null,
      created_at: new Date().toISOString(),
    };
    // Lấy giá điện/nước từ room (nếu có)
    const electricityPrice = (room as any).electricity_price || 0;
    const waterPrice = (room as any).water_price || 0;
    // Lấy chỉ số điện/nước mới nhất
    fetchUtilityReadingsByApartment(Number(apartment)).then(readings => {
      const electricityReading = readings.electricity;
      const waterReading = readings.water;
      // Electricity item
      const eleItem = {
        id: Date.now() + 1,
        item_type: 'electricity',
        description: 'Tiền điện',
        quantity: 0,
        unit_price: electricityPrice,
        total: 0,
        previous_reading: electricityReading?.reading_value || 0,
        current_reading: electricityReading?.reading_value || 0,
        discount: null,
        created_at: new Date().toISOString(),
      };
      // Water item (không có previous/current reading, quantity nhập được)
      const waterItem = {
        id: Date.now() + 2,
        item_type: 'water',
        description: 'Tiền nước',
        quantity: waterReading?.reading_value || 0,
        unit_price: waterPrice,
        total: 0,
        discount: null,
        created_at: new Date().toISOString(),
      };
      setRentItems([rentItem]);
      setAdditionalItems([eleItem, waterItem]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartment]);

  React.useEffect(() => {
    if (!dueDateTouched) {
      const newDue = formatDate(new Date(new Date(issueDate).getTime() + 7 * 24 * 60 * 60 * 1000));
      setDueDate(newDue);
    }
  }, [issueDate, dueDateTouched]);

  const handleRemoveRentItem = (id: number) => setRentItems(rentItems.filter(i => i.id !== id));
  const handleRemoveAdditionalItem = (id: number) => setAdditionalItems(additionalItems.filter(i => i.id !== id));

  const subtotal = rentItems.reduce((sum, i) => sum + (i.total || 0), 0) + additionalItems.reduce((sum, i) => sum + (i.total || 0), 0);
  const total = subtotal + (additionalFees || 0) - (discounts || 0);

  const handleAddItem = () => {
    const newId = Date.now();
    const item = {
      id: newId,
      item_type: newItemType.toLowerCase().replace(' ', '_'),
      description: newItemDesc,
      quantity: newItemQty,
      unit_price: newItemUnitPrice,
      total: newItemTotal,
      previous_reading: null,
      current_reading: null,
      discount: null,
      created_at: new Date().toISOString(),
    };
    if (newItemType === 'Rent') {
      setRentItems(prev => [...prev, item]);
    } else {
      setAdditionalItems(prev => [...prev, item]);
    }
    setShowAddItem(false);
    setNewItemType('Rent');
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemUnitPrice(0);
  };

  const handleChangeElectricityReading = (id: number, newCurrent: number) => {
    setAdditionalItems(items => items.map(item => {
      if (item.id === id && item.item_type === 'electricity') {
        const prev = Number(item.previous_reading) || 0;
        const qty = newCurrent - prev;
        return {
          ...item,
          current_reading: newCurrent,
          quantity: qty,
          total: qty * (item.unit_price || 0),
        };
      }
      return item;
    }));
  };

  const handleChangeWaterQuantity = (id: number, newQty: number) => {
    setAdditionalItems(items => items.map(item => {
      if (item.id === id && item.item_type === 'water') {
        return {
          ...item,
          quantity: newQty,
          total: newQty * (item.unit_price || 0),
        };
      }
      return item;
    }));
  };

  const handleCreateInvoice = async () => {
    setIsSubmitting(true);
    try {
      const room = rooms.find(r => r.id === Number(apartment));
      const invoiceNumberAuto = genInvoiceNumber(room, issueDate);
      const payload = {
        apartment_id: Number(apartment),
        invoice_number: invoiceNumberAuto,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        notes,
        subtotal,
        additional_fees: additionalFees,
        discounts,
        total,
        invoice_items: [...rentItems, ...additionalItems],
        tenant_id: tenants.find(t => t.apartment_id === Number(apartment))?.id,
      };
      await addInvoiceToSupabase(payload);
      setIsSubmitting(false);
      onClose();
      if (reloadInvoices) reloadInvoices();
    } catch (err: any) {
      setIsSubmitting(false);
      alert('Tạo hóa đơn thất bại: ' + (err.message || err));
    }
  };

  const room = rooms.find(r => r.id === Number(apartment));
  const invoiceNumberAuto = genInvoiceNumber(room, issueDate);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Invoice" className="max-w-full w-[95vw] min-h-[40vh] md:min-h-[50vh]">
      <div className="bg-card-bg rounded-xl p-8 space-y-6 h-full flex flex-col">
        {/* Invoice Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Apartment</label>
            <Select
              value={apartment}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setApartment(e.target.value)}
              options={rooms.map(r => ({
                value: r.id,
                label: `${buildings[r.building_id] || 'Unknown'} - ${r.unit_number}`
              }))}
              disabled={isLoadingRooms}
              placeholder={isLoadingRooms ? 'Đang tải...' : 'Chọn phòng'}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Invoice Number</label>
              <Input value={invoiceNumberAuto} readOnly placeholder={invoiceNumberAuto} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date</label>
              <Input type="date" value={issueDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIssueDate(formatDate(new Date(e.target.value)))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <Input type="date" value={dueDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setDueDate(formatDate(new Date(e.target.value))); setDueDateTouched(true); }} />
            </div>
          </div>
        </div>

        {/* Invoice Items Section */}
        <div>
          <div className="flex flex-row justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Invoice Items</h3>
            <Button variant="secondary" size="sm" onClick={() => setShowAddItem(true)}>+ Add Item</Button>
          </div>
          {/* Rent Sub-section */}
          <div className="mb-4">
            <div className="font-semibold mb-1">Rent</div>
            <table className="min-w-full border border-border-color rounded-lg bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase">Description</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-text-muted uppercase">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted uppercase">Total</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rentItems.map(item => (
                  <tr key={item.id} className="border-t border-border-color">
                    <td className="px-4 py-2 text-sm">{item.item_type || item.type}</td>
                    <td className="px-4 py-2 text-sm">{item.description}</td>
                    <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-right text-sm">{(item.unit_price || item.unitPrice)?.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-4 py-2 text-right text-sm">{(item.total)?.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => handleRemoveRentItem(item.id)} className="text-red-500 hover:text-red-700" title="Remove"><span role="img" aria-label="delete">🗑️</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Additional Items Sub-section */}
          <div className="mb-4">
            <div className="font-semibold mb-1">Additional Items</div>
            <table className="min-w-full border border-border-color rounded-lg bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase">Description</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-text-muted uppercase">Previous Reading</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-text-muted uppercase">Current Reading</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-text-muted uppercase">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted uppercase">Total</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {additionalItems.map(item => (
                  <tr key={item.id} className="border-t border-border-color">
                    <td className="px-4 py-2 text-sm">{item.item_type || item.type}</td>
                    <td className="px-4 py-2 text-sm">{item.description}</td>
                    <td className="px-4 py-2 text-center text-sm">{item.item_type === 'electricity' ? (item.previous_reading ?? '') : ''}</td>
                    <td className="px-4 py-2 text-center text-sm">
                      {item.item_type === 'electricity' ? (
                        <input
                          type="number"
                          className="w-20 border rounded p-1 text-right"
                          value={item.current_reading ?? ''}
                          onChange={e => handleChangeElectricityReading(item.id, Number(e.target.value))}
                          min={item.previous_reading || 0}
                        />
                      ) : item.item_type === 'water' ? (
                        <span>-</span>
                      ) : ''}
                    </td>
                    <td className="px-4 py-2 text-center text-sm">
                      {item.item_type === 'water' ? (
                        <input
                          type="number"
                          className="w-20 border rounded p-1 text-right"
                          value={item.quantity ?? ''}
                          onChange={e => handleChangeWaterQuantity(item.id, Number(e.target.value))}
                          min={0}
                        />
                      ) : item.quantity}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">{(item.unit_price || item.unitPrice)?.toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-2 text-right text-sm">{(item.total)?.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => handleRemoveAdditionalItem(item.id)} className="text-red-500 hover:text-red-700" title="Remove"><span role="img" aria-label="delete">🗑️</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Add New Item Section */}
          <div className="mb-6">
            {showAddItem ? (
              <div className="border rounded-lg p-4 bg-white shadow">
                <div className="text-lg font-semibold mb-2">Add New Item</div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select className="w-full border rounded p-2" value={newItemType} onChange={e => setNewItemType(e.target.value)}>
                      <option value="Rent">Rent</option>
                      <option value="Service fee">Service fee</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input className="w-full border rounded p-2" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input type="number" className="w-full border rounded p-2" value={newItemQty} min={1} onChange={e => setNewItemQty(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit Price</label>
                    <input type="number" className="w-full border rounded p-2" value={newItemUnitPrice} min={0} onChange={e => setNewItemUnitPrice(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total</label>
                    <input className="w-full border rounded p-2 bg-gray-100" value={newItemTotal.toLocaleString('vi-VN')} readOnly />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowAddItem(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleAddItem}>Add Item</Button>
                </div>
              </div>
            ) :null}
          </div>
        </div>

        {/* Additional Charges Section */}
        <div className="border-t border-border-color pt-4 mt-4">
          <div className="font-semibold mb-2">Additional Charges</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <div>
              <label className="block text-sm font-medium mb-1">Additional Fees</label>
              <Input type="number" value={additionalFees} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdditionalFees(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discounts</label>
              <Input type="number" value={discounts} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscounts(Number(e.target.value))} />
            </div>
          </div>
        </div>
          {/* Notes Section */}
          <div className="md:col-span-2 mt-4">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea className="w-full border rounded-md p-2 min-h-[48px] text-sm" placeholder="Add any additional notes here..." value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} />
        </div>
      </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 border-t border-border-color pt-4">
          <div className="flex flex-col items-start">
            <div className="text-sm text-text-muted">Subtotal</div>
            <div className="text-lg font-semibold text-text-main">{subtotal.toLocaleString('vi-VN')} ₫</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-base">Total <span className="font-bold text-text-main">{total.toLocaleString('vi-VN')} ₫</span></div>
            <div className="flex flex-row gap-2 mt-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateInvoice} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>

      
    </Modal>
  );
}; 