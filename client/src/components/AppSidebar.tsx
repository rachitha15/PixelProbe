import { Activity, BarChart3, Filter, Settings, Users, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  activeItem?: string;
  onItemSelect?: (item: string) => void;
}

export default function AppSidebar({ activeItem = "dashboard", onItemSelect }: AppSidebarProps) {
  const menuItems = [
    {
      title: "Dashboard",
      url: "dashboard",
      icon: BarChart3,
    },
    {
      title: "Live Events",
      url: "events",
      icon: Activity,
    },
    {
      title: "Customers", 
      url: "customers",
      icon: Users,
    },
    {
      title: "Analytics",
      url: "analytics", 
      icon: Zap,
    },
    {
      title: "Filters",
      url: "filters",
      icon: Filter,
    },
    {
      title: "Settings",
      url: "settings",
      icon: Settings,
    },
  ];

  const handleItemClick = (url: string) => {
    onItemSelect?.(url);
    console.log(`Navigating to ${url}`);
  };

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-lg" data-testid="text-app-title">Pixel Analytics</h2>
            <p className="text-xs text-muted-foreground">Shopify Events</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    data-active={activeItem === item.url}
                  >
                    <button 
                      onClick={() => handleItemClick(item.url)}
                      className="w-full"
                      data-testid={`button-nav-${item.url}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}