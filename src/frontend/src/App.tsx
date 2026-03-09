import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { Attendance } from "./pages/Attendance";
import { CashLedger } from "./pages/CashLedger";
import { Categories } from "./pages/Categories";
import { Charts } from "./pages/Charts";
import { Dashboard } from "./pages/Dashboard";
import { Equipment } from "./pages/Equipment";
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
  | "/usage"
  | "/usage-history"
  | "/charts"
  | "/cash-ledger";

function getHashRoute(): Route {
  const hash = window.location.hash.replace("#", "") || "/";
  const valid: Route[] = [
    "/",
    "/categories",
    "/products",
    "/staff",
    "/attendance",
    "/equipment",
    "/usage",
    "/usage-history",
    "/charts",
    "/cash-ledger",
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

  return (
    <>
      <Toaster richColors position="top-right" />
      <AppLayout currentRoute={route} navigate={navigate}>
        {renderPage()}
      </AppLayout>
    </>
  );
}
