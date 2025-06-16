import React from "react";

interface InvoiceSummaryProps {
  subtotal: number;
  additionalFees?: number;
  discount?: number;
  total: number;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  subtotal,
  additionalFees = 0,
  discount = 0,
  total,
}) => (
  <div className="flex flex-col items-end gap-1 mt-6" style={{ maxWidth: 300, marginLeft: 'auto' }}>
    <div className="flex w-full justify-between text-base">
      <span className="text-muted-foreground">Subtotal</span>
      <span className="font-medium">{subtotal.toLocaleString('vi-VN')}</span>
    </div>
    <div className="flex w-full justify-between text-base">
      <span className="text-muted-foreground">Additional Fees</span>
      <span className="font-medium">{additionalFees?.toLocaleString('vi-VN')}</span>
    </div>
    <div className="flex w-full justify-between text-base">
      <span className="text-muted-foreground">Discount</span>
      <span className="font-medium">{discount?.toLocaleString('vi-VN')}</span>
    </div>
    <div className="flex w-full justify-between text-lg font-bold mt-2">
      <span>Total</span>
      <span>{total.toLocaleString('vi-VN')}</span>
    </div>
  </div>
); 