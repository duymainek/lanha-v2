"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { useState } from "react"
import { getRevenueByBuildingId12Month } from "@/data/supabase_data_source"
import { Skeleton } from "@/components/ui/skeleton"

export const description = "An interactive area chart"

export function ChartRevenueByBuildings() {
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<Array<{
    month: string;
    [key: string]: string | number;
  }>>([])

  const [chartConfig, setChartConfig] = useState<ChartConfig>({})
  
  React.useEffect(() => {
    async function fetchData() {
      const revenueByBuilding = await getRevenueByBuildingId12Month();

      const chartData = Object.entries(revenueByBuilding).reduce((acc, [, { name, revenue }]) => {
        Object.entries(revenue).forEach(([monthKey, amount]) => {
          const month = monthKey.split('-')[1];
          const existingMonth = acc.find(item => item.month === month);
          
          if (existingMonth) {
            existingMonth[name] = amount;
          } else {
            acc.push({
              month,
              [name]: amount
            });
          }
        });
        return acc;
      }, [] as Array<{
        month: string;
        [key: string]: string | number;
      }>);

      // Sort by month
      chartData.sort((a, b) => parseInt(a.month) - parseInt(b.month));

      setChartData(chartData)

      const config: ChartConfig = {};
      Object.entries(revenueByBuilding).forEach(([, { name }]) => {
        config[name] = {
          label: name,
          theme: {
            light: `var(--chart-${Object.keys(config).length + 1})`,
            dark: `var(--chart-${Object.keys(config).length + 1})`
          }
        };
      });
      setChartConfig(config);

      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading || chartData.length === 0 || Object.keys(chartConfig).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Line Chart - Multiple</CardTitle>
          <CardDescription>January - June 2024</CardDescription>
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
        <CardTitle>Revenue by building</CardTitle>
        <CardDescription>Last 12 months</CardDescription>
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
           {Object.keys(chartConfig).filter(key => chartData.some(item => key in item)).map((key) =>{
            return (
              <Line
                data={chartData}
                dataKey={key}
                type="monotone"
                strokeWidth={2}
                stroke={chartConfig[key]?.theme?.light || 'var(--color-building1)'}
                dot={true}
              />
             );
           })}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}