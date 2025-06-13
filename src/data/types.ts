export const InvoiceStatus = {
  Paid: 'paid',
  Pending: 'unpaid',
  Overdue: 'overdue',
}

/**
 * @typedef {Object} InvoiceItem
 * @property {number} id - ID của invoice item
 * @property {number} invoice_id - ID của hóa đơn (FK)
 * @property {string} item_type - Loại dịch vụ/phí (ví dụ: 'electricity', 'water', ...)
 * @property {string} description - Mô tả chi tiết dòng phí
 * @property {number} quantity - Số lượng
 * @property {number} unit_price - Đơn giá
 * @property {number} total - Thành tiền
 * @property {number | null} previous_reading - Chỉ số cũ (nếu có, ví dụ điện/nước)
 * @property {number | null} current_reading - Chỉ số mới (nếu có)
 * @property {number | null} discount - Giảm giá (nếu có)
 * @property {string} created_at - Thời gian tạo
 */
export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  previous_reading?: number | null;
  current_reading?: number | null;
  discount?: number | null;
  created_at?: string;
}

/**
 * @typedef {Object} Tenant
 * @property {string} id - UUID của tenant
 * @property {number|null} apartment_id - ID phòng (FK)
 * @property {string} full_name - Họ tên
 * @property {string|null} email - Email
 * @property {string|null} phone - Số điện thoại
 * @property {string|null} id_number - Số CMND/CCCD
 * @property {string|null} nationality - Quốc tịch
 * @property {string|null} move_in_date - Ngày vào ở (YYYY-MM-DD)
 * @property {string|null} move_out_date - Ngày rời đi (YYYY-MM-DD)
 * @property {boolean|null} is_primary - Có phải tenant chính không
 * @property {string|null} notes - Ghi chú
 * @property {string|null} created_at - Thời gian tạo
 * @property {string|null} updated_at - Thời gian cập nhật
 * @property {string|null} password - (nên mã hóa)
 * @property {string|null} id_card_front_url - Ảnh mặt trước CCCD
 * @property {string|null} id_card_back_url - Ảnh mặt sau CCCD
 * @property {string|null} tenant_type - Loại tenant (primary, dependent)
 * @property {string|null} created_by_tenant_id - UUID người tạo (FK)
 */
export interface SupabaseTenant {
  id: string;
  apartment_id: number | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  id_number: string | null;
  nationality: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  is_primary: boolean | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  password: string | null;
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  tenant_type: string | null;
  created_by_tenant_id: string | null;
}

export interface Tenant extends SupabaseTenant {
  apartment: SupabaseApartmentRaw | null;
  building: SupabaseBuilding | null;
}

export interface SupabaseBuilding {
  id: number; // integer, primary key
  name: string; // text, required
  location: string; // text, required
  address: string; // text, required
  description?: string | null; // text
  map_embed_url?: string | null; // text
  transportation?: string | null; // text
  shopping?: string | null; // text
  healthcare?: string | null; // text
  environment?: string | null; // text
  lifestyle?: string | null; // text
  accessibility?: string | null; // text
  description_en?: string | null; // text
  description_vi?: string | null; // text
  description_ru?: string | null; // text
  transportation_en?: string | null;
  transportation_vi?: string | null;
  transportation_ru?: string | null;
  shopping_en?: string | null;
  shopping_vi?: string | null;
  shopping_ru?: string | null;
  healthcare_en?: string | null;
  healthcare_vi?: string | null;
  healthcare_ru?: string | null;
  environment_en?: string | null;
  environment_vi?: string | null;
  environment_ru?: string | null;
  lifestyle_en?: string | null;
  lifestyle_vi?: string | null;
  lifestyle_ru?: string | null;
  accessibility_en?: string | null;
  accessibility_vi?: string | null;
  accessibility_ru?: string | null;
}

export interface SupabaseApartmentRaw {
  id: number;
  building_id: number;
  unit_number: string;
  bedrooms: number;
  area: number;
  price: number;
  amenities: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface Room extends SupabaseApartmentRaw {
  floor?: string;
  bathrooms: number;
  next_available_date?: string | null;
  minimum_rental_period: number;
  deposit: number;
  furnished: boolean;
  air_conditioning: boolean;
  washing_machine: boolean;
  internet: boolean;
  includes_water: boolean;
  includes_wifi: boolean;
  includes_cleaning: boolean;
  includes_security: boolean;
  includes_maintenance: boolean;
  includes_electricity: boolean;
  description_en?: string;
  description_vi?: string;
  description_ru?: string;
  electricity_price?: number;
  water_price?: number;
  display_price?: number;
  building: SupabaseBuilding;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  recipient: string; // 'All', 'TenantID', 'BuildingID'
  sentDate: string;
  status: 'Sent' | 'Pending' | 'Failed';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin'; // For now, only Admin
}

export interface NavItem {
  name: string;
  path: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
  value3?: number;
}

export interface MonthlyRevenueDataPoint {
  month: string;
  revenue: number;
}

// Updated KPI structure for the new dashboard
export interface KPISmallChartDataPoint {
  name: string; // Typically a letter or number for x-axis
  value: number; // The y-axis value
}

export interface KPI {
  id: string;
  title: string;
  value: string; // The main large figure, e.g., "4,682" or "$15,231.89"
  icon?: React.FC<React.SVGProps<SVGSVGElement>>; // For the small icon on cards like "New Subscriptions"
  periodDescription?: string; // e.g., "Since Last week" or "from last month"
  percentageChange?: string; // e.g., "15.54%" or "20.1%" (already includes %)
  trend?: 'up' | 'down'; // For the arrow direction
  detailsText?: string; // e.g., "Details"
  chartData?: KPISmallChartDataPoint[]; // For the small line charts in some KPIs or the main chart in "Total Revenue"
  isRevenueCard?: boolean; // Special flag for "Total Revenue" card style
}

export interface FormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'tel' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export interface FilterOption<T> {
  label: string;
  value: keyof T; // The key in the data item to filter by
  options: string[]; // The available values for this filter
}

export interface FilterOptionConfig<T> {
  label: string;
  value: keyof T; // The key in the data item to filter by
  options?: Array<string | number>; // The available values for this filter (can be string or number)
  optionLabels?: Record<string | number, string>; // Optional: map values to labels for display
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: 'payment' | 'maintenance' | 'new_tenant';
}

export interface SaleActivityDataPoint {
  month: string;
  sales: number;
  target: number;
}

export interface SubscriptionsDataPoint {
  name: string; // Typically month or category
  count: number;
}

/**
 * @typedef {Object} SupabaseInvoiceRaw
 * @property {number} id - ID hóa đơn (PK)
 * @property {number} apartment_id - ID phòng (FK)
 * @property {string} invoice_number - Số hóa đơn
 * @property {string} issue_date - Ngày tạo hóa đơn (YYYY-MM-DD)
 * @property {string} due_date - Ngày đến hạn (YYYY-MM-DD)
 * @property {string | null} period_start - Ngày bắt đầu kỳ (nullable)
 * @property {string | null} period_end - Ngày kết thúc kỳ (nullable)
 * @property {string} status - Trạng thái hóa đơn (unpaid/paid/pending/overdue)
 * @property {string | null} notes - Ghi chú (nullable)
 * @property {number} subtotal - Tổng tiền trước phí/giảm giá
 * @property {number | null} additional_fees - Phí bổ sung (nullable)
 * @property {number | null} discounts - Giảm giá (nullable)
 * @property {number} total - Tổng tiền hóa đơn
 * @property {number | null} deposit_used - Tiền cọc đã dùng (nullable)
 * @property {number | null} deposit_remaining - Tiền cọc còn lại (nullable)
 * @property {boolean | null} is_final_invoice - Có phải hóa đơn cuối cùng (nullable)
 * @property {string | null} created_at - Thời gian tạo (nullable)
 * @property {string | null} updated_at - Thời gian cập nhật (nullable)
 * @property {string | null} tenant_id - ID tenant (FK, có thể null)
 * @property {SupabaseTenant | null} tenants - Thông tin tenant (object, có thể null)
 * @property {InvoiceItem[]} invoice_items - Danh sách các mục hóa đơn
 * @property {SupabaseApartmentRaw | null} apartments - Thông tin phòng join từ apartments (có thể null)
 * @property {SupabaseBuilding | null} buildings - Thông tin tòa nhà join từ apartments (có thể null)
 */
export interface SupabaseInvoiceRaw {
  id: number;
  apartment_id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  period_start?: string | null;
  period_end?: string | null;
  status: string;
  notes?: string | null;
  subtotal: number;
  additional_fees?: number | null;
  discounts?: number | null;
  total: number;
  deposit_used?: number | null;
  deposit_remaining?: number | null;
  is_final_invoice?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  tenant_id: string | null;
  tenants: SupabaseTenant | null;
  invoice_items: InvoiceItem[];
  apartments?: SupabaseApartmentRaw | null;
  buildings?: SupabaseBuilding | null;
}

/**
 * @typedef {Object} UtilityReading
 * @property {number} id - ID chỉ số (PK)
 * @property {number} apartment_id - ID phòng (FK)
 * @property {string} reading_type - Loại chỉ số ('electricity' | 'water')
 * @property {string} reading_date - Ngày ghi chỉ số (YYYY-MM-DD)
 * @property {number} reading_value - Giá trị chỉ số
 * @property {string | null} notes - Ghi chú (nullable)
 * @property {string} created_at - Thời gian tạo
 */
export interface UtilityReading {
  id: number;
  apartment_id: number;
  reading_type: string; // 'electricity' | 'water'
  reading_date: string;
  reading_value: number;
  notes?: string | null;
  created_at?: string;
}

/**
 * @typedef {Object} BuildingExpense
 * @property {number} id - ID chi phí
 * @property {number} building_id - ID tòa nhà
 * @property {string} expense_type - Loại chi phí ('water' | 'electricity')
 * @property {number} amount - Số tiền
 * @property {string} [note] - Ghi chú
 * @property {string} created_at - Ngày tạo
 * @property {string} updated_at - Ngày cập nhật
 * @property {SupabaseBuilding} [building] - Thông tin tòa nhà (join)
 */
export interface BuildingExpense {
  id: number;
  building_id: number;
  expense_type: 'water' | 'electricity';
  amount: number;
  note?: string;
  created_at: string;
  updated_at: string;
  building?: SupabaseBuilding;
}

/**
 * @typedef {Object} NotificationQueueItem
 * @property {number} id - ID thông báo (PK, tự tăng)
 * @property {string} created_at - Thời gian tạo
 * @property {string | null} tenant_id - ID tenant nhận thông báo (nullable)
 * @property {string | null} title - Tiêu đề thông báo
 * @property {string | null} sent_date - Ngày gửi (nullable)
 * @property {string | null} status - Trạng thái (Pending, Sent...)
 * @property {number | null} invoice_id - ID hóa đơn liên quan (nullable)
 */
export interface NotificationQueueItem {
  id: number;
  created_at: string;
  tenant_id: string | null;
  title: string | null;
  sent_date: string | null;
  status: string | null;
  invoice_id: number | null;
  invoice: SupabaseInvoiceRaw | null;
  tenant: SupabaseTenant | null;
}

/**
 * @typedef {Object} RoomDetailData
 * @property {Room} room - Thông tin phòng
 * @property {SupabaseBuilding} building - Thông tin tòa nhà
 * @property {Tenant[]} tenants - Danh sách tenant hiện tại của phòng
 * @property {Tenant[]} exitedTenants - Danh sách tenant đã rời đi
 * @property {SupabaseInvoiceRaw[]} invoices - Danh sách hóa đơn của phòng
 * @property {InvoiceItem[]} invoiceItems - Danh sách tất cả các mục hóa đơn của phòng
 * @property {Tenant | null} primaryTenant - Tenant chính (nếu có)
 * @property {{ start: string | null; end: string | null }} leaseRange - Khoảng thời gian thuê
 * @property {SupabaseInvoiceRaw | null} latestInvoice - Hóa đơn mới nhất (nếu có)
 * @property {string} paymentStatus - Trạng thái thanh toán hóa đơn mới nhất hoặc 'no_invoice'
 * @property {UtilityReading | null} utilityReading - Chỉ số điện mới nhất (nếu có)
 */
export interface RoomDetailData {
  room: Room;
  building: SupabaseBuilding;
  tenants: Tenant[];
  exitedTenants: Tenant[];
  invoices: SupabaseInvoiceRaw[];
  invoiceItems: InvoiceItem[];
  primaryTenant: Tenant | null;
  leaseRange: {
    start: string | null;
    end: string | null;
  };
  latestInvoice: SupabaseInvoiceRaw | null;
  paymentStatus: string;
  utilityReading: UtilityReading | null;
}