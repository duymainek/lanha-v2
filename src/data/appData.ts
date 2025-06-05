import { NotificationItem, ContractStatus, RoomStatus, InvoiceStatus, RecentActivity, MonthlyRevenueDataPoint, ChartDataPoint, KPI, NavItem, SaleActivityDataPoint, SubscriptionsDataPoint, KPISmallChartDataPoint } from './types';
import { HomeIcon, UsersIcon, OfficeBuildingIcon, CollectionIcon, DocumentTextIcon, BellIcon, CogIcon, CurrencyDollarIcon, BriefcaseIcon, ReceiptPercentIcon, ArchiveBoxIcon, ChartTrendingUpIcon } from '../components/icons';
import { getMonthlyRevenueLast12Months, getMonthlyUtilityRevenueLast12Months, getTotalRevenueByMonth, getTotalRevenueForAll } from './roomDataSource';


export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'N001', title: 'Rent Due Reminder', message: 'Your monthly rent for room R101 is due on June 15th.', recipient: 'T001', sentDate: '2024-06-05', status: 'Sent' },
  { id: 'N002', title: 'Scheduled Maintenance', message: 'Building B001 will have water maintenance on June 10th from 9 AM to 12 PM.', recipient: 'B001', sentDate: '2024-06-07', status: 'Sent' },
  { id: 'N003', title: 'Welcome New Tenant!', message: 'Welcome to Là Nhà Apartment! We are thrilled to have you.', recipient: 'T003', sentDate: '2024-05-20', status: 'Pending' },
];

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: HomeIcon },
  { name: 'Tenants', path: '/tenants', icon: UsersIcon },
  { name: 'Buildings', path: '/buildings', icon: OfficeBuildingIcon },
  { name: 'Rooms', path: '/rooms', icon: CollectionIcon },
  { name: 'Invoices', path: '/invoices', icon: DocumentTextIcon },
  { name: 'Expenses', path: '/expenses', icon: CurrencyDollarIcon },
  { name: 'Notifications', path: '/notifications', icon: BellIcon },
  { name: 'Settings', path: '/settings', icon: CogIcon },
];


export const MOCK_SALE_ACTIVITY_DATA: SaleActivityDataPoint[] = [
  { month: 'Jan', sales: 4000, target: 2400 },
  { month: 'Feb', sales: 3000, target: 2210 },
  { month: 'Mar', sales: 2000, target: 2290 },
  { month: 'Apr', sales: 2780, target: 2000 },
  { month: 'May', sales: 1890, target: 2181 },
  { month: 'Jun', sales: 2390, target: 2500 },
];

export const MOCK_SUBSCRIPTIONS_BAR_CHART_DATA: SubscriptionsDataPoint[] = [
  { name: 'Jan', count: 1800 },
  { name: 'Feb', count: 2200 },
  { name: 'Mar', count: 1900 },
  { name: 'Apr', count: 2500 },
  { name: 'May', count: 2100 },
  { name: 'Jun', count: 2800 },
  { name: 'Jul', count: 2300 },
  { name: 'Aug', count: 3100 },
  { name: 'Sep', count: 2600 },
  { name: 'Oct', count: 3500 },
  { name: 'Nov', count: 3000 },
  { name: 'Dec', count: 4200 },
];


// Obsolete MOCK_KPIS - replaced by MOCK_DASHBOARD_KPIS for the new dashboard
// export const MOCK_KPIS: KPI[] = [
//   { title: 'Total Revenue (Month)', value: '₫150M', icon: CurrencyDollarIcon, bgColor: 'bg-blue-500', textColor: 'text-blue-500' },
//   { title: 'New Tenants (Month)', value: 5, icon: UsersIcon, bgColor: 'bg-green-500', textColor: 'text-green-500' },
//   { title: 'Vacancy Rate', value: '8%', icon: BriefcaseIcon, bgColor: 'bg-yellow-500', textColor: 'text-yellow-500' },
//   { title: 'Pending Invoices', value: 12, icon: ReceiptPercentIcon, bgColor: 'bg-red-500', textColor: 'text-red-500' },
// ];

export const MOCK_MONTHLY_REVENUE: MonthlyRevenueDataPoint[] = [
  { month: 'Jan', revenue: 120 },
  { month: 'Feb', revenue: 180 },
  { month: 'Mar', revenue: 150 },
  { month: 'Apr', revenue: 200 },
  { month: 'May', revenue: 170 },
  { month: 'Jun', revenue: 220 },
];

export const MOCK_ROOM_STATUS_DISTRIBUTION: ChartDataPoint[] = [
  { name: 'Rented', value: 65 },
  { name: 'Vacant', value: 15 },
  { name: 'Maintenance', value: 10 },
  { name: 'Deposit Paid', value: 10 },
];

export const MOCK_RECENT_ACTIVITIES: RecentActivity[] = [
  { id: 'ACT001', description: 'Payment of ₫15M received from Tenant T001.', timestamp: '2 hours ago', type: 'payment' },
  { id: 'ACT002', description: 'New tenant T003 moved into room R102.', timestamp: '1 day ago', type: 'new_tenant' },
  { id: 'ACT003', description: 'Maintenance request for room R301 (AC broken).', timestamp: '3 days ago', type: 'maintenance' },
];

export const ROOM_TYPES = ['Studio', '1-Bedroom', '2-Bedroom', '3-Bedroom', 'Penthouse'];
export const ALL_ROOM_STATUSES = Object.values(RoomStatus);
export const ALL_CONTRACT_STATUSES = Object.values(ContractStatus);
export const ALL_INVOICE_STATUSES = Object.values(InvoiceStatus);


/**
 * Khởi tạo dữ liệu cho dashboard KPIs
 * @returns {Promise<KPI[]>}
 */
async function initDashboardKPIs(): Promise<KPI[]> {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Lấy dữ liệu revenue một lần
  const [monthlyRevenue, totalRevenue, monthlyUtilityRevenue, totalRevenueForAll] = await Promise.all([
    getMonthlyRevenueLast12Months(),
    getTotalRevenueByMonth(currentYear, currentMonth),
    getMonthlyUtilityRevenueLast12Months(),
    getTotalRevenueForAll()
  ]);

  return [
   
    {
      id: 'kpi1',
      icon: CurrencyDollarIcon,
      title: `Revenue (${currentDate.toLocaleString('default', { month: 'long' })})`,
      value: `₫${totalRevenue.toLocaleString()}`,
      periodDescription: `Since Last month`,
      percentageChange: `${((totalRevenue - totalRevenueForAll) / totalRevenueForAll * 100).toFixed(2)}%`,
      trend: totalRevenue > totalRevenueForAll ? 'up' : 'down',
      chartData: Object.entries(monthlyRevenue).map(([key, value]) => ({
        name: key,
        value: value
      })),
    },
    {
      id: 'kpi2',
      title: 'Electricity Revenue',
      value: `₫${monthlyUtilityRevenue[`${currentYear}-${currentMonth.toString().padStart(2, '0')}`].electricity.toLocaleString()}`,
      icon: ChartTrendingUpIcon,
      periodDescription: `Since Last month`,
      percentageChange: `${((monthlyUtilityRevenue[`${currentYear}-${currentMonth.toString().padStart(2, '0')}`].electricity - monthlyUtilityRevenue[`${currentYear}-${(currentMonth-1).toString().padStart(2, '0')}`].electricity) / monthlyUtilityRevenue[`${currentYear}-${(currentMonth-1).toString().padStart(2, '0')}`].electricity * 100).toFixed(2)}%`,
      trend: monthlyUtilityRevenue[`${currentYear}-${currentMonth.toString().padStart(2, '0')}`].electricity > monthlyUtilityRevenue[`${currentYear}-${(currentMonth-1).toString().padStart(2, '0')}`].electricity ? 'up' : 'down',
      chartData: Object.entries(monthlyUtilityRevenue).map(([key, value]) => ({
        name: key,
        value: value.electricity
      })),
    },
    {
      id: 'kpi3',
      icon: ChartTrendingUpIcon,

      title: 'Water Revenue',
      value: `₫${monthlyUtilityRevenue[`${currentYear}-${currentMonth.toString().padStart(2, '0')}`].water.toLocaleString()}`,
      periodDescription: `Since Last month`,
      percentageChange: `${((monthlyUtilityRevenue[`${currentYear}-${currentMonth.toString().padStart(2, '0')}`].water - monthlyUtilityRevenue[`${currentYear}-${(currentMonth-1).toString().padStart(2, '0')}`].water) / monthlyUtilityRevenue[`${currentYear}-${(currentMonth-1).toString().padStart(2, '0')}`].water * 100).toFixed(2)}%`,
      trend: monthlyUtilityRevenue[`${currentYear}-${currentMonth.toString().padStart(2, '0')}`].water > monthlyUtilityRevenue[`${currentYear}-${(currentMonth-1).toString().padStart(2, '0')}`].water ? 'up' : 'down',
      chartData: Object.entries(monthlyUtilityRevenue).map(([key, value]) => ({
        name: key,
        value: value.water
      })),
    },
    {
      id: 'kpi4',
      title: 'Additional Fees',
      value: `₫${monthlyUtilityRevenue[`${currentYear}-${currentMonth.toString().padStart(2, '0')}`].additional_fees.toLocaleString()}`,
      icon: ChartTrendingUpIcon,
      periodDescription: `Since Last month`,
      percentageChange: `${((monthlyUtilityRevenue[`${currentYear}-${currentMonth.toString().padStart(2, '0')}`].additional_fees - monthlyUtilityRevenue[`${currentYear}-${(currentMonth-1).toString().padStart(2, '0')}`].additional_fees) / monthlyUtilityRevenue[`${currentYear}-${(currentMonth-1).toString().padStart(2, '0')}`].additional_fees * 100).toFixed(2)}%`,
      trend: monthlyUtilityRevenue[`${currentYear}-${currentMonth.toString().padStart(2, '0')}`].additional_fees > monthlyUtilityRevenue[`${currentYear}-${(currentMonth-1).toString().padStart(2, '0')}`].additional_fees ? 'up' : 'down',
      chartData: Object.entries(monthlyUtilityRevenue).map(([key, value]) => ({
        name: key,
        value: value.additional_fees
      })),
    },
  ];
}

export const DASHBOARD_KPIS = await initDashboardKPIs();
