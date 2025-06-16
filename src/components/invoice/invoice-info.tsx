import React from "react";

interface InvoiceInfoProps {
  apartmentLabel: string;
  tenantLabel: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
}

export const InvoiceInfo: React.FC<InvoiceInfoProps> = ({
  apartmentLabel,
  tenantLabel,
  invoiceNumber,
  issueDate,
  dueDate,
}) => (
  <div className="space-y-3 mb-4">
    <div>
      <label className="block text-sm font-medium mb-1">Apartment</label>
      <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">
        {apartmentLabel}
      </div>
    </div>
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Tenant</label>
        <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">
          {tenantLabel}
        </div>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Invoice Number</label>
        <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{invoiceNumber}</div>
      </div>
    </div>
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Issue Date</label>
        <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{issueDate}</div>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Due Date</label>
        <div className="h-9 flex items-center px-3 bg-muted rounded border border-input text-base">{dueDate}</div>
      </div>
    </div>
  </div>
); 