import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { Categories } from "./pages/Categories";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Staff } from "./pages/Staff";
import { UsageEntry } from "./pages/UsageEntry";
import { UsageHistory } from "./pages/UsageHistory";

type Route =
  | "/"
  | "/categories"
  | "/products"
  | "/staff"
  | "/usage"
  | "/usage-history";

function getHashRoute(): Route {
  const hash = window.location.hash.replace("#", "") || "/";
  const valid: Route[] = [
    "/",
    "/categories",
    "/products",
    "/staff",
    "/usage",
    "/usage-history",
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
      case "/usage":
        return <UsageEntry />;
      case "/usage-history":
        return <UsageHistory />;
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
