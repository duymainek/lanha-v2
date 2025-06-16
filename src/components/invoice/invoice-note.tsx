import React from "react";

interface InvoiceNoteProps {
  note?: string | null;
}

export const InvoiceNote: React.FC<InvoiceNoteProps> = ({ note }) => (
  <div className="mb-2">
    <label className="block text-sm font-medium mb-1">Note</label>
    <div className="w-full border rounded-md p-2 min-h-[48px] text-sm bg-muted">{note || ''}</div>
  </div>
); 