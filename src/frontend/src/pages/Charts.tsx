import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useProducts, useStaff, useUsageRecords } from "../hooks/useQueries";

const BAR_COLORS = [
  "#e91e8c",
  "#7c3aed",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

interface RaceEntry {
  name: string;
  total: number;
  color: string;
}

const ANIMATION_DURATION = 1200;
const ANIMATION_STEPS = 40;

function useRaceAnimation(entries: RaceEntry[]) {
  const [animated, setAnimated] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>(
    {},
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const startRace = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimated(false);

    // Reset all to 0
    const zeros: Record<string, number> = {};
    for (const e of entries) zeros[e.name] = 0;
    setAnimatedValues(zeros);

    const stepDuration = ANIMATION_DURATION / ANIMATION_STEPS;
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      const progress = step / ANIMATION_STEPS;
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic

      const next: Record<string, number> = {};
      for (const e of entries) {
        next[e.name] = Math.round(e.total * eased);
      }
      setAnimatedValues(next);

      if (step >= ANIMATION_STEPS) {
        clearInterval(interval);
        setAnimated(true);
        setIsAnimating(false);
      }
    }, stepDuration);
  }, [entries, isAnimating]);

  return { animated, animatedValues, isAnimating, startRace };
}

// Custom recharts bar shape that shows medal for top ranks
interface CustomBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  rank?: number;
}

function CustomBarShape(props: CustomBarShapeProps) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill = "#e91e8c",
    rank = 99,
  } = props;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(0, height)}
        fill={fill}
        rx={3}
      />
      {rank === 1 && height > 10 && (
        <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={16}>
          🏆
        </text>
      )}
      {rank === 2 && height > 10 && (
        <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={14}>
          🥈
        </text>
      )}
      {rank === 3 && height > 10 && (
        <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={14}>
          🥉
        </text>
      )}
    </g>
  );
}

interface ChartTabProps {
  entries: RaceEntry[];
  totalQty: number;
  tabType: "products" | "staff";
}

function ChartTab({ entries, totalQty, tabType }: ChartTabProps) {
  const { animated, animatedValues, isAnimating, startRace } =
    useRaceAnimation(entries);

  const chartData = useMemo(() => {
    return entries.map((e, i) => ({
      name: e.name.length > 12 ? `${e.name.slice(0, 11)}…` : e.name,
      fullName: e.name,
      value: animated || isAnimating ? (animatedValues[e.name] ?? 0) : e.total,
      color: e.color,
      rank: i + 1,
    }));
  }, [entries, animated, isAnimating, animatedValues]);

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-body">
              Total Quantity Used (All Time)
            </p>
            <p className="text-2xl font-bold font-display text-foreground">
              {totalQty.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-body">
              Top {tabType === "products" ? "Products" : "Staff"}
            </p>
            <p className="text-2xl font-bold font-display text-foreground">
              {entries.length}
            </p>
          </div>
        </div>
        <Button
          data-ocid={`charts.${tabType}.start_race.button`}
          onClick={startRace}
          disabled={isAnimating || entries.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-body"
        >
          <Trophy size={15} className="mr-2" />
          {isAnimating ? "Racing..." : "Start Race 🏁"}
        </Button>
      </div>

      {/* Chart */}
      {entries.length === 0 ? (
        <div
          data-ocid={`charts.${tabType}.empty_state`}
          className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm"
        >
          <Trophy size={40} className="mb-3 opacity-20" />
          <p>No usage data available yet.</p>
          <p className="text-xs mt-1">
            Start adding usage entries to see the chart.
          </p>
        </div>
      ) : (
        <div
          data-ocid={`charts.${tabType}.chart_point`}
          className="w-full"
          style={{ height: 360 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 28, right: 16, left: 8, bottom: 48 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
                formatter={(value, _name, props) => [
                  `${value} units`,
                  props.payload?.fullName ?? props.payload?.name,
                ]}
              />
              <Bar
                dataKey="value"
                shape={(barProps: unknown) => {
                  const p = barProps as Record<string, unknown>;
                  return (
                    <CustomBarShape
                      x={p.x as number}
                      y={p.y as number}
                      width={p.width as number}
                      height={p.height as number}
                      fill={p.color as string}
                      rank={p.rank as number}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Leaderboard */}
      {entries.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 font-body">
            Leaderboard
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entries.slice(0, 6).map((e, i) => (
              <div
                key={e.name}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card"
              >
                <span className="text-lg w-6 text-center flex-shrink-0">
                  {i === 0
                    ? "🏆"
                    : i === 1
                      ? "🥈"
                      : i === 2
                        ? "🥉"
                        : `#${i + 1}`}
                </span>
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: e.color }}
                />
                <span className="text-sm font-medium text-foreground flex-1 truncate font-body">
                  {e.name}
                </span>
                <span className="text-sm font-bold text-foreground font-body flex-shrink-0">
                  {e.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Charts() {
  const { data: products = [] } = useProducts();
  const { data: staff = [] } = useStaff();
  const { data: usageRecords = [] } = useUsageRecords();

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products],
  );
  const staffMap = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s.name])),
    [staff],
  );

  // Top 10 products by total usage
  const productEntries = useMemo<RaceEntry[]>(() => {
    const totals: Record<number, number> = {};
    for (const r of usageRecords) {
      totals[r.productId] = (totals[r.productId] ?? 0) + r.quantity;
    }
    return Object.entries(totals)
      .map(([id, total]) => ({
        name: productMap[Number(id)] ?? `Product #${id}`,
        total,
        color: "",
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((e, i) => ({ ...e, color: BAR_COLORS[i % BAR_COLORS.length] }));
  }, [usageRecords, productMap]);

  // Top 10 staff by total usage
  const staffEntries = useMemo<RaceEntry[]>(() => {
    const totals: Record<number, number> = {};
    for (const r of usageRecords) {
      totals[r.staffId] = (totals[r.staffId] ?? 0) + r.quantity;
    }
    return Object.entries(totals)
      .map(([id, total]) => ({
        name: staffMap[Number(id)] ?? `Staff #${id}`,
        total,
        color: "",
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((e, i) => ({ ...e, color: BAR_COLORS[i % BAR_COLORS.length] }));
  }, [usageRecords, staffMap]);

  const totalProductQty = useMemo(
    () => usageRecords.reduce((s, r) => s + r.quantity, 0),
    [usageRecords],
  );
  const totalStaffQty = totalProductQty;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Charts & Analytics
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-body">
          Visualize product and staff usage — hit "Start Race" to animate the
          competition
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">
            Usage Competition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products">
            <TabsList className="mb-6">
              <TabsTrigger
                value="products"
                data-ocid="charts.products.tab"
                className="font-body"
              >
                📦 Products
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                data-ocid="charts.staff.tab"
                className="font-body"
              >
                👤 Staff
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <ChartTab
                entries={productEntries}
                totalQty={totalProductQty}
                tabType="products"
              />
            </TabsContent>

            <TabsContent value="staff">
              <ChartTab
                entries={staffEntries}
                totalQty={totalStaffQty}
                tabType="staff"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
