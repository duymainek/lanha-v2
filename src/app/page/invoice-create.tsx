import React, { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { InvoiceZNSPreview } from "@/components/invoice/invoice-zns-preview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NavMain } from "@/components/nav-main";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { fetchRoomsFromSupabase, fetchTenantsFromSupabase, fetchUtilityReadingsByApartment, addInvoiceToSupabase } from "@/data/supabase_data_source";
import { toast } from "sonner";
import type { Room, Tenant, InvoiceItem } from "@/data/types";
import {  IconPlus, IconX } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom"

interface RoomOption {
  label: string;
  value: number;
  room: Room;
}
interface TenantOption {
  label: string;
  value: string;
  tenant: Tenant;
}

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    apartment_id: null as number | null,
    tenant_id: null as string | null,
    invoice_number: "",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [] as InvoiceItem[],
    additional_fees: 0,
    discount: 0,
    rent: 0,
    total: 0,
    transferContent: "",
    note: "" as string | null,
  });

  // Fetch room & tenant options
  useEffect(() => {
    Promise.all([
      fetchRoomsFromSupabase(),
      fetchTenantsFromSupabase()
    ]).then(([rooms, tenants]) => {
      setRoomOptions(rooms.map((room: Room) => ({
        label: `${room.building?.name || ''} - ${room.unit_number}`,
        value: room.id,
        room,
      })));
      setTenantOptions(tenants.map((tenant: Tenant) => ({
        label: tenant.full_name,
        value: tenant.id,
        tenant,
      })));
    });
  }, []);

  // When room is selected, autofill primary tenant and default items
  const handleApartmentChange = async (apartmentId: number) => {
    const room = roomOptions.find((r) => r.value === apartmentId)?.room;
    let tenantId: string | null = null;
    if (room && tenantOptions && Array.isArray(tenantOptions)) {
      const primaryTenant = tenantOptions.find(
        (t) => t.tenant?.apartment_id === room.id && t.tenant?.is_primary
      );
      tenantId = primaryTenant ? primaryTenant.value : null;
    }
    try {
      const utilityReadings = await fetchUtilityReadingsByApartment(apartmentId);
      const defaultItems: InvoiceItem[] = [
        {
          id: 0,
          invoice_id: 0,
          item_type: "rent",
          description: "Rent",
          quantity: 1,
          unit_price: room?.price || 0,
          total: room?.price || 0,
        },
        {
          id: 0,
          invoice_id: 0,
          item_type: "electricity",
          description: "Electricity",
          quantity: 0,
          unit_price: room?.electricity_price || 0,
          total: 0,
          previous_reading: utilityReadings.electricity?.reading_value ?? 0,
          current_reading: utilityReadings.electricity?.reading_value ?? 0,
        },
        {
          id: 0,
          invoice_id: 0,
          item_type: "water",
          description: "Water",
          quantity: Number(utilityReadings.water?.reading_value ?? 1),
          unit_price: room?.water_price || 0,
          total: (utilityReadings.water?.reading_value || 1) * (room?.water_price || 80000),
        },
      ];
      const subtotal = defaultItems.reduce((sum, i) => sum + (i.total || 0), 0);
      setForm(f => ({
        ...f,
        apartment_id: apartmentId,
        tenant_id: tenantId,
        invoice_number: genInvoiceNumber(room, f.issue_date),
        items: defaultItems,
        rent: defaultItems[0].total,
        total: subtotal + (f.additional_fees || 0) - (f.discount || 0),
        transferContent: room ? `Payment for room ${room.unit_number}` : "",
      }));
    } catch (err) {
      // ignore
    }
  };

  // Helper: generate invoice number
  function genInvoiceNumber(room: Room | undefined, issueDate: string): string {
    if (!room || !issueDate) return '';
    const month = String(new Date(issueDate).getMonth() + 1).padStart(2, '0');
    const year = String(new Date(issueDate).getFullYear()).slice(-2);
    return `INV-${month}-${year}-${room.building_id}-${room.id}-${Math.floor(Math.random() * 1000)}`;
  }

  // Map data for preview
  const previewData = {
    customerName: form.tenant_id ? (tenantOptions.find(t => t.value === form.tenant_id)?.label || "N/a") : "N/a",
    contractCode: form.invoice_number || "N/a",
    roomAddress: (() => {
      const room = roomOptions.find(r => r.value === form.apartment_id)?.room;
      return room ? `${room.building?.name || ''} - ${room.unit_number}` : "N/a";
    })(),
    electricity: ((): number | undefined => {
      const v = form.items.find((i) => i.item_type === 'electricity')?.total;
      return v !== null && typeof v === 'number' ? v : undefined;
    })(),
    water: ((): number | undefined => {
      const v = form.items.find((i) => i.item_type === 'water')?.total;
      return v !== null && typeof v === 'number' ? v : undefined;
    })(),
    additionalFee: form.additional_fees !== null && typeof form.additional_fees === 'number' ? form.additional_fees : undefined,
    discount: form.discount !== null && typeof form.discount === 'number' ? form.discount : undefined,
    rent: ((): number | undefined => {
      const v = form.items.find((i) => i.item_type === 'rent')?.total;
      return v !== null && typeof v === 'number' ? v : undefined;
    })(),
    total: form.total !== null && typeof form.total === 'number' ? form.total : undefined,
    transferContent: form.transferContent || "N/a",
  };

  // Navigation items
  const navItems = [
    { title: "Dashboard", url: "/dashboard" },
    { title: "Rooms", url: "/rooms" },
    { title: "Invoices", url: "/invoices" },
    { title: "Tenants", url: "/tenants" },
    { title: "Expenses", url: "/expenses" },
  ];

  // Save invoice
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addInvoiceToSupabase({
        apartment_id: form.apartment_id ?? undefined,
        tenant_id: form.tenant_id,
        invoice_number: form.invoice_number,
        issue_date: form.issue_date,
        due_date: form.due_date,
        total: form.total,
        invoice_items: form.items,
        additional_fees: form.additional_fees,
        discounts: form.discount,
      });
      toast.success("Invoice created successfully!");
      navigate("/invoices");
    } catch (err: unknown) {
      toast.error("Failed to create invoice", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleItemChange = (idx: number, key: keyof InvoiceItem, value: number) => {
    setForm(f => {
      const items = [...f.items];
      const item = { ...items[idx] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item as any)[key] = value;
      // Logic tính lại quantity và total
      if (item.item_type === 'electricity') {
        if (key === 'current_reading' || key === 'previous_reading') {
          const prev = Number(item.previous_reading) || 0;
          const curr = Number(item.current_reading) || 0;
          item.quantity = curr - prev;
          item.total = item.quantity * (item.unit_price || 0);
        }
        if (key === 'unit_price') {
          item.total = (item.quantity || 0) * (item.unit_price || 0);
        }
      } else if (item.item_type === 'water') {
        if (key === 'quantity' || key === 'unit_price') {
          item.total = (item.quantity || 0) * (item.unit_price || 0);
        }
      } else {
        if (key === 'quantity' || key === 'unit_price') {
          item.total = (item.quantity || 0) * (item.unit_price || 0);
        }
      }
      items[idx] = item;
      // Tính lại tổng
      const subtotal = items.reduce((sum, i) => sum + (i.total || 0), 0);
      const total = subtotal + (f.additional_fees || 0) - (f.discount || 0);
      return { ...f, items, total, rent: items[0]?.total || 0 };
    });
  };

  const handleAdditionalFeesChange = (value: number) => {
    setForm(f => ({
      ...f,
      additional_fees: value,
      total: f.items.reduce((sum, i) => sum + (i.total || 0), 0) + value - (f.discount || 0),
    }));
  };

  const handleDiscountChange = (value: number) => {
    setForm(f => ({
      ...f,
      discount: value,
      total: f.items.reduce((sum, i) => sum + (i.total || 0), 0) + (f.additional_fees || 0) - value,
    }));
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset">
        <NavMain items={navItems} />
      </AppSidebar>
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 py-4 px-4 lg:px-6">
            <h2 className="scroll-m-20 text-2xl font-bold tracking-tight mb-4">Create Invoice</h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 min-w-[340px] max-w-2xl">
                <div className="mb-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Apartment</label>
                      <Select value={form.apartment_id ? String(form.apartment_id) : ""} onValueChange={v => handleApartmentChange(Number(v))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomOptions.map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Tenant</label>
                        <Input value={previewData.customerName} readOnly />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Invoice Number</label>
                        <Input value={form.invoice_number} readOnly />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Issue Date</label>
                        <Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                      </div>
                    </div>
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
                          {form.items.map((item, idx) => (
                            <tr key={idx} className="border-t border-border-color">
                              <td className="px-2 py-2 text-sm text-center">{item.item_type}</td>
                              <td className="px-2 py-2 text-sm text-center">{item.description}</td>
                              <td className="px-2 py-2 text-sm text-center">
                                {item.item_type === 'electricity' ? (
                                  <Input type="number" value={item.previous_reading ?? ''} min={0}
                                    onChange={e => handleItemChange(idx, 'previous_reading', Number(e.target.value))}
                                    className="h-7 text-xs w-20 mx-auto text-center" />
                                ) : ''}
                              </td>
                              <td className="px-2 py-2 text-sm text-center">
                                {item.item_type === 'electricity' ? (
                                  <Input type="number" value={item.current_reading ?? ''} min={0}
                                    onChange={e => handleItemChange(idx, 'current_reading', Number(e.target.value))}
                                    className="h-7 text-xs w-20 mx-auto text-center" />
                                ) : ''}
                              </td>
                              <td className="px-2 py-2 text-sm text-center">
                                {item.item_type === 'water' ? (
                                  <Input type="number" value={item.quantity} min={0}
                                    onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                    className="h-7 text-xs w-20 mx-auto text-center" />
                                ) : item.quantity}
                              </td>
                              <td className="px-2 py-2 text-sm text-center">{item.unit_price?.toLocaleString('vi-VN')}</td>
                              <td className="px-2 py-2 text-sm text-center font-semibold">{item.total?.toLocaleString('vi-VN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Additional Fees</label>
                        <Input type="number" value={form.additional_fees ?? 0} min={0}
                          onChange={e => handleAdditionalFeesChange(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Discount</label>
                        <Input type="number" value={form.discount ?? 0} min={0}
                          onChange={e => handleDiscountChange(Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium mb-1">Note</label>
                      <textarea
                        className="w-full border rounded-md p-2 min-h-[48px] text-sm"
                        placeholder="Add any additional notes here..."
                        value={form.note ?? ''}
                        onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col items-end gap-1 mt-6" style={{ maxWidth: 300, marginLeft: 'auto' }}>
                      <div className="flex w-full justify-between text-base">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{form.items.reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="flex w-full justify-between text-base">
                        <span className="text-muted-foreground">Additional Fees</span>
                        <span className="font-medium">{form.additional_fees?.toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="flex w-full justify-between text-base">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium">{(form.discount || 0).toLocaleString('vi-VN')}</span>
                      </div>
                      
                      <div className="flex w-full justify-between text-lg font-bold mt-2">
                        <span>Total</span>
                        <span>{(form.items.reduce((sum, i) => sum + (i.total || 0), 0) + (form.additional_fees || 0) - (form.discount || 0)).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="border-t border-border my-4" />
                    <div className="flex flex-row gap-2 mt-4 justify-between">
                      <Button type="button" variant="outline" onClick={() => navigate("/invoices")}>
                        <IconX className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleSave} disabled={isSaving}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Cột phải: Preview Zalo ZNS */}
              <div className="flex-1 min-w-[340px] max-w-md">
                <InvoiceZNSPreview {...previewData} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 