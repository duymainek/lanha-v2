import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DASHBOARD_KPIS } from '../data/appData';
import { Card } from '../components/Card';
import { ArrowUpIcon, ArrowDownIcon, InformationCircleIcon } from '../components/icons';
import { KPI as KPIType } from '../data/types';
import { getMonthlyRevenueLast12Months, getRevenueByBuildingId12Month, fetchInvoicesFromSupabase, fetchBuildingExpenses, fetchBuildingsFromSupabase, getMonthlyUtilityRevenueLast12Months } from '../data/roomDataSource';
import { Table, TableColumn } from '../components/Table';

type TabId = 'overview' | 'analytics' | 'reports' | 'notifications';

const KPICard: React.FC<{ kpi: KPIType }> = ({ kpi }) => {
  const TrendIcon = kpi.trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
  const trendColor = kpi.trend === 'up' ? 'text-green-500' : 'text-red-500';

  if (kpi.isRevenueCard) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col">
        <div className="p-4">
          <h3 className="text-base font-medium text-text-muted">{kpi.title}</h3>
          <p className="mt-1 text-3xl font-semibold text-text-main">{kpi.value}</p>
          {kpi.periodDescription && (
            <p className="text-xs text-text-muted mt-1">{kpi.periodDescription}</p>
          )}
        </div>
        {kpi.chartData && (
          <div className="flex-grow mt-2 pr-2">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={kpi.chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {kpi.icon && <kpi.icon className="h-5 w-5 text-text-muted mr-2" />}
            <h3 className="text-sm font-medium text-text-muted truncate">{kpi.title}</h3>
          </div>
          <InformationCircleIcon className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-3xl font-semibold text-text-main mb-1">{kpi.value}</p>
        <div className="flex items-end justify-between">
          <div>
            {kpi.detailsText && <a href="#" className="text-xs text-primary hover:underline">{kpi.detailsText}</a>}
            {kpi.periodDescription && !kpi.detailsText && <p className="text-xs text-text-muted">{kpi.periodDescription}</p>}
          </div>
          {kpi.percentageChange && (
            <div className={`flex items-center text-xs font-medium ${trendColor}`}>
              <span>{kpi.percentageChange}</span>
              <TrendIcon className="h-3 w-3 ml-0.5" />
            </div>
          )}
        </div>
      </div>
      {kpi.chartData && (
         <div className="opacity-60" style={{ height: '50px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpi.chartData}>
              <Line type="monotone" dataKey="value" stroke={kpi.trend === 'up' ? '#34D399' : '#F87171'} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};


export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [buildingRevenueData, setBuildingRevenueData] = useState<any[]>([]);
  const [buildingKeys, setBuildingKeys] = useState<string[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [buildingExpenseChartData, setBuildingExpenseChartData] = useState<any[]>([]);
  const [buildingExpenseKeys, setBuildingExpenseKeys] = useState<string[]>([]);
  const [buildingWaterChartData, setBuildingWaterChartData] = useState<any[]>([]);
  const [buildingWaterKeys, setBuildingWaterKeys] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      const revenueByBuilding = await getRevenueByBuildingId12Month();
      // Lấy tất cả buildingId
      const buildingIds = Object.keys(revenueByBuilding);
      // Lấy tên building tương ứng
      const buildingNames = buildingIds.map(bid => revenueByBuilding[bid].name || bid);
      // Tạo mảng 12 tháng gần nhất (theo thứ tự tăng dần)
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      });
      // Map về dạng [{ month, buildingName1, buildingName2, ... }]
      const data = months.map(month => {
        const entry: any = { month };
        buildingIds.forEach((bid, idx) => {
          const name = buildingNames[idx];
          entry[name] = revenueByBuilding[bid].revenue[month] || 0;
        });
        return entry;
      });
      setBuildingRevenueData(data);
      setBuildingKeys(buildingNames);
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchUnpaidInvoices() {
      const allInvoices = await fetchInvoicesFromSupabase();
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const filtered = allInvoices.filter(inv => {
        const issue = new Date(inv.issue_date);
        return inv.status !== 'paid' && issue.getMonth() === thisMonth && issue.getFullYear() === thisYear;
      });
      setUnpaidInvoices(filtered);
    }
    fetchUnpaidInvoices();
  }, []);

  useEffect(() => {
    async function fetchExpenseChartData() {
      // Lấy invoices đã thanh toán 6 tháng gần nhất
      const allInvoices = await fetchInvoicesFromSupabase();
      // Lấy expenses
      const expenses = await fetchBuildingExpenses();
      // Lấy danh sách tòa nhà
      const buildings = await fetchBuildingsFromSupabase();
      // Tạo mảng 6 tháng gần nhất
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      });
      // Lấy tất cả buildingId và tên rút gọn
      const buildingIds = buildings.map(b => b.id);
      const buildingNames = buildings.map(b => b.name);
      const buildingShortNames = buildingNames.map(name => name.split(/\s+/).map(w => w[0]?.toUpperCase() || '').join(''));
      // Group revenue điện theo building và tháng
      // Map: { [buildingId]: { [month]: total } }
      const revenueByBuilding: Record<number, Record<string, number>> = {};
      allInvoices.forEach(inv => {
        if (!inv.apartments || !inv.apartments.building_id) return;
        const buildingId = inv.apartments.building_id;
        const d = new Date(inv.issue_date);
        const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        // Lọc các item electricity
        const elecItems = (inv.invoice_items || []).filter(item => item.item_type === 'electricity');
        const sum = elecItems.reduce((acc, item) => acc + (item.total || 0), 0);
        if (!revenueByBuilding[buildingId]) revenueByBuilding[buildingId] = {};
        if (!revenueByBuilding[buildingId][monthKey]) revenueByBuilding[buildingId][monthKey] = 0;
        revenueByBuilding[buildingId][monthKey] += sum;
      });
      // Map dữ liệu về dạng [{ month, 'ST_revenue', 'ST_expense', ... }]
      const data = months.map(month => {
        const entry: any = { month };
        buildingIds.forEach((bid, idx) => {
          const shortName = buildingShortNames[idx];
          // Revenue điện
          entry[`${shortName}_revenue`] = revenueByBuilding[bid]?.[month] || 0;
          // Expenses: tổng electricity expense của building theo tháng
          const expenseSum = expenses.filter(e => e.building_id === bid && e.expense_type === 'electricity' && e.created_at.startsWith(month)).reduce((sum, e) => sum + (e.amount || 0), 0);
          entry[`${shortName}_expense`] = expenseSum;
        });
        return entry;
      });
      setBuildingExpenseChartData(data);
      setBuildingExpenseKeys(buildingShortNames);
    }
    fetchExpenseChartData();
  }, []);

  useEffect(() => {
    async function fetchWaterChartData() {
      const allInvoices = await fetchInvoicesFromSupabase();
      const expenses = await fetchBuildingExpenses();
      const buildings = await fetchBuildingsFromSupabase();
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      });
      const buildingIds = buildings.map(b => b.id);
      const buildingNames = buildings.map(b => b.name);
      const buildingShortNames = buildingNames.map(name => name.split(/\s+/).map(w => w[0]?.toUpperCase() || '').join(''));
      // Group revenue nước theo building và tháng
      const revenueByBuilding: Record<number, Record<string, number>> = {};
      allInvoices.forEach(inv => {
        if (!inv.apartments || !inv.apartments.building_id) return;
        const buildingId = inv.apartments.building_id;
        const d = new Date(inv.issue_date);
        const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        // Lọc các item water
        const waterItems = (inv.invoice_items || []).filter(item => item.item_type === 'water');
        const sum = waterItems.reduce((acc, item) => acc + (item.total || 0), 0);
        if (!revenueByBuilding[buildingId]) revenueByBuilding[buildingId] = {};
        if (!revenueByBuilding[buildingId][monthKey]) revenueByBuilding[buildingId][monthKey] = 0;
        revenueByBuilding[buildingId][monthKey] += sum;
      });
      // Map dữ liệu về dạng [{ month, 'ST_revenue', 'ST_expense', ... }]
      const data = months.map(month => {
        const entry: any = { month };
        buildingIds.forEach((bid, idx) => {
          const shortName = buildingShortNames[idx];
          // Revenue nước
          entry[`${shortName}_revenue`] = revenueByBuilding[bid]?.[month] || 0;
          // Expenses: tổng water expense của building theo tháng
          const expenseSum = expenses.filter(e => e.building_id === bid && e.expense_type === 'water' && e.created_at.startsWith(month)).reduce((sum, e) => sum + (e.amount || 0), 0);
          entry[`${shortName}_expense`] = expenseSum;
        });
        return entry;
      });
      setBuildingWaterChartData(data);
      setBuildingWaterKeys(buildingShortNames);
    }
    fetchWaterChartData();
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
  ];

  return (
    <div className="p-6 bg-light-bg min-h-full">
      <div className="mb-6">
        <div className="border-b border-border-color">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                  ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-main hover:border-gray-300'
                  }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DASHBOARD_KPIS.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card title="Revenue - Monthly" className="lg:col-span-3">
              <p className="text-xs text-text-muted mb-4 -mt-2">Revenue by building for the last 12 months</p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={buildingRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={value => {
                      if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) {
                        const [year, month] = value.split('-');
                        return `${month}/${year}`;
                      }
                      return value;
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={value => {
                      if (typeof value !== 'number') return value;
                      if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
                      if (value >= 1_000_000) return (value / 1_000_000).toFixed(0) + 'M';
                      if (value >= 1_000) return (value / 1_000).toFixed(0) + 'k';
                      return value;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', borderColor: '#e5e7eb' }}
                    formatter={value => typeof value === 'number' ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) : value}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.875rem' }} align="right" verticalAlign="top" height={36}/>
                  {buildingKeys.map((key, idx) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={['#ff7300', '#387908', '#4F46E5'][idx % 3]}
                      strokeWidth={2}
                      dot={false}
                      name={key}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Unpaid Invoices" className="lg:col-span-2">
              <p className="text-xs text-text-muted mb-4 -mt-2">Unpaid invoices in this month</p>
              <Table
                columns={[
                  { header: 'Room', accessor: (item) => item.apartments?.unit_number || item.apartment_id },
                  { header: 'Building ', accessor: (item) => item.buildings?.name || item.apartments?.buildings?.name || '' },
                  { header: 'Total', accessor: (item) => item.total?.toLocaleString('vi-VN'), className: 'text-right' },
                ] as TableColumn<any>[]}
                data={unpaidInvoices.map(inv => ({ ...inv, id: inv.id }))}
                emptyMessage="No unpaid invoices in this month"
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Electricity Revenue vs Expenses">
              <p className="text-text-muted">So sánh doanh thu và chi phí điện của từng tòa nhà trong 6 tháng gần nhất.</p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={buildingExpenseChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={value => {
                      if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) {
                        const [year, month] = value.split('-');
                        return `${month}/${year}`;
                      }
                      return value;
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={value => {
                      if (typeof value !== 'number') return value;
                      if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
                      if (value >= 1_000_000) return (value / 1_000_000).toFixed(0) + 'M';
                      if (value >= 1_000) return (value / 1_000).toFixed(0) + 'k';
                      return value;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', borderColor: '#e5e7eb' }}
                    formatter={value => typeof value === 'number' ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) : value}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.875rem' }} align="right" verticalAlign="top" height={36}/>
                  {buildingExpenseKeys.map((shortName, idx) => [
                    <Line
                      key={`${shortName}_revenue`}
                      type="monotone"
                      dataKey={`${shortName}_revenue`}
                      stroke={['#4F46E5', '#059669', '#F59E42'][idx % 3]}
                      strokeWidth={2}
                      dot={false}
                      name={`${shortName} Revenue`}
                    />,
                    <Line
                      key={`${shortName}_expense`}
                      type="monotone"
                      dataKey={`${shortName}_expense`}
                      stroke={['#F87171', '#F59E42', '#059669'][idx % 3]}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                      name={`${shortName} Expense`}
                    />
                  ])}
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Water Revenue vs Expenses">
              <p className="text-text-muted">So sánh doanh thu và chi phí nước của từng tòa nhà trong 6 tháng gần nhất.</p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={buildingWaterChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={value => {
                      if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) {
                        const [year, month] = value.split('-');
                        return `${month}/${year}`;
                      }
                      return value;
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={value => {
                      if (typeof value !== 'number') return value;
                      if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
                      if (value >= 1_000_000) return (value / 1_000_000).toFixed(0) + 'M';
                      if (value >= 1_000) return (value / 1_000).toFixed(0) + 'k';
                      return value;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', borderColor: '#e5e7eb' }}
                    formatter={value => typeof value === 'number' ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) : value}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.875rem' }} align="right" verticalAlign="top" height={36}/>
                  {buildingWaterKeys.map((shortName, idx) => [
                    <Line
                      key={`${shortName}_revenue`}
                      type="monotone"
                      dataKey={`${shortName}_revenue`}
                      stroke={['#0EA5E9', '#059669', '#F59E42'][idx % 3]}
                      strokeWidth={2}
                      dot={false}
                      name={`${shortName} Revenue`}
                    />, 
                    <Line
                      key={`${shortName}_expense`}
                      type="monotone"
                      dataKey={`${shortName}_expense`}
                      stroke={['#F87171', '#F59E42', '#059669'][idx % 3]}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                      name={`${shortName} Expense`}
                    />
                  ])}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <div className="text-center text-text-muted py-10">Analytics Page Coming Soon...</div>}
      {activeTab === 'reports' && <div className="text-center text-text-muted py-10">Reports Page Coming Soon...</div>}
      {activeTab === 'notifications' && <div className="text-center text-text-muted py-10">Notifications Page Coming Soon...</div>}
    </div>
  );
};