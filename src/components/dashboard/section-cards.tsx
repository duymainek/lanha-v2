import { useEffect, useState } from "react"
import { MiniChart } from "@/components/dashboard/mini_chart"
import {
  getMonthlyRevenueLast12Months,
  getMonthlyUtilityRevenueLast12Months,
} from "@/data/supabase_data_source"

import type { ChartConfig } from "@/components/ui/chart"
import { convertMonthNumberToName } from "@/utils/date_utils"
import { Skeleton } from "@/components/ui/skeleton"

export function RevenueSection() {
  const [loading, setLoading] = useState(true)
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; cost: number }[]>([])
  const [electricity, setElectricity] = useState<{ month: string; cost: number }[]>([])
  const [water, setWater] = useState<{ month: string; cost: number }[]>([])
  const [additionalFees, setAdditionalFees] = useState<{ month: string; cost: number }[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [
        monthlyRevenueRaw,
        monthlyUtilityRaw,
      ] = await Promise.all([
        getMonthlyRevenueLast12Months(),
        getMonthlyUtilityRevenueLast12Months(),
      ])
  
      // Lấy 6 tháng cuối cùng
      const sixLastMonthRevenue = Object.entries(monthlyRevenueRaw).slice(-6)
      setMonthlyRevenue(
        sixLastMonthRevenue.map(([month, cost]) => ({ month: month.split('-')[1], cost }))
      )
  
      const sixLastMonthUtility = Object.entries(monthlyUtilityRaw).slice(-6)
      const utilityData = sixLastMonthUtility.map(([month, value]) => ({
        month: month.split('-')[1],
        electricity: value.electricity,
        water: value.water,
        additional_fees: value.additional_fees
      }))

      setElectricity(utilityData.map(({ month, electricity }) => ({ month, cost: electricity })))
      setWater(utilityData.map(({ month, water }) => ({ month, cost: water })))
      setAdditionalFees(utilityData.map(({ month, additional_fees }) => ({ month, cost: additional_fees })))

      setLoading(false)
    }
    fetchData()
  }, [])

  if (
    loading ||
    monthlyRevenue.length < 6 ||
    electricity.length < 6 ||
    water.length < 6 ||
    additionalFees.length < 6
  ) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[300px]">
            <Skeleton className="h-full w-full" />
          </div>
        ))}
      </div>
    )
  }

  const getChartConfig = (data: { month: string; cost: number }[]) => {
    const isTrendUp = data[5].cost > data[4].cost
    return {
      cost: {
        label: "Revenue:",
        color: isTrendUp ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)", // green-500 : red-500
      },
    } satisfies ChartConfig
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <MiniChart 
        title="Revenue" 
        description={`${convertMonthNumberToName(monthlyRevenue[0].month)} - ${convertMonthNumberToName(monthlyRevenue[5].month)} ${new Date().getFullYear()}`} 
        data={monthlyRevenue} 
        config={getChartConfig(monthlyRevenue)} 
        trending={(monthlyRevenue[5].cost - monthlyRevenue[4].cost) / monthlyRevenue[4].cost * 100} 
        trendUp={monthlyRevenue[5].cost > monthlyRevenue[4].cost}
      />
      <MiniChart 
        title="Elec Revenue" 
        description={`${convertMonthNumberToName(electricity[0].month)} - ${convertMonthNumberToName(electricity[5].month)} ${new Date().getFullYear()}`} 
        data={electricity} 
        config={getChartConfig(electricity)} 
        trending={(electricity[5].cost - electricity[4].cost) / electricity[4].cost * 100} 
        trendUp={electricity[5].cost > electricity[4].cost}
      />
      <MiniChart 
        title="Water Revenue" 
        description={`${convertMonthNumberToName(water[0].month)} - ${convertMonthNumberToName(water[5].month)} ${new Date().getFullYear()}`} 
        data={water} 
        config={getChartConfig(water)} 
        trending={(water[5].cost - water[4].cost) / water[4].cost * 100} 
        trendUp={water[5].cost > water[4].cost}
      />
      <MiniChart 
        title="Additional Fees" 
        description={`${convertMonthNumberToName(additionalFees[0].month)} - ${convertMonthNumberToName(additionalFees[5].month)} ${new Date().getFullYear()}`} 
        data={additionalFees} 
        config={getChartConfig(additionalFees)} 
        trending={(additionalFees[5].cost - additionalFees[4].cost) / additionalFees[4].cost * 100} 
        trendUp={additionalFees[5].cost > additionalFees[4].cost}
      />
    </div>
  )
}
