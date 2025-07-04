"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart"

import { useEffect, useState } from "react"
import { fetchBuildingExpenses, fetchBuildingsFromSupabase, fetchInvoicesFromSupabase } from "@/data/supabase_data_source"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"

const buildingColors = [
  { base: "#1d4ed8", light: "#60a5fa" }, // Building 1: xanh dương đậm/nhạt
  { base: "#be185d", light: "#f472b6" }, // Building 2: hồng đậm/nhạt
  { base: "#15803d", light: "#4ade80" }, // Building 3: xanh lá đậm/nhạt
  // ... thêm nếu có nhiều building
];

export const description = "An interactive area chart"

export function WaterRevenueExpensesChart() {
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<Array<{
    month: string;
    [key: string]: string | number;
  }>>([])
  const [chartConfig, setChartConfig] = useState<ChartConfig>({})
  const [buildings, setBuildings] = useState<Array<{ id: number, name: string }>>([])
  const [buildingShortNames, setBuildingShortNames] = useState<string[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all")

  useEffect(() => {
    async function fetchExpenseChartData() {
      // Lấy invoices đã thanh toán 12 tháng gần nhất
      const [allInvoices, expenses] = await Promise.all([
        fetchInvoicesFromSupabase(),
        fetchBuildingExpenses()
      ]);
      // Lấy danh sách tòa nhà
      const buildings = await fetchBuildingsFromSupabase();
      setBuildings(buildings);
      const buildingNames = buildings.map(b => b.name);
      const buildingShortNames = buildingNames.map(name => name.split(/\s+/).map(w => w[0]?.toUpperCase() || '').join(''));
      setBuildingShortNames(buildingShortNames);
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      });
      // Lấy tất cả buildingId và tên rút gọn
      const buildingIds = buildings.map(b => b.id);
      // Group revenue điện theo building và tháng
      // Map: { [buildingId]: { [month]: total } }
      const revenueByBuilding: Record<number, Record<string, number>> = {};
      allInvoices.forEach(inv => {
        if (!inv.apartments || !inv.apartments.building_id) return;
        const buildingId = inv.apartments.building_id;
        const d = new Date(inv.issue_date);
        const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        // Lọc các item electricity
        const elecItems = (inv.invoice_items || []).filter(item => item.item_type === 'water');
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
          const expenseSum = expenses.filter(e => e.building_id === bid && e.expense_type === 'water' && e.created_at.startsWith(month)).reduce((sum, e) => sum + (e.amount || 0), 0);
          entry[`${shortName}_expense`] = expenseSum;
        });
        return entry;
      });
        


      setChartData(data);

    const config: ChartConfig = {};
    buildingShortNames.forEach((shortName, idx) => {
      // Revenue config
      config[`${shortName}_revenue`] = {
        label: `${buildingNames[idx]} Revenue`,
        theme: {
          light: buildingColors[idx % buildingColors.length].base,
          dark: buildingColors[idx % buildingColors.length].base
        }
      };
      // Expense config  
      config[`${shortName}_expense`] = {
        label: `${buildingNames[idx]} Expense`,
        theme: {
          light: buildingColors[idx % buildingColors.length].light,
          dark: buildingColors[idx % buildingColors.length].light
        }
      };
    });
    setChartConfig(config);
    setLoading(false);
    }
    fetchExpenseChartData();
  }, []);

  if (loading || chartData.length === 0 || Object.keys(chartConfig).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Water Revenue and Expenses</CardTitle>
          <CardDescription>Last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex aspect-video items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Water Revenue and Expenses</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </div>
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {buildings.map((b, idx) => (
                <SelectItem key={b.id} value={buildingShortNames[idx]}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              ticks={chartData.map(item => item.month)}
              tickFormatter={(value) => {
                return value;
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
           {Object.keys(chartConfig)
             .filter(key => chartData.some(item => key in item))
             .filter(key => selectedBuilding === "all" || key.startsWith(selectedBuilding))
             .map((key) => (
               <Line
                 key={key}
                 dataKey={key}
                 type="monotone"
                 strokeWidth={2}
                 stroke={chartConfig[key]?.theme?.light || 'var(--color-building1)'}
                 dot={true}
               />
             ))}
          </LineChart>
        </ChartContainer>
        <div className="pt-6">
        <div className="flex flex-wrap gap-2 px-4 pb-1">
          {Object.keys(chartConfig)
            .filter(key => chartData.some(item => key in item))
            .filter(key => selectedBuilding === "all" || key.startsWith(selectedBuilding))
            .map((key) => {
              let label = chartConfig[key]?.label;
              if (selectedBuilding !== "all") {
                if (key.endsWith("_revenue")) label = "Revenue";
                else if (key.endsWith("_expense")) label = "Expense";
              }
              return (
                <div key={key} className="flex items-center gap-1">
                  <span
                    className="inline-block w-3 h-1.5 rounded"
                    style={{ background: chartConfig[key]?.theme?.light || 'var(--color-building1)' }}
                  />
                  <small className="text-muted-foreground text-xs">{label}</small>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

