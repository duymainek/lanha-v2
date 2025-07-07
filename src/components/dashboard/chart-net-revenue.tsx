import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getMonthlyNetRevenueLast12Months } from "@/data/supabase_data_source"

export function ChartNetRevenue() {
  const [loading, setLoading] = React.useState(true)
  const [chartData, setChartData] = React.useState<Array<{ month: string; NetRevenue: number }>>([])

  React.useEffect(() => {
    async function fetchData() {
      const netRevenue = await getMonthlyNetRevenueLast12Months()
      const data = Object.entries(netRevenue).map(([month, value]) => ({ month, NetRevenue: value }))
      setChartData(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Net Revenue Chart</CardTitle>
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

  const chartConfig = {
    NetRevenue: {
      label: "Net Revenue",
      color: "var(--color-netrevenue)",
    },
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Net Revenue</CardTitle>
        <CardDescription>Last 12 months</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillNetRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-netrevenue)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-netrevenue)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="NetRevenue"
              type="natural"
              fill="url(#fillNetRevenue)"
              stroke="var(--color-netrevenue)"
              strokeWidth={2}
              dot={true}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 