import React from "react";
import { Card } from "@/components/ui/card";

interface InvoiceZNSPreviewProps {
  customerName?: string;
  contractCode?: string;
  roomAddress?: string;
  electricity?: number | null;
  water?: number | null;
  additionalFee?: number | null;
  discount?: number | null;
  rent?: number | null;
  total?: number | null;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  transferContent?: string;
}

function formatNumber(n: number | null | undefined) {
  if (n === null || n === undefined || isNaN(n)) return "N/a";
  return n.toLocaleString("vi-VN");
}

export const InvoiceZNSPreview: React.FC<InvoiceZNSPreviewProps> = ({
  customerName = "N/a",
  contractCode = "N/a",
  roomAddress = "N/a",
  electricity = null,
  water = null,
  additionalFee = null,
  discount = null,
  rent = null,
  total = null,
  bankName = "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)",
  accountName = "MAI DUC DUY",
  accountNumber = "9602091996",
  transferContent = "N/a",
}) => {
  return (
    <Card className="rounded-xl bg-muted p-6 max-w-md mx-auto shadow border border-border-color">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-xl text-primary">Là Nhà</span>
      </div>
      <div className="mb-3">
        <div className="font-semibold text-base mb-1">Thông tin thanh toán</div>
        <div className="text-sm text-muted-foreground mb-2">
          Kính gửi <span className="font-semibold text-foreground">{customerName}</span>, Chúng tôi xin thông báo rằng hóa đơn mới đã được tạo cho căn hộ của bạn tại {roomAddress}.
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Quý khách</span><span className="font-medium">{customerName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Mã hợp đồng</span><span className="font-medium">{contractCode}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tiền điện</span><span className="font-medium">{formatNumber(electricity)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tiền nước</span><span className="font-medium">{formatNumber(water)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Phí phát sinh</span><span className="font-medium">{formatNumber(additionalFee)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Giảm trừ</span><span className="font-medium">{formatNumber(discount)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tiền phòng</span><span className="font-medium">{formatNumber(rent)}</span></div>
          <div className="flex justify-between text-base font-bold mt-2"><span className="text-foreground">Tổng cộng</span><span className="text-primary">{formatNumber(total)}</span></div>
        </div>
      </div>
      <div className="rounded-lg border bg-background p-3 mt-4">
        <div className="text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Ngân hàng</span><span className="font-medium text-right">{bankName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Chủ tài khoản</span><span className="font-medium text-right">{accountName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Số tài khoản</span><span className="font-medium text-right">{accountNumber}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Số tiền (VND)</span><span className="font-medium text-right">{formatNumber(total)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Nội dung</span><span className="font-medium text-right">{transferContent}</span></div>
        </div>
      </div>
    </Card>
  );
}; 