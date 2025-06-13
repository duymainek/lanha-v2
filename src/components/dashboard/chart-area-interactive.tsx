"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
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
  const [chartData, setChartData] = useState<Array<{ month: string; [key: string]: string | number }>>([])

  const [chartConfig, setChartConfig] = useState<ChartConfig>({})
  
  React.useEffect(() => {
    async function fetchData() {
      const revenueByBuilding = await getRevenueByBuildingId12Month();

      const chartData = Object.entries(revenueByBuilding).reduce((acc, [, { name, revenue }]) => {
        Object.entries(revenueByBuilding).forEach(([, { name }], idx) => {
          config[name] = {
            label: name,
            theme: {
              light: `var(--color-building${(idx % 6) + 1})`,
              dark: `var(--color-building${(idx % 6) + 1})`
            }
          };
        });
        return acc;
      }, [] as { month: string; [key: string]: string | number }[]);

      // Sort by month
      chartData.sort((a, b) => parseInt(a.month) - parseInt(b.month));

      setChartData(chartData)

      const config: ChartConfig = {};
      Object.entries(revenueByBuilding).forEach(([, { name }], idx) => {
        config[name] = {
          label: name,
          theme: {
            light: `var(--color-building${(idx % 2) + 1})`,
            dark: `var(--color-building${(idx % 6) + 1})`
          }
        };
      });

      setChartConfig(config)
    }

    fetchData()
  }, [])

  if(chartData.length === 0 || Object.keys(chartConfig).length === 0) {
    return <Skeleton className="h-full w-full" />
  }


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {loading || chartData.length === 0 || Object.keys(chartConfig).length === 0 ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer config={chartConfig}>
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  ticks={chartData.map(item => item.month)}
                  tickFormatter={value => value}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                {Object.keys(chartConfig)
                  .filter(key => chartData.some(item => key in item))
                  .map(key => (
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
          )}
        </div>
      </CardContent>
    </Card>
  
  )
}