import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Printer, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  useCategories,
  useProducts,
  useStaff,
  useUsageRecords,
} from "../hooks/useQueries";

export function BossReport() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: usageRecords = [],
    isLoading: usageRecordsLoading,
    refetch: refetchUsage,
  } = useUsageRecords();
  const {
    data: products = [],
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useProducts();
  const { data: staff = [] } = useStaff();
  const { data: categories = [] } = useCategories();

  const isLoading = usageRecordsLoading || productsLoading;

  const handleRefresh = () => {
    refetchUsage();
    refetchProducts();
    setRefreshKey((k) => k + 1);
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const staffMap = new Map(staff.map((s) => [s.id, s.name]));
  const productMap = new Map(products.map((p) => [p.id, p]));

  const todayUsage = usageRecords.filter((r) => r.date === selectedDate);

  const sortedProducts = [...products].sort((a, b) => {
    const aStock =
      typeof a.currentStock === "bigint"
        ? Number(a.currentStock)
        : a.currentStock;
    const bStock =
      typeof b.currentStock === "bigint"
        ? Number(b.currentStock)
        : b.currentStock;
    return aStock - bStock;
  });

  const formattedDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const lastUpdated = new Date().toLocaleTimeString("en-IN", { hour12: true });

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: "#000000" }}
      data-ocid="boss_report.page"
    >
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6 no-print">
            <button
              type="button"
              onClick={() => {
                window.location.hash = "/";
              }}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              data-ocid="boss_report.back_button"
            >
              <ArrowLeft size={16} />
              App par wapas jao
            </button>
            <Button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-white font-bold"
              style={{ backgroundColor: "#ff1493", border: "none" }}
              data-ocid="boss_report.print_button"
            >
              <Printer size={16} />
              Print / PDF
            </Button>
          </div>

          <div className="text-center mb-6">
            <div
              className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-3"
              style={{ backgroundColor: "#ff1493", color: "white" }}
            >
              YES MADAM SALON
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Aaj Ki Report
            </h1>
            <p className="text-white/50 text-sm">{formattedDate}</p>
          </div>

          {/* Date selector */}
          <div className="flex items-center justify-center gap-3 no-print">
            <label htmlFor="boss-report-date" className="text-white/60 text-sm">
              Kisi aur din ki report dekho:
            </label>
            <input
              id="boss-report-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white border"
              style={{ backgroundColor: "#1a1a1a", borderColor: "#333" }}
              data-ocid="boss_report.date_input"
            />
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4"
            data-ocid="boss_report.loading_state"
          >
            <Loader2
              size={36}
              className="animate-spin"
              style={{ color: "#ff1493" }}
            />
            <p className="text-white/50 text-sm">Data load ho raha hai...</p>
          </div>
        ) : (
          <>
            {/* Section 1: Today's Usage */}
            <section className="mb-10" data-ocid="boss_report.usage_section">
              <div
                className="flex items-center gap-3 mb-4 pb-3 border-b"
                style={{ borderColor: "#222" }}
              >
                <div
                  className="w-1 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#ff1493" }}
                />
                <h2 className="text-lg font-bold text-white">
                  Aaj Kya Kya Gaya{" "}
                  <span className="text-sm font-normal text-white/40">
                    (Today's Usage)
                  </span>
                </h2>
                <span
                  className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#ff1493", color: "white" }}
                >
                  {todayUsage.length} entries
                </span>
              </div>

              {todayUsage.length === 0 ? (
                <div
                  className="rounded-xl py-10 text-center"
                  style={{
                    backgroundColor: "#0d0d0d",
                    border: "1px solid #1a1a1a",
                  }}
                  data-ocid="boss_report.usage_empty_state"
                >
                  <p className="text-white/30 text-sm">Aaj koi entry nahi.</p>
                </div>
              ) : (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid #1a1a1a" }}
                >
                  <table
                    className="w-full text-sm"
                    data-ocid="boss_report.usage_table"
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#0d0d0d" }}>
                        <th className="px-4 py-3 text-left text-white/50 font-medium">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-white/50 font-medium">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-white/50 font-medium">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-white/50 font-medium">
                          Staff
                        </th>
                        <th className="px-4 py-3 text-right text-white/50 font-medium">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-white/50 font-medium">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayUsage.map((record, idx) => {
                        const product = productMap.get(record.productId);
                        const staffName = staffMap.get(record.staffId) || "—";
                        const categoryName =
                          categoryMap.get(record.categoryId) || "—";
                        return (
                          <tr
                            key={String(record.id)}
                            data-ocid={`boss_report.usage_table.row.${idx + 1}`}
                            className="border-t transition-colors hover:bg-white/5"
                            style={{ borderColor: "#1a1a1a" }}
                          >
                            <td className="px-4 py-3 text-white/30">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-white font-medium">
                              {product?.name ||
                                `Product #${String(record.productId)}`}
                            </td>
                            <td className="px-4 py-3 text-white/60">
                              {categoryName}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: "#1a0a12",
                                  color: "#ff1493",
                                }}
                              >
                                {staffName}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-white font-bold">
                              {String(record.quantity)}
                            </td>
                            <td className="px-4 py-3 text-right text-white/40 font-mono text-xs">
                              {record.time || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Section 2: Remaining Stock */}
            <section className="mb-10" data-ocid="boss_report.stock_section">
              <div
                className="flex items-center gap-3 mb-4 pb-3 border-b"
                style={{ borderColor: "#222" }}
              >
                <div
                  className="w-1 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#ff1493" }}
                />
                <h2 className="text-lg font-bold text-white">
                  Bacha Hua Stock{" "}
                  <span className="text-sm font-normal text-white/40">
                    (Remaining Stock)
                  </span>
                </h2>
                <span className="ml-auto text-xs text-white/30 font-medium">
                  Kam stock pehle
                </span>
              </div>

              {sortedProducts.length === 0 ? (
                <div
                  className="rounded-xl py-10 text-center"
                  style={{
                    backgroundColor: "#0d0d0d",
                    border: "1px solid #1a1a1a",
                  }}
                  data-ocid="boss_report.stock_empty_state"
                >
                  <p className="text-white/30 text-sm">
                    Koi product nahi mila.
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid #1a1a1a" }}
                >
                  <table
                    className="w-full text-sm"
                    data-ocid="boss_report.stock_table"
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#0d0d0d" }}>
                        <th className="px-4 py-3 text-left text-white/50 font-medium">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-white/50 font-medium">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-white/50 font-medium">
                          Category
                        </th>
                        <th className="px-4 py-3 text-right text-white/50 font-medium">
                          Opening
                        </th>
                        <th className="px-4 py-3 text-right text-white/50 font-medium">
                          Bacha (Current)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProducts.map((product, idx) => {
                        const categoryName =
                          categoryMap.get(product.categoryId) || "—";
                        const current =
                          typeof product.currentStock === "bigint"
                            ? Number(product.currentStock)
                            : product.currentStock;
                        const opening =
                          typeof product.openingStock === "bigint"
                            ? Number(product.openingStock)
                            : product.openingStock;
                        const isLow = current <= opening * 0.2;
                        const isVeryLow = current <= 5;
                        return (
                          <tr
                            key={String(product.id)}
                            data-ocid={`boss_report.stock_table.row.${idx + 1}`}
                            className="border-t transition-colors hover:bg-white/5"
                            style={{ borderColor: "#1a1a1a" }}
                          >
                            <td className="px-4 py-3 text-white/30">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-white font-medium">
                              {product.name}
                            </td>
                            <td className="px-4 py-3 text-white/60">
                              {categoryName}
                            </td>
                            <td className="px-4 py-3 text-right text-white/40">
                              {opening}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className="font-bold text-base"
                                style={{
                                  color: isVeryLow
                                    ? "#ff4444"
                                    : isLow
                                      ? "#ffaa00"
                                      : "#00cc66",
                                }}
                              >
                                {current}
                              </span>
                              {product.unit ? (
                                <span className="text-white/30 text-xs ml-1">
                                  {product.unit}
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Stock legend */}
              <div className="flex items-center gap-5 mt-3 px-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#ff4444" }}
                  />
                  <span className="text-xs text-white/30">Bahut kam (≤5)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#ffaa00" }}
                  />
                  <span className="text-xs text-white/30">
                    Kam (20% se neeche)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#00cc66" }}
                  />
                  <span className="text-xs text-white/30">Theek hai</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-6 border-t"
          style={{ borderColor: "#1a1a1a" }}
          key={refreshKey}
        >
          <p className="text-xs text-white/30">
            Last updated: <span className="text-white/50">{lastUpdated}</span>
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors no-print"
            data-ocid="boss_report.refresh_button"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
