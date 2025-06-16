import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { NavMain } from "@/components/nav-main";
import { fetchInvoicesFromSupabase, fetchRoomsFromSupabase, fetchTenantsFromSupabase } from "@/data/supabase_data_source";
import type { SupabaseInvoiceRaw, Room, Tenant } from "@/data/types";
import { InvoiceZNSPreview } from "@/components/invoice/invoice-zns-preview";
import { InvoiceInfo } from "@/components/invoice/invoice-info";
import { InvoiceItemsTable } from "@/components/invoice/invoice-items-table";
import { InvoiceNote } from "@/components/invoice/invoice-note";
import { InvoiceSummary } from "@/components/invoice/invoice-summary";
import { TablePro } from "@/components/ui/table-pro";
import { Badge } from "@/components/ui/badge";
import { formatToVND } from "@/utils/currency_utils";
import { formatDateToDDMMYYYY } from "@/utils/date_utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { removeInvoiceFromSupabase, updateInvoiceStatusInSupabase } from "@/data/supabase_data_source";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<SupabaseInvoiceRaw | null>(null);
  const [roomOptions, setRoomOptions] = useState<{ label: string; value: number; room: Room }[]>([]);
  const [tenantOptions, setTenantOptions] = useState<{ label: string; value: string; tenant: Tenant }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<SupabaseInvoiceRaw[]>([]);

  const navItems = [
    { title: "Dashboard", url: "/dashboard" },
    { title: "Rooms", url: "/rooms" },
    { title: "Invoices", url: "/invoices" },
    { title: "Tenants", url: "/tenants" },
    { title: "Expenses", url: "/expenses" },
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [invoices, rooms, tenants] = await Promise.all([
          fetchInvoicesFromSupabase(),
          fetchRoomsFromSupabase(),
          fetchTenantsFromSupabase(),
        ]);
        const found = invoices.find((inv: SupabaseInvoiceRaw) => String(inv.id) === String(id));
        setInvoice(found || null);
        setRoomOptions(
          rooms.map((room: Room) => ({
            label: `${room.building?.name || ''} - ${room.unit_number}`,
            value: room.id,
            room,
          }))
        );
        setTenantOptions(
          tenants.map((tenant: Tenant) => ({
            label: tenant.full_name,
            value: tenant.id,
            tenant,
          }))
        );
        setError(found ? null : "Không tìm thấy hóa đơn!");
        if (location.state && location.state.recentInvoices) {
          setRecentInvoices(location.state.recentInvoices);
        } else {
          const sorted = [...invoices].sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
          setRecentInvoices(sorted.slice(0, 10));
        }
      } catch {
        setError("Lỗi khi tải dữ liệu hóa đơn!");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const columns = [
    { label: "Invoice No.", accessor: "invoice_number" as keyof SupabaseInvoiceRaw },
    { label: "Room", accessor: "apartments" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => `${row.buildings?.name} - ${row.apartments?.unit_number}` },
    { label: "Tenant", accessor: "tenants" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => row.tenants?.full_name },
    { label: "Created", accessor: "issue_date" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => formatDateToDDMMYYYY(row.issue_date) },
    { label: "Amount", accessor: "total" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => formatToVND(row.total) },
    { label: "Status", accessor: "status" as keyof SupabaseInvoiceRaw, render: (row: SupabaseInvoiceRaw) => {
      let color = "";
      let label = row.status;
      switch (row.status) {
        case "paid":
          color = "bg-green-100 text-green-700 border-green-200";
          label = "Paid";
          break;
        case "overdue":
          color = "bg-red-100 text-red-700 border-red-200";
          label = "Overdue";
          break;
        default:
          color = "bg-yellow-50 text-yellow-700 border-yellow-200";
          label = "Unpaid";
      }
      return <Badge className={color + " px-2 py-1 border"}>{label}</Badge>;
    } },
  ];

  const handleViewInvoice = (row: SupabaseInvoiceRaw) => {
    navigate(`/invoice/${row.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="flex flex-row items-center justify-between mb-4">
              <h2 className="scroll-m-20 text-2xl font-bold tracking-tight">Invoice #{invoice?.invoice_number}</h2>
              {invoice && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="ml-2">
                      <IconDotsVertical />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => navigate(`/invoice-edit/${invoice.id}`)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      if (!window.confirm('Are you sure you want to delete this invoice?')) return;
                      try {
                        await removeInvoiceFromSupabase(invoice.id);
                        toast.success('Invoice deleted');
                        navigate('/invoices');
                      } catch (err) {
                        toast.error('Failed to delete invoice', { description: err instanceof Error ? err.message : 'Unknown error' });
                      }
                    }} className="text-red-600">
                      Remove
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={invoice.status === 'paid'} onClick={async () => {
                      if (invoice.status === 'paid') return;
                      try {
                        await updateInvoiceStatusInSupabase(invoice.id, 'paid');
                        toast.success('Invoice marked as paid');
                        navigate('/invoices');
                      } catch (err) {
                        toast.error('Failed to mark as paid', { description: err instanceof Error ? err.message : 'Unknown error' });
                      }
                    }} className={invoice.status === 'paid' ? 'text-gray-400' : 'text-green-600'}>
                      Mark Paid
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {loading ? (
              <div className="p-8 text-center">Đang tải dữ liệu...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : invoice ? (
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 min-w-[340px] max-w-xl overflow-x-auto">
                  <InvoiceDetailView
                    invoice={invoice}
                    roomOptions={roomOptions}
                    tenantOptions={tenantOptions}
                  />
                </div>
                <div className="flex-1 min-w-[340px] max-w-md">
                  <InvoiceZNSPreview
                    customerName={invoice.tenant_id ? (tenantOptions.find(t => t.value === invoice.tenant_id)?.label || "N/a") : "N/a"}
                    contractCode={invoice.invoice_number || "N/a"}
                    roomAddress={(() => {
                      const room = roomOptions.find(r => r.value === invoice.apartment_id)?.room;
                      return room ? `${room.building?.name || ''} - ${room.unit_number}` : "N/a";
                    })()}
                    electricity={invoice.invoice_items.find(i => i.item_type === 'electricity')?.total ?? null}
                    water={invoice.invoice_items.find(i => i.item_type === 'water')?.total ?? null}
                    additionalFee={invoice.additional_fees ?? null}
                    discount={invoice.discounts ?? null}
                    rent={invoice.invoice_items.find(i => i.item_type === 'rent')?.total ?? null}
                    total={invoice.total ?? null}
                    transferContent={(() => {
                      const room = roomOptions.find(r => r.value === invoice.apartment_id)?.room;
                      return room ? `Thanh toan hoa don phong ${room.unit_number}` : "N/a";
                    })()}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div className="border-t border-border-color my-8"></div>
          <div className="mt-8 px-4 lg:px-6">
            <h3 className="text-lg font-semibold mb-4">10 Most Recent Invoices</h3>
            <TablePro
              columns={columns}
              data={recentInvoices}
              rowKey={row => row.id}
              pagination={false}
              selectable={false}
              onRowClick={handleViewInvoice}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface InvoiceDetailViewProps {
  invoice: SupabaseInvoiceRaw;
  roomOptions?: { label: string; value: number; room: Room }[];
  tenantOptions?: { label: string; value: string; tenant: Tenant }[];
}

export function InvoiceDetailView({
  invoice,
  roomOptions = [],
  tenantOptions = [],
}: InvoiceDetailViewProps) {
  if (!invoice) return null;
  const apartmentLabel = invoice.apartment_id ? roomOptions.find((r) => r.value === invoice.apartment_id)?.label || '' : '';
  const tenantLabel = invoice.tenant_id ? tenantOptions.find((t) => t.value === invoice.tenant_id)?.label || '' : '';
  return (
    <div className="relative w-full" id="invoice-detail-print-area">
      <div className="flex flex-col gap-8 py-2">
        <div className="w-full max-w-2xl">
          <InvoiceInfo
            apartmentLabel={apartmentLabel}
            tenantLabel={tenantLabel}
            invoiceNumber={invoice.invoice_number}
            issueDate={invoice.issue_date}
            dueDate={invoice.due_date}
          />
        </div>
        <div className="w-full max-w-2xl">
          <InvoiceItemsTable items={invoice.invoice_items} />
          <InvoiceNote note={invoice.notes} />
          <InvoiceSummary
            subtotal={Number(invoice.subtotal) || 0}
            additionalFees={Number(invoice.additional_fees) || 0}
            discount={Number(invoice.discounts) || 0}
            total={Number(invoice.total) || 0}
          />
        </div>
      </div>
    </div>
  );
} 