import React, { useState, useEffect } from 'react';
import { Tenant } from '../data/types';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Avatar } from '../components/Avatar';
import { PencilIcon } from '../components/icons';

export interface TenantDetailModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tenant: Tenant) => void;
}

export const TenantDetailModal: React.FC<TenantDetailModalProps> = (props: TenantDetailModalProps) => {
  const { tenant, isOpen, onClose, onEdit } = props;
  if (!tenant) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tenant Details">
      <div className="space-y-2">
        <div className="flex items-center gap-4 mb-4">
          <Avatar src={tenant.id_card_front_url || ''} name={tenant.full_name} size="lg" />
          <div>
            <div className="font-bold text-lg">{tenant.full_name}</div>
            <div className="text-sm text-text-muted">ID: {tenant.id}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <div><b>Email:</b> {tenant.email || '-'}</div>
          <div><b>Phone:</b> {tenant.phone || '-'}</div>
          <div><b>ID Number:</b> {tenant.id_number || '-'}</div>
          <div><b>Nationality:</b> {tenant.nationality || '-'}</div>
          <div><b>Move In:</b> {tenant.move_in_date || '-'}</div>
          <div><b>Move Out:</b> {tenant.move_out_date || '-'}</div>
          <div><b>Is Primary:</b> {tenant.is_primary ? 'Yes' : 'No'}</div>
          <div><b>Tenant Type:</b> {tenant.tenant_type || '-'}</div>
          <div><b>Building:</b> {tenant.building?.name || '-'}</div>
          <div><b>Room:</b> {tenant.apartment?.unit_number || '-'}</div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div>
            <b>ID Card Front:</b><br />
            {tenant.id_card_front_url ? <img src={tenant.id_card_front_url} alt="ID Card Front" className="max-w-xs rounded border" /> : '-'}
          </div>
          <div>
            <b>ID Card Back:</b><br />
            {tenant.id_card_back_url ? <img src={tenant.id_card_back_url} alt="ID Card Back" className="max-w-xs rounded border" /> : '-'}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => { onClose(); onEdit(tenant); }}><PencilIcon className="h-4 w-4 mr-2" />Edit</Button>
        </div>
      </div>
    </Modal>
  );
};

export interface TenantEditModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Tenant>) => void;
}

export const TenantEditModal: React.FC<TenantEditModalProps> = (props: TenantEditModalProps) => {
  const { tenant, isOpen, onClose, onSave } = props;
  const [formData, setFormData] = useState<Partial<Tenant>>(tenant || {});
  useEffect(() => { setFormData(tenant || {}); }, [tenant]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    let processedValue: any = value;
    if (type === 'number') processedValue = parseFloat(value) || 0;
    if (type === 'checkbox') processedValue = checked;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tenant ? 'Edit Tenant' : 'Add Tenant'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Input id="full_name" name="full_name" label="Full Name" type="text" value={formData.full_name || ''} onChange={handleInputChange} required />
            <Input id="email" name="email" label="Email" type="email" value={formData.email || ''} onChange={handleInputChange} />
            <Input id="phone" name="phone" label="Phone" type="tel" value={formData.phone || ''} onChange={handleInputChange} />
            <Input id="id_number" name="id_number" label="ID Number" type="text" value={formData.id_number || ''} onChange={handleInputChange} />
            <Input id="nationality" name="nationality" label="Nationality" type="text" value={formData.nationality || ''} onChange={handleInputChange} />
            <div className="flex items-center gap-2 mt-2">
              <input id="is_primary" name="is_primary" type="checkbox" checked={!!formData.is_primary} onChange={handleInputChange} />
              <label htmlFor="is_primary" className="text-sm">Is Primary Tenant</label>
            </div>
          </div>
          <div className="space-y-4">
            <Input id="move_in_date" name="move_in_date" label="Lease Start Date" type="date" value={formData.move_in_date || ''} onChange={handleInputChange} />
            <Input id="move_out_date" name="move_out_date" label="Lease End Date" type="date" value={formData.move_out_date || ''} onChange={handleInputChange} />
            <Input id="id_card_front_url" name="id_card_front_url" label="ID Card Front URL" type="text" value={formData.id_card_front_url || ''} onChange={handleInputChange} />
            <Input id="id_card_back_url" name="id_card_back_url" label="ID Card Back URL" type="text" value={formData.id_card_back_url || ''} onChange={handleInputChange} />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text-main mb-1">Notes</label>
          <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="block w-full border border-border-color rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
        </div>
        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export interface TenantAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Tenant>) => void;
  isLoading?: boolean;
}

export const TenantAddModal: React.FC<TenantAddModalProps> = (props: TenantAddModalProps) => {
  const { isOpen, onClose, onSave, isLoading } = props;
  // Helper lấy ngày hôm nay yyyy-mm-dd
  const getToday = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };
  // Helper cộng 12 tháng
  const add12Months = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 12);
    return d.toISOString().slice(0, 10);
  };
  const [formData, setFormData] = useState<Partial<Tenant>>({
    move_in_date: getToday(),
    move_out_date: add12Months(getToday()),
  });
  // Khi mở modal lại, reset default
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        move_in_date: getToday(),
        move_out_date: add12Months(getToday()),
      });
    }
  }, [isOpen]);
  // Khi user đổi move_in_date, tự update move_out_date nếu chưa bị chỉnh tay
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    let processedValue: any = value;
    if (type === 'number') processedValue = parseFloat(value) || 0;
    if (type === 'checkbox') processedValue = checked;
    setFormData(prev => {
      if (name === 'move_in_date') {
        // Nếu move_out_date chưa bị chỉnh tay hoặc đang là cũ, tự update
        const newMoveOut = add12Months(processedValue);
        return {
          ...prev,
          move_in_date: processedValue,
          move_out_date: (!prev.move_out_date || prev.move_out_date === add12Months(prev.move_in_date || getToday())) ? newMoveOut : prev.move_out_date,
        };
      }
      return { ...prev, [name]: processedValue };
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Tenant">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Input id="full_name" name="full_name" label="Full Name" type="text" value={formData.full_name || ''} onChange={handleInputChange} required />
            <Input id="email" name="email" label="Email" type="email" value={formData.email || ''} onChange={handleInputChange} />
            <Input id="phone" name="phone" label="Phone" type="tel" value={formData.phone || ''} onChange={handleInputChange} />
            <Input id="id_number" name="id_number" label="ID Number" type="text" value={formData.id_number || ''} onChange={handleInputChange} />
            <Input id="nationality" name="nationality" label="Nationality" type="text" value={formData.nationality || ''} onChange={handleInputChange} />
            <div className="flex items-center gap-2 mt-2">
              <input id="is_primary" name="is_primary" type="checkbox" checked={!!formData.is_primary} onChange={handleInputChange} />
              <label htmlFor="is_primary" className="text-sm">Is Primary Tenant</label>
            </div>
          </div>
          <div className="space-y-4">
            <Input id="move_in_date" name="move_in_date" label="Lease Start Date" type="date" value={formData.move_in_date || ''} onChange={handleInputChange} />
            <Input id="move_out_date" name="move_out_date" label="Lease End Date" type="date" value={formData.move_out_date || ''} onChange={handleInputChange} />
            <Input id="id_card_front_url" name="id_card_front_url" label="ID Card Front URL" type="text" value={formData.id_card_front_url || ''} onChange={handleInputChange} />
            <Input id="id_card_back_url" name="id_card_back_url" label="ID Card Back URL" type="text" value={formData.id_card_back_url || ''} onChange={handleInputChange} />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text-main mb-1">Notes</label>
          <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="block w-full border border-border-color rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
        </div>
        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>Add Tenant</Button>
        </div>
      </form>
    </Modal>
  );
}; 