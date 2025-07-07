import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, CartesianGrid, XAxis, Line } from "recharts"
import { getNetByBuildingId12Month } from "@/data/supabase_data_source"

export function ChartNetByBuildings() {
  const [loading, setLoading] = React.useState(true)
  const [chartData, setChartData] = React.useState<Array<{ month: string; [key: string]: string | number }>>([])
  const [chartConfig, setChartConfig] = React.useState<Record<string, { label: string; theme: { light: string; dark: string } }>>({})

  React.useEffect(() => {
    async function fetchData() {
      const netByBuilding = await getNetByBuildingId12Month()
      // Chuyển đổi dữ liệu về dạng [{ month, building1: value, building2: value, ... }]
      const data = Object.entries(netByBuilding).reduce((acc, [, { name, net }]) => {
        Object.entries(net).forEach(([monthKey, amount]) => {
          const month = monthKey.split("-")[1]
          const existingMonth = acc.find(item => item.month === month)
          if (existingMonth) {
            existingMonth[name] = amount
          } else {
            acc.push({ month, [name]: amount })
          }
        })
        return acc
      }, [] as Array<{ month: string; [key: string]: string | number }>)
      // Sort by month
      data.sort((a, b) => parseInt(a.month) - parseInt(b.month))
      setChartData(data)
      // Tạo config cho từng building
      const config: Record<string, { label: string; theme: { light: string; dark: string } }> = {}
      Object.entries(netByBuilding).forEach(([, { name }]) => {
        config[name] = {
          label: name,
          theme: {
            light: `var(--chart-${Object.keys(config).length + 1})`,
            dark: `var(--chart-${Object.keys(config).length + 1})`
          }
        }
      })
      setChartConfig(config)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading || chartData.length === 0 || Object.keys(chartConfig).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Net by Building</CardTitle>
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
        <CardTitle>Net by Building</CardTitle>
        <CardDescription>Last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
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
            {Object.keys(chartConfig).filter(key => chartData.some(item => key in item)).map((key) => (
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
      </CardContent>
    </Card>
  )
} 