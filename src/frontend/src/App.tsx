import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { Attendance } from "./pages/Attendance";
import { BossReport } from "./pages/BossReport";
import { CashLedger } from "./pages/CashLedger";
import { Categories } from "./pages/Categories";
import { Charts } from "./pages/Charts";
import { Dashboard } from "./pages/Dashboard";
import { Equipment } from "./pages/Equipment";
import PackTracker from "./pages/PackTracker";
import { Products } from "./pages/Products";
import { Staff } from "./pages/Staff";
import { UsageEntry } from "./pages/UsageEntry";
import { UsageHistory } from "./pages/UsageHistory";

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

function getHashRoute(): Route {
  const hash = window.location.hash.replace("#", "") || "/";
  const valid: Route[] = [
    "/",
    "/categories",
    "/products",
    "/staff",
    "/attendance",
    "/equipment",
    "/pack-tracker",
    "/usage",
    "/usage-history",
    "/charts",
    "/cash-ledger",
    "/boss-report",
  ];
  return valid.includes(hash as Route) ? (hash as Route) : "/";
}

export default function App() {
  const [route, setRoute] = useState<Route>(getHashRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (to: Route) => {
    window.location.hash = to;
    setRoute(to);
  };

  const renderPage = () => {
    switch (route) {
      case "/":
        return <Dashboard />;
      case "/categories":
        return <Categories />;
      case "/products":
        return <Products />;
      case "/staff":
        return <Staff />;
      case "/attendance":
        return <Attendance />;
      case "/equipment":
        return <Equipment />;
      case "/pack-tracker":
        return <PackTracker />;
      case "/usage":
        return <UsageEntry />;
      case "/usage-history":
        return <UsageHistory />;
      case "/charts":
        return <Charts />;
      case "/cash-ledger":
        return <CashLedger />;
      default:
        return <Dashboard />;
    }
  };

  if (route === "/boss-report") {
    return (
      <>
        <Toaster richColors position="top-right" />
        <BossReport />
      </>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <AppLayout currentRoute={route} navigate={navigate}>
        {renderPage()}
      </AppLayout>
    </>
  );
}
