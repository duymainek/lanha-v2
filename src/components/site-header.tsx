import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useLocation, Link } from "react-router-dom"
import * as React from "react"

const breadcrumbNameMap: Record<string, string> = {
  dashboard: "Dashboard",
  buildings: "Buildings",
  rooms: "Rooms",
  invoices: "Invoices",
  tenants: "Tenants",
  expenses: "Expenses",
  notifications: "Notifications",
  setting: "Settings",
  documents: "Documents",
}

export function SiteHeader({ roomName }: { roomName?: string }) {
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter(Boolean)
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathnames.map((segment, idx) => {
              const url = "/" + pathnames.slice(0, idx + 1).join("/")
              const isLast = idx === pathnames.length - 1
              return (
                <React.Fragment key={url}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast
                      ? <BreadcrumbPage>
                          {pathnames[0] === "rooms" && pathnames.length === 2 && roomName
                            ? roomName
                            : breadcrumbNameMap[segment] || segment}
                        </BreadcrumbPage>
                      : (
                        <BreadcrumbLink asChild>
                          <Link to={url}>
                            {breadcrumbNameMap[segment] || segment}
                          </Link>
                        </BreadcrumbLink>
                      )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
