import { supabase } from '../supabaseClient';
import type { Room, SupabaseBuilding, SupabaseInvoiceRaw, UtilityReading, SupabaseTenant, Tenant, BuildingExpense, NotificationQueueItem, RoomDetailData } from './types';
import { SupabaseCacheService } from '@/services/SupabaseCacheService';

/**
 * Fetch all rooms (apartments) from Supabase and map to Room object
 * @returns {Promise<Room[]>}
 */
export async function fetchRoomsFromSupabase(): Promise<Room[]> {
  return SupabaseCacheService.get('rooms', async () => {
    const { data: apartments, error } = await supabase
      .from('apartments')
      .select('*,building:building_id (id, name, address)').order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return apartments as Room[];
  });
}

/**
 * Fetch all buildings from Supabase and map to Building object
 * @returns {Promise<Building[]>}
 */
export async function fetchBuildingsFromSupabase(): Promise<SupabaseBuilding[]> {
  return SupabaseCacheService.get('buildings', async () => {
    const { data: supaBuildings, error } = await supabase
      .from('buildings')
      .select('*');
    if (error) throw new Error(error.message);
    return supaBuildings as SupabaseBuilding[];
  });
}

/**
 * Update a building in Supabase and return the updated Building object
 * @param {string} id - Building ID
 * @param {{ name: string; address: string; notes?: string }} data - Update payload
 * @returns {Promise<SupabaseBuilding>}
 */
export async function updateBuildingInSupabase(id: number, data: { name: string; address: string; notes?: string }): Promise<SupabaseBuilding> {
  const updatePayload: any = {
    name: data.name,
    address: data.address,
    description: data.notes || null,
  };
  const { data: updatedRows, error } = await supabase
    .from('buildings')
    .update(updatePayload)
    .eq('id', id)
    .select();
  if (error) throw new Error(error.message);
  if (!updatedRows || updatedRows.length === 0) throw new Error('Not found or not updated');
  const supaBuilding = updatedRows[0];
  SupabaseCacheService.clear('buildings');
  return supaBuilding;
}

/**
 * Update a room (apartment) in Supabase and return the updated Room object
 * @param {string} id - Room (apartment) ID
 * @param {Partial<Room>} data - Update payload
 * @returns {Promise<Room>}
 */
export async function updateRoomInSupabase(id: number, data: Partial<Room>): Promise<Room> {
  const updatePayload = { ...data };
  if ('building' in updatePayload) {
    delete updatePayload.building;
  }
  if ('building_id' in updatePayload) {
    delete updatePayload.building_id;
  }
  console.log(updatePayload)
  const { data: updatedRows, error } = await supabase
    .from('apartments')
    .update(updatePayload)
    .eq('id', id)
    .select();
  if (error) throw new Error(error.message);
  if (!updatedRows || updatedRows.length === 0) throw new Error('Not found or not updated');
  const apt = updatedRows[0];
  SupabaseCacheService.clear('rooms');
  return apt;
}

/**
 * Fetch all invoices from Supabase and map to Invoice object
 * @returns {Promise<Invoice[]>}
 */
export async function fetchInvoicesFromSupabase(): Promise<SupabaseInvoiceRaw[]> {
  return SupabaseCacheService.get('invoices', async () => {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        tenants:tenant_id (id, apartment_id, full_name, email, phone, nationality, id_number, move_in_date, move_out_date, is_primary, tenant_type, created_at),
        invoice_items!fk_invoice_items_invoice_id (id, invoice_id, item_type, description, quantity, unit_price, total, previous_reading, current_reading, discount, created_at),
        apartments:apartment_id (
          id, unit_number, building_id, area, price,
          buildings:building_id (id, name, address)
        )
      `)
      .order('id', { ascending: false });
    if (error) throw new Error(error.message);
    // Map tenants về object hoặc null, giữ nguyên id là số
    const mapped = (invoices || []).map((inv: any) => ({
      ...inv,
      tenants: Array.isArray(inv.tenants) ? (inv.tenants.length > 0 ? inv.tenants[0] : null) : inv.tenants,
      buildings: Array.isArray(inv.apartments?.buildings) ? (inv.apartments.buildings.length > 0 ? inv.apartments.buildings[0] : null) : inv.apartments?.buildings,
    }));
    return mapped;
  });
}

/**
 * Xóa hóa đơn theo invoice_number (id)
 * @param {string} invoiceNumber
 * @returns {Promise<boolean>}
 */
export async function removeInvoiceFromSupabase(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id  );
  if (error) throw new Error(error.message);
  SupabaseCacheService.clear('invoices');
  return true;
}

/**
 * Cập nhật trạng thái hóa đơn theo invoice_number
 * @param {string} invoiceNumber
 * @param {string} status
 * @returns {Promise<boolean>}
 */
export async function updateInvoiceStatusInSupabase(id: number, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('invoices')
    .update({ status: status.toLowerCase() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  SupabaseCacheService.clear('invoices');
  return true;
}

/**
 * Cập nhật hóa đơn (bao gồm các trường, các item)
 * @param {number} id - ID hóa đơn
 * @param {Partial<SupabaseInvoiceRaw>} data - Dữ liệu cập nhật
 * @returns {Promise<boolean>}
 */
export async function updateInvoiceInSupabase(id: number, data: Partial<SupabaseInvoiceRaw>): Promise<boolean> {
  // Cập nhật bảng invoices
  const { invoice_items, ...invoiceData } = data;

  const { error } = await supabase
    .from('invoices')
    .update(invoiceData)
    .eq('id', id);
  if (error) throw new Error(error.message);

  // Nếu có invoice_items, cập nhật bảng con
  if (Array.isArray(invoice_items)) {
    // Xóa hết item cũ
    const { error: delErr } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
    if (delErr) throw new Error(delErr.message);
    // Insert lại item mới
    if (invoice_items.length > 0) {
      const itemsToInsert = invoice_items.map(item => ({ ...item, invoice_id: id }));
      const { error: insErr } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
      if (insErr) throw new Error(insErr.message);
    }
  }
  SupabaseCacheService.clear('invoices');
  return true;
}

/**
 * Tạo mới hóa đơn (insert invoices + invoice_items)
 * @param {Partial<SupabaseInvoiceRaw>} data - Dữ liệu hóa đơn
 * @returns {Promise<boolean>}
 */
export async function addInvoiceToSupabase(data: Partial<SupabaseInvoiceRaw>): Promise<boolean> {
  const { invoice_items, ...invoiceData } = data;
  console.log('data', data);
  // Insert vào bảng invoices
  const { data: inserted, error } = await supabase
    .from('invoices')
    .insert([invoiceData])
    .select();
  if (error) throw new Error(error.message);
  if (!inserted || inserted.length === 0) throw new Error('Insert invoice failed');
  const newInvoice = inserted[0];
  // Insert các item nếu có
  if (Array.isArray(invoice_items) && invoice_items.length > 0) {
    const itemsToInsert = invoice_items.map(item => {
      const { id, ...itemWithoutId } = item;
      return { ...itemWithoutId, invoice_id: newInvoice.id };
    });
  
    const itemsToUtilityReadings = invoice_items
      .filter(item => item.item_type === 'water' || item.item_type === 'electricity')
      .map(item => ({
        apartment_id: invoiceData.apartment_id,
        reading_type: item.item_type,
        reading_date: newInvoice.issue_date,
        reading_value: item.item_type === 'water' ? item.quantity : item.current_reading,
        invoice_id: newInvoice.id,
        notes: "From invoice " + newInvoice.invoice_number
      }));

    const [invoiceItemsResult, utilityReadingsResult] = await Promise.all([
      supabase
        .from('invoice_items')
        .insert(itemsToInsert),
      supabase
        .from('utility_readings')
        .insert(itemsToUtilityReadings)
    ]);

    if (invoiceItemsResult.error) throw new Error(invoiceItemsResult.error.message);
    if (utilityReadingsResult.error) throw new Error(utilityReadingsResult.error.message);

  }
  SupabaseCacheService.clear('invoices');
  return true;
}

/**
 * Lấy chỉ số điện/nước mới nhất của 1 phòng (apartment)
 * @param {number} apartmentId
 * @returns {Promise<{ electricity?: UtilityReading; water?: UtilityReading }>}
 */
export async function fetchUtilityReadingsByApartment(apartmentId: number): Promise<{ electricity?: UtilityReading; water?: UtilityReading }> {
  const { data, error } = await supabase
    .from('utility_readings')
    .select('*')
    .eq('apartment_id', apartmentId)
    .order('reading_date', { ascending: false });
  if (error) throw new Error(error.message);
  const readings = (data || []) as UtilityReading[];
  const electricity = readings.find(r => r.reading_type === 'electricity');
  const water = readings.find(r => r.reading_type === 'water');
  SupabaseCacheService.clear('utility_readings');
  return { electricity, water };
}

/**
 * Fetch all tenants from Supabase và join với apartments, buildings
 * @returns {Promise<SupabaseTenant[]>}
 */
export async function fetchTenantsFromSupabase(): Promise<Tenant[]> {
  return SupabaseCacheService.get('tenants', async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        apartment:apartment_id (
          id, unit_number, building_id, area, price,
          buildings:building_id (id, name, address)
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => ({
      ...item,
      apartment: item.apartment
        ? {
            ...item.apartment,
            buildings: Array.isArray(item.apartment.buildings)
              ? (item.apartment.buildings.length > 0 ? item.apartment.buildings[0] : null)
              : item.apartment.buildings
          }
        : null,
      building: item.apartment?.buildings || null,
    }));
  });
}

/**
 * Cập nhật tenant theo id
 * @param {string} id
 * @param {Partial<Tenant>} data
 * @returns {Promise<Tenant>}
 */
export async function updateTenantInSupabase(id: string, data: Partial<SupabaseTenant>): Promise<SupabaseTenant> {
  const { data: updated, error } = await supabase
    .from('tenants')
    .update(data)
    .eq('id', id)
    .select();
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) throw new Error('Not found or not updated');
  SupabaseCacheService.clear('tenants');
  return updated[0];
}

/**
 * Thêm tenant mới
 * @param {Partial<Tenant>} data
 * @returns {Promise<Tenant>}
 */
export async function addTenantToSupabase(data: Partial<Tenant>): Promise<Tenant> {
  const { data: inserted, error } = await supabase
    .from('tenants')
    .insert([data])
    .select();
  if (error) throw new Error(error.message);
  if (!inserted || inserted.length === 0) throw new Error('Insert failed');
  SupabaseCacheService.clear('tenants');
  return inserted[0];
}

/**
 * Lấy tổng doanh thu của các hoá đơn đã thanh toán trong tháng (theo year, month)
 * @param {number} year - Năm (ví dụ 2024)
 * @param {number} month - Tháng (1-12)
 * @returns {Promise<number>} Tổng doanh thu
 */
export async function getTotalRevenueByMonth(year: number, month: number): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // ngày cuối tháng
  const { data, error } = await supabase
    .from('invoices')
    .select('total, issue_date')
    .gte('issue_date', startDate.toISOString())
    .lte('issue_date', endDate.toISOString())
  if (error) throw new Error(error.message);
  return (data || []).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
}

/**
 * Lấy danh sách tổng doanh thu 12 tháng gần nhất, key là yyyy-mm
 * @returns {Promise<Record<string, number>>}
 */
export async function getMonthlyRevenueLast12Months(): Promise<Record<string, number>> {
  const now = new Date();
  // Tạo mảng 12 tháng gần nhất
  const months: { year: number; month: number; key: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    months.unshift({ year, month, key }); // unshift để kết quả từ cũ -> mới
  }
  // Lấy ngày đầu và cuối của 12 tháng
  const minDate = new Date(months[0].year, months[0].month - 1, 1);
  const maxDate = new Date(months[11].year, months[11].month, 0, 23, 59, 59, 999);
  // Query tất cả invoices trong khoảng này
  const { data, error } = await supabase
    .from('invoices')
    .select('total, issue_date, status')
    .gte('issue_date', minDate.toISOString())
    .lte('issue_date', maxDate.toISOString())
  if (error) throw new Error(error.message);
  // Map về từng tháng
  const result: Record<string, number> = {};
  months.forEach(({ year, month, key }) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const sum = (data || []).reduce((acc: number, inv: any) => {
      const d = new Date(inv.issue_date);
      if (d >= start && d <= end) return acc + (inv.total || 0);
      return acc;
    }, 0);
    result[key] = sum;
  });
  return result;
}

/**
 * Lấy tổng tiền điện, nước và additional_fees trong 12 tháng gần nhất, key là yyyy-mm
 * @returns {Promise<Record<string, { electricity: number, water: number, additional_fees: number }>>}
 */
export async function getMonthlyUtilityRevenueLast12Months(): Promise<Record<string, { electricity: number, water: number, additional_fees: number }>> {
  const now = new Date();
  // Tạo mảng 12 tháng gần nhất
  const months: { year: number; month: number; key: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    months.unshift({ year, month, key });
  }
  // Lấy ngày đầu và cuối của 12 tháng
  const minDate = new Date(months[0].year, months[0].month - 1, 1);
  const maxDate = new Date(months[11].year, months[11].month, 0, 23, 59, 59, 999);
  // Query tất cả invoice_items của hóa đơn đã thanh toán trong khoảng này, join invoices để lấy additional_fees
  const { data, error } = await supabase
    .from('invoice_items')
    .select('item_type, total, created_at, invoice_id, invoices!inner(status, issue_date, additional_fees)')
    .gte('invoices.issue_date', minDate.toISOString())
    .lte('invoices.issue_date', maxDate.toISOString())
    .in('item_type', ['electricity', 'water']);

  if (error) throw new Error(error.message);
  // Map về từng tháng
  const result: Record<string, { electricity: number, water: number, additional_fees: number }> = {};
  months.forEach(({ year, month, key }) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const filtered = (data || []).filter((item: any) => {
      const d = new Date(item.invoices.issue_date);
      return d >= start && d <= end;
    });
    // Lấy unique invoice_id trong filtered để tính tổng additional_fees
    const invoiceMap: Record<string, any> = {};
    filtered.forEach((item: any) => { invoiceMap[item.invoice_id] = item.invoices; });
    const additional_fees = Object.values(invoiceMap).reduce((acc: number, inv: any) => acc + (inv.additional_fees || 0), 0);
    result[key] = {
      electricity: filtered.filter((item: any) => item.item_type === 'electricity').reduce((acc: number, item: any) => acc + (item.total || 0), 0),
      water: filtered.filter((item: any) => item.item_type === 'water').reduce((acc: number, item: any) => acc + (item.total || 0), 0),
      additional_fees,
    };
  });
  return result;
}


/**
 * Lấy tổng doanh thu theo tháng
 * @param {number} year - Năm cần lấy doanh thu
 * @param {number} month - Tháng cần lấy doanh thu (1-12)
 * @returns {Promise<number>} Tổng doanh thu của tháng
 */
export async function getTotalRevenueForAll(): Promise<number> {
  const { data, error } = await supabase
    .from('invoices')
    .select('total')
  if (error) throw new Error(error.message);
  return (data || []).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
}

/**
 * Lấy doanh thu 12 tháng gần nhất theo từng buildingId, trả về kèm tên building
 * @returns {Promise<Record<string, { name: string, revenue: Record<string, number> }>>}
 */
export async function getRevenueByBuildingId12Month(): Promise<Record<string, { name: string, revenue: Record<string, number> }>> {
  const now = new Date();
  // Tạo mảng 12 tháng gần nhất
  const months: { year: number; month: number; key: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    months.unshift({ year, month, key });
  }
  // Lấy ngày đầu và cuối của 12 tháng
  const minDate = new Date(months[0].year, months[0].month - 1, 1);
  const maxDate = new Date(months[11].year, months[11].month, 0, 23, 59, 59, 999);
  // Query tất cả invoices đã thanh toán trong khoảng này, join apartments và buildings để lấy tên building
  const { data, error } = await supabase
    .from('invoices')
    .select('total, issue_date, status, apartment_id, apartments!inner(building_id, buildings!inner(id, name))')
    .gte('issue_date', minDate.toISOString())
    .lte('issue_date', maxDate.toISOString())
  if (error) throw new Error(error.message);
  // Map về từng buildingId và tháng, kèm tên
  const result: Record<string, { name: string, revenue: Record<string, number> }> = {};
  (data || []).forEach((inv: any) => {
    const buildingId = inv.apartments?.building_id || 'unknown';
    const buildingName = inv.apartments?.buildings?.name || 'Unknown';
    const d = new Date(inv.issue_date);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!result[buildingId]) result[buildingId] = { name: buildingName, revenue: {} };
    if (!result[buildingId].revenue[key]) result[buildingId].revenue[key] = 0;
    result[buildingId].revenue[key] += inv.total || 0;
  });
  return result;
}

/**
 * Fetch all building expenses, join with buildings
 * @returns {Promise<BuildingExpense[]>}
 */
export async function fetchBuildingExpenses(): Promise<BuildingExpense[]> {
  return SupabaseCacheService.get('building_expenses', async () => {
    const { data, error } = await supabase
      .from('building_expenses')
      .select(`*, buildings:building_id (id, name, address)`)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => ({
      ...item,
      building: item.buildings || null,
    }));
  });
}

/**
 * Thêm mới chi phí tòa nhà
 * @param {Partial<BuildingExpense>} data
 * @returns {Promise<BuildingExpense>}
 */
export async function addBuildingExpense(data: Partial<BuildingExpense>): Promise<BuildingExpense> {
  const { data: inserted, error } = await supabase
    .from('building_expenses')
    .insert([data])
    .select('*, buildings:building_id (id, name, address)');
  if (error) throw new Error(error.message);
  if (!inserted || inserted.length === 0) throw new Error('Insert failed');
  SupabaseCacheService.clear('building_expenses');
  return {
    ...inserted[0],
    building: inserted[0].buildings || null,
  };
}

/**
 * Cập nhật chi phí tòa nhà
 * @param {number} id
 * @param {Partial<BuildingExpense>} data
 * @returns {Promise<BuildingExpense>}
 */
export async function updateBuildingExpense(id: number, data: Partial<BuildingExpense>): Promise<BuildingExpense> {
  const { data: updated, error } = await supabase
    .from('building_expenses')
    .update(data)
    .eq('id', id)
    .select('*, buildings:building_id (id, name, address)');
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) throw new Error('Not found or not updated');
  SupabaseCacheService.clear('building_expenses');
  return {
    ...updated[0],
    building: updated[0].buildings || null,
  };
}

/**
 * Xóa chi phí tòa nhà
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function removeBuildingExpense(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('building_expenses')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  SupabaseCacheService.clear('building_expenses');
  return true;
}

/**
 * Lấy danh sách notification từ notification_queue, order by created_at desc
 * @returns {Promise<NotificationQueueItem[]>}
 */
export async function fetchNotificationsFromSupabase(): Promise<NotificationQueueItem[]> {
  const { data, error } = await supabase
    .from('notification_queue')
    .select(`
      *,
      invoice:invoice_id (
        *,
        tenants:tenant_id (*),
        invoice_items:invoice_items!fk_invoice_items_invoice_id (*),
        apartments:apartment_id (
          *,
          buildings:building_id (*)
        )
      ),
      tenant:tenant_id (
        id,
        full_name,
        phone,
        email
      )
    `)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as NotificationQueueItem[];
}

/**
 * Cập nhật 1 notification trong notification_queue theo id
 * @param {number} id - ID notification
 * @param {Partial<NotificationQueueItem>} data - Dữ liệu cập nhật
 * @returns {Promise<NotificationQueueItem>}
 */
export async function updateNotificationInSupabase(id: number, data: Partial<NotificationQueueItem>): Promise<NotificationQueueItem> {
  const { data: updated, error } = await supabase
    .from('notification_queue')
    .update(data)
    .eq('id', id)
    .select();
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) throw new Error('Not found or not updated');
  return updated[0] as NotificationQueueItem;
}

/**
 * Xóa tenant theo id
 * @param {string} id - UUID của tenant
 * @returns {Promise<boolean>}
 */
export async function removeTenantFromSupabase(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  SupabaseCacheService.clear('tenants');
  return true;
}

/**
 * Lấy chi tiết 1 phòng (Room Detail) gồm: room, building, tenants, invoices, invoiceItems, primaryTenant, exitedTenants, leaseRange, latestInvoice, paymentStatus
 * @param {number} roomId
 * @returns {Promise<RoomDetailData>}
 */
export async function getRoomDetail(roomId: number): Promise<RoomDetailData> {

  const [rooms, tenants, buildings, invoices, utilityReadings] = await Promise.all([
    fetchRoomsFromSupabase(),
    fetchTenantsFromSupabase(),
    fetchBuildingsFromSupabase(),
    fetchInvoicesFromSupabase(),
    fetchUtilityReadingsByApartment(roomId),
  ]);
  const room = rooms.find(r => r.id === roomId);
  if (!room) throw new Error('Room not found');
  const building = buildings.find(b => b.id === room.building_id) || room.building;
  const roomTenants = tenants.filter(t => t.apartment_id === roomId);
  const exitedTenants = tenants.filter(t => t.apartment_id !== roomId && t.move_out_date && new Date(t.move_out_date) < new Date());
  const primaryTenant = roomTenants.find(t => t.is_primary);
  const leaseRange = {
    start: primaryTenant?.move_in_date || null,
    end: primaryTenant?.move_out_date || null,
  };
  const roomInvoices = invoices.filter(inv => inv.apartment_id === roomId);
  const latestInvoice = roomInvoices.length > 0 ? [...roomInvoices].sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())[0] : null;
  let paymentStatus = 'no_invoice';
  if (latestInvoice) paymentStatus = latestInvoice.status;
  // Gom tất cả invoice items của phòng
  const invoiceItems = roomInvoices.flatMap(inv => inv.invoice_items || []);
  const utilityReading = utilityReadings?.electricity;
  return {
    room,
    building,
    tenants: roomTenants,
    invoices: roomInvoices,
    invoiceItems,
    primaryTenant: primaryTenant || null,
    exitedTenants,
    leaseRange,
    latestInvoice: latestInvoice || null,
    paymentStatus,
    utilityReading: utilityReading || null
  };
}

export async function login(username: string, password: string): Promise<boolean> {
 const {data, error} = await supabase.from('users').select('*').eq('username', username).eq('password', password);
 if (error) return false;
 if (!data || data.length === 0) return false;
 return true;
}

/**
 * Lấy chi tiết hóa đơn theo invoice_number
 * @param {string} invoiceNumber - Số hóa đơn
 * @returns {Promise<SupabaseInvoiceRaw | null>} - Chi tiết hóa đơn hoặc null nếu không tìm thấy
 */
export async function getInvoiceDetailByNumber(invoiceNumber: string): Promise<SupabaseInvoiceRaw | null> {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      tenants:tenant_id (id, apartment_id, full_name, email, phone, nationality, id_number, move_in_date, move_out_date, is_primary, tenant_type, created_at),
      invoice_items!fk_invoice_items_invoice_id (id, invoice_id, item_type, description, quantity, unit_price, total, previous_reading, current_reading, discount, created_at),
      apartments:apartment_id (
        id, unit_number, building_id, area, price,
        buildings:building_id (id, name, address)
      )
    `)
    .eq('invoice_number', invoiceNumber)
    .limit(1);
  if (error) throw new Error(error.message);
  if (!invoices || invoices.length === 0) return null;
  const inv = invoices[0];
  // Map tenants về object hoặc null, giữ nguyên id là số
  const mapped = {
    ...inv,
    tenants: Array.isArray(inv.tenants) ? (inv.tenants.length > 0 ? inv.tenants[0] : null) : inv.tenants,
    buildings: Array.isArray(inv.apartments?.buildings) ? (inv.apartments.buildings.length > 0 ? inv.apartments.buildings[0] : null) : inv.apartments?.buildings,
  };
  return mapped;
}