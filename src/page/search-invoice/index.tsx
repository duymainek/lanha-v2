import React, { useState } from "react";
import { Navbar } from "@/page/landing/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getInvoiceDetailByNumber, fetchRoomsFromSupabase, fetchTenantsFromSupabase } from "@/data/supabase_data_source";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InvoiceDetailView } from "@/app/page/invoice-detail";

export default function SearchInvoicePage() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState("");
  const [roomOptions, setRoomOptions] = useState<any[]>([]);
  const [tenantOptions, setTenantOptions] = useState<any[]>([]);

  React.useEffect(() => {
    if (invoice) {
      fetchRoomsFromSupabase().then((rooms) => {
        setRoomOptions(
          rooms.map((r: any) => ({ value: r.id, label: `${r.building?.name || ''} - ${r.unit_number}`, room: r }))
        );
      });
      fetchTenantsFromSupabase().then((tenants) => {
        setTenantOptions(
          tenants.map((t: any) => ({ value: t.id, label: t.full_name, tenant: t }))
        );
      });
    }
  }, [invoice]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInvoice(null);
    setLoading(true);
    try {
      const result = await getInvoiceDetailByNumber(invoiceNumber.trim());
      if (!result) {
        setError("Không tìm thấy hóa đơn với số này.");
      } else {
        setInvoice(result);
      }
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative" style={{ backgroundImage: `url('https://zlwuqqwemjiaxztgsfkd.supabase.co/storage/v1/object/public/website-images/banner_1_uyzydqcdf2.jpeg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="relative z-10">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-2 py-8">
          {/* Tiêu đề lớn */}
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white drop-shadow-lg text-center">Tra cứu hóa đơn</h2>
          <form
            onSubmit={handleSearch}
            className="bg-white/90 rounded-xl shadow-lg p-4 md:p-8 flex flex-col items-center gap-4 w-full max-w-md"
            style={{ backdropFilter: 'blur(2px)' }}
          >
            <div className="flex w-full gap-2 items-center">
              <Input
                placeholder="Nhập số hóa đơn..."
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="flex-1 min-w-0"
                required
                inputMode="text"
                autoComplete="off"
                style={{ fontSize: 16 }}
              />
              <Button
                type="submit"
                size="icon"
                variant="secondary"
                className="shrink-0"
                disabled={loading}
                aria-label="Tìm kiếm hóa đơn"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                ) : (
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
                )}
              </Button>
            </div>
            {error && <div className="text-red-500 text-sm mt-1 w-full text-center">{error}</div>}
          </form>

          {/* Hiển thị kết quả trực tiếp dưới form */}
          {invoice && (
            <div className="w-full max-w-3xl mt-6 bg-white/95 rounded-xl shadow-lg p-2 md:p-6 overflow-x-auto">
              <InvoiceDetailView
                invoice={invoice}
                roomOptions={roomOptions}
                tenantOptions={tenantOptions}
                showCloseButton={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 