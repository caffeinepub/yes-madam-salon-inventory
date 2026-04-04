import { cn } from "@/lib/utils";
import {
  BarChart2,
  CalendarCheck,
  ClipboardList,
  Copy,
  History,
  LayoutDashboard,
  Package,
  Package2,
  Scissors,
  Tag,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Route =
  | "/"
  | "/categories"
  | "/products"
  | "/staff"
  | "/attendance"
  | "/equipment"
  | "/pack-tracker"
  | "/usage"
  | "/usage-history"
  | "/charts"
  | "/cash-ledger"
  | "/boss-report";

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
  {
    to: "/charts",
    label: "Charts",
    icon: <BarChart2 size={18} />,
    ocid: "sidebar.charts_link",
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
    to: "/attendance",
    label: "Attendance",
    icon: <CalendarCheck size={18} />,
    ocid: "sidebar.attendance_link",
  },
  {
    to: "/equipment",
    label: "Equipment",
    icon: <Wrench size={18} />,
    ocid: "sidebar.equipment_link",
  },
  {
    to: "/pack-tracker",
    label: "Pack Tracker",
    icon: <Package2 size={18} />,
    ocid: "sidebar.pack_tracker_link",
  },
  {
    to: "/cash-ledger",
    label: "Cash Ledger",
    icon: <Wallet size={18} />,
    ocid: "sidebar.cash_ledger_link",
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  navigate: (to: Route) => void;
}

function LiveClock() {
  const [timeStr, setTimeStr] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-IN", { hour12: false });
  });

  useEffect(() => {
    const id = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString("en-IN", { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      data-ocid="sidebar.clock.panel"
      className="mx-3 mb-3 rounded-lg px-3 py-3 text-center"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <p className="font-mono text-xl font-bold tracking-widest text-white leading-none">
        {timeStr}
      </p>
      <p className="text-xs text-white/50 mt-1.5 leading-tight">{dateStr}</p>
    </div>
  );
}

function copyBossLink() {
  const url = `${window.location.origin}${window.location.pathname}#/boss-report`;
  navigator.clipboard
    .writeText(url)
    .then(() => {
      toast.success("Link copy ho gaya! Boss ya kisi bhi device pe bhej do 📋");
    })
    .catch(() => {
      toast.error(`Link copy nahi hua, manually copy karo: ${url}`);
    });
}

export function AppLayout({
  children,
  currentRoute,
  navigate,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r border-sidebar-border"
        style={{ backgroundColor: "#000000" }}
      >
        {/* Brand */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "#222" }}>
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
                  isActive ? "text-white" : "text-white/80 hover:text-white",
                )}
                style={isActive ? { backgroundColor: "#1a1a1a" } : undefined}
              >
                <span
                  className={cn(
                    "flex-shrink-0 text-white",
                    isActive ? "opacity-100" : "opacity-70",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Live Clock */}
        <LiveClock />

        {/* Other Device / Boss report link button */}
        <div className="px-3 pb-2">
          <button
            type="button"
            data-ocid="sidebar.boss_report.button"
            onClick={copyBossLink}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-bold transition-colors"
            style={{ backgroundColor: "#ff1493", color: "white" }}
          >
            <Copy size={15} />
            Other Device 📋
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t" style={{ borderColor: "#222" }}>
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
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
