import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useLocation } from "react-router-dom"
import { useState } from "react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { QuickCreateService } from "@/services/QuickCreateService"

function QuickCreateDropdown() {
  const [open, setOpen] = useState(false)
  // Placeholder: gọi service khi chọn action
  const handleAction = (type: "invoice" | "tenant" | "expenses") => {
    QuickCreateService.open(type, {
      title: `Quick Create ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      fields: [], // Sẽ bổ sung sau
      onSave: async (values) => { console.log("Quick create submit", type, values) },
    })
    setOpen(false)
  }
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          className="justify-start w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear gap-2 px-3 text-left" 
          size="sm"
        >
          <IconCirclePlusFilled />
          <span className="hidden md:inline">Quick Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[130px]">
        <DropdownMenuItem onClick={() => handleAction("invoice")} className="flex items-center gap-2">
          Create Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("tenant")} className="flex items-center gap-2">
          Create Tenant
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("expenses")} className="flex items-center gap-2">
          Create Expenses
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NavMain({
  items,
  LinkComponent,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
  LinkComponent?: React.ElementType
}) {
  const location = useLocation()
  const currentPath = location.pathname
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <QuickCreateDropdown />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {LinkComponent ? (
                <SidebarMenuButton asChild tooltip={item.title} isActive={currentPath === item.url}>
                  <LinkComponent to={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </LinkComponent>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton tooltip={item.title} isActive={currentPath === item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
