import { UnpaidInvoiceSection } from "@/components/dashboard/unpaid_invoice_section"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { ElectricityRevenueExpensesChart } from "@/components/dashboard/electricity_revenue_expesnses_chart"
import { WaterRevenueExpensesChart } from "@/components/dashboard/water_revenue_expenses_chart"
import { RevenueSection } from "@/components/dashboard/section-cards"
import { ChartRevenueByBuildings } from "@/components/dashboard/chart-area-interactive"
import { QuickCreateSheet } from "@/components/quick-create-sheet"

export default function DashboardPage() {
  return (
    <>
      <QuickCreateSheet />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <RevenueSection />
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <ChartRevenueByBuildings />
                    </div>
                    <div className="lg:col-span-1">
                      <UnpaidInvoiceSection />
                    </div>
                  </div>
                </div>
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="lg:col-span-1">
                      <ElectricityRevenueExpensesChart />
                    </div>
                    <div className="lg:col-span-1">
                      <WaterRevenueExpensesChart />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
