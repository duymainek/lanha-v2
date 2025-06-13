import * as React from "react"
import { Link } from "react-router-dom"
import {
  IconBuilding,
  IconCash,
  IconDashboard,
  IconHome,
  IconInnerShadowTop,
  IconNotification,
  IconReceipt,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavOther } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Là Nhà",
    email: "info@lanha.vn",
    avatar: "/avatar.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Buildings",
      url: "/buildings",
      icon: IconBuilding,
    },
    {
      title: "Rooms",
      url: "/rooms",
      icon: IconHome,
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: IconReceipt,
    },
    {
      title: "Tenants",
      url: "/tenants",
      icon: IconUsers,
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: IconCash,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: IconNotification,
    },
  ],
  other: [
    {
      name: "Settings",
      url: "/setting",
      icon: IconSettings,
    },  
  ],
  
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Là Nhà.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain.map(item => ({ ...item, url: item.url }))} LinkComponent={Link} />
        <NavOther items={data.other.map(item => ({ ...item, url: item.url }))} LinkComponent={Link} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
