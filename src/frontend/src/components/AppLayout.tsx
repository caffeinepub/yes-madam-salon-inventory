import { cn } from "@/lib/utils";
import {
  ClipboardList,
  History,
  LayoutDashboard,
  Package,
  Scissors,
  Tag,
  Users,
} from "lucide-react";

type Route =
  | "/"
  | "/categories"
  | "/products"
  | "/staff"
  | "/usage"
  | "/usage-history";

interface NavItem {
  to: Route;
  label: string;
  icon: React.ReactNode;
  ocid: string;
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    ocid: "sidebar.dashboard_link",
  },
  {
    to: "/categories",
    label: "Categories",
    icon: <Tag size={18} />,
    ocid: "sidebar.categories_link",
  },
  {
    to: "/products",
    label: "Products",
    icon: <Package size={18} />,
    ocid: "sidebar.products_link",
  },
  {
    to: "/staff",
    label: "Staff",
    icon: <Users size={18} />,
    ocid: "sidebar.staff_link",
  },
  {
    to: "/usage",
    label: "Usage Entry",
    icon: <ClipboardList size={18} />,
    ocid: "sidebar.usage_link",
  },
  {
    to: "/usage-history",
    label: "Usage History",
    icon: <History size={18} />,
    ocid: "sidebar.usage_history_link",
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
  currentRoute: Route;
  navigate: (to: Route) => void;
}

export function AppLayout({
  children,
  currentRoute,
  navigate,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <Scissors size={18} className="text-sidebar-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-sidebar-foreground leading-tight">
                Yes Madam
              </p>
              <p className="text-xs text-sidebar-foreground/50 mt-0.5 font-body">
                Inventory
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentRoute === item.to;
            return (
              <button
                key={item.to}
                type="button"
                data-ocid={item.ocid}
                onClick={() => navigate(item.to)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors font-body",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex-shrink-0",
                    isActive ? "text-sidebar-primary" : "opacity-80",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/40 text-center font-body">
            © {new Date().getFullYear()}{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sidebar-foreground/60 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
