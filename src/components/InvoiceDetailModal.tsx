import React from 'react';
import { SupabaseInvoiceRaw } from '../data/types';
import { Modal } from './Modal';
import { Button } from './Button';
import { PencilIcon } from './icons';

export interface InvoiceDetailModalProps {
  invoice: SupabaseInvoiceRaw | null;
  onClose?: () => void;
  onEdit?: (invoice: SupabaseInvoiceRaw) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = (props: InvoiceDetailModalProps) => {
  const { invoice, onClose, onEdit } = props;
  if (!invoice) return null;
  const buildingName = (invoice.apartments as any)?.buildings?.name || '';
  const roomNumber = invoice.apartments?.unit_number || '';
  const subtotal = invoice.invoice_items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
  const total = invoice.total || subtotal;

  return (
    <Modal isOpen={!!invoice} onClose={onClose} title="Invoice Details" className="max-w-full w-[95vw] min-h-[40vh] md:min-h-[50vh]">
      <div className="bg-card-bg rounded-xl p-8 space-y-4 h-full flex flex-col">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div>
            <div className="text-2xl font-bold text-text-main mb-1">{buildingName} - {roomNumber}</div>
            <div className="text-sm text-text-muted">Invoice #{invoice.invoice_number}</div>
            <div className="text-sm mt-2 font-medium">Tenant: <span className="font-normal">{invoice.tenants?.full_name || ''}</span></div>
            <div className="text-sm text-text-muted">Phone: {invoice.tenants?.phone || ''}</div>
          </div>
          <div className="flex flex-col gap-1 text-right min-w-[180px]">
            <div>Status: <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : invoice.status === 'unpaid' ? 'bg-yellow-100 text-yellow-700' : invoice.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span></div>
            <div className="text-sm">Issued: {invoice.issue_date}</div>
            <div className="text-sm">Due: {invoice.due_date}</div>
          </div>
        </div>
        <div className="flex-1">
          <table className="min-w-full border border-border-color rounded-lg bg-card-bg">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Previous Reading</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Current Reading</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items?.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="border-t border-border-color hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-3 text-text-main text-sm">{item.item_type}</td>
                  <td className="px-4 py-3 text-text-main text-sm">{item.description}</td>
                  <td className="px-4 py-3 text-center text-text-main text-sm">{item.previous_reading ?? ''}</td>
                  <td className="px-4 py-3 text-center text-text-main text-sm">{item.current_reading ?? ''}</td>
                  <td className="px-4 py-3 text-center text-text-main text-sm">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-text-main text-sm">{item.unit_price?.toLocaleString('vi-VN')} ₫</td>
                  <td className="px-4 py-3 text-right text-text-main text-sm">{item.total?.toLocaleString('vi-VN')} ₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-row justify-end gap-8 mt-4">
          <div className="text-right min-w-[320px]">
            <div className="flex justify-between items-center text-base mt-2">
              <span className="text-text-muted">Subtotal:</span>
              <span className="ml-4">{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between items-center text-base mt-2">
              <span className="text-text-muted">Additional Fees:</span>
              <span className="ml-4">{(invoice.additional_fees || 0).toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between items-center text-base mt-2">
              <span className="text-text-muted">Discounts:</span>
              <span className="ml-4">{invoice.discounts ? `- ${Math.abs(invoice.discounts).toLocaleString('vi-VN')}` : '0'} ₫</span>
            </div>
            <hr className="my-2 border-border-color" />
            <div className="flex justify-between items-center text-lg font-bold mt-2">
              <span className="text-text-main">Total Due:</span>
              <span className="text-text-main">{total.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-2 justify-end mt-6">
          {onClose && <Button variant="secondary" onClick={onClose}>Close</Button>}
          {onEdit && <Button variant="primary" onClick={() => onEdit(invoice)}><PencilIcon className="h-4 w-4 mr-2" /> Edit</Button>}
        </div>
      </div>
    </Modal>
  );
}; 