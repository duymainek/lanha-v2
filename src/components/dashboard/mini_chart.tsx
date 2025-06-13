"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

export const description = "A line chart"

export function MiniChart({ title, description, data, config, trending, trendUp }: { title: string, description: string, data: any, config: any, trending: number, trendUp: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
            <Badge variant="outline">
              {trendUp ? <IconTrendingUp /> : <IconTrendingDown />}
              {trending.toFixed(2)} %
            </Badge>
          </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              top: 12,
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
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="cost"
              type="natural"
              stroke="var(--color-cost)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending {trendUp ? "up" : "down"} by {trending.toFixed(2)} % this month 
          {trendUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
