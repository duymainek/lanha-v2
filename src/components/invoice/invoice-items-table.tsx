import React from "react";
import type { InvoiceItem } from "@/data/types";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({ items }) => (
  <div className="mb-4">
    <div className="font-semibold mb-1">Invoice Items</div>
    <table className="min-w-full border border-border-color rounded-lg bg-white">
      <thead className="bg-slate-50">
        <tr>
          <th className="px-2 py-2 text-xs font-semibold uppercase text-center">Type</th>
          <th className="px-2 py-2 text-xs font-semibold uppercase text-center">Description</th>
          <th className="px-2 py-2 text-xs font-semibold uppercase text-center">Prev</th>
          <th className="px-2 py-2 text-xs font-semibold uppercase text-center">Current</th>
          <th className="px-2 py-2 text-xs font-semibold uppercase text-center">Quantity</th>
          <th className="px-2 py-2 text-xs font-semibold uppercase text-center">Unit Price</th>
          <th className="px-2 py-2 text-xs font-semibold uppercase text-center">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr key={idx} className="border-t border-border-color">
            <td className="px-2 py-2 text-sm text-center">{item.item_type}</td>
            <td className="px-2 py-2 text-sm text-center">{item.description}</td>
            <td className="px-2 py-2 text-sm text-center">{item.item_type === 'electricity' ? item.previous_reading ?? '' : ''}</td>
            <td className="px-2 py-2 text-sm text-center">{item.item_type === 'electricity' ? item.current_reading ?? '' : ''}</td>
            <td className="px-2 py-2 text-sm text-center">{item.quantity}</td>
            <td className="px-2 py-2 text-sm text-center">{item.unit_price?.toLocaleString('vi-VN')}</td>
            <td className="px-2 py-2 text-sm text-center font-semibold">{item.total?.toLocaleString('vi-VN')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
); 