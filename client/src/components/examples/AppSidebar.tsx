import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from '../AppSidebar';

export default function AppSidebarExample() {
  const handleItemSelect = (item: string) => {
    console.log(`Selected: ${item}`);
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-96 w-full border rounded-md overflow-hidden">
        <AppSidebar activeItem="dashboard" onItemSelect={handleItemSelect} />
        <div className="flex-1 p-4 bg-background">
          <p className="text-muted-foreground">Main content area</p>
        </div>
      </div>
    </SidebarProvider>
  );
}