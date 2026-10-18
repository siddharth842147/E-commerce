"use client";

import * as React from "react";
import { TrendingUp, Calendar, ArrowUpRight, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface DashboardChartsProps {
  salesTrend: SalesPoint[];
  ordersByStatus: Record<string, number>;
  categoryBreakdown: { name: string; count: number }[];
}

export function DashboardCharts({
  salesTrend,
  ordersByStatus,
  categoryBreakdown,
}: DashboardChartsProps) {
  const [activeMetric, setActiveMetric] = React.useState<"revenue" | "orders">("revenue");
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // SVG dimensions
  const height = 220;
  const width = 600;
  const paddingX = 40;
  const paddingY = 30;

  const dataValues = salesTrend.map((d) => (activeMetric === "revenue" ? d.revenue : d.orders));
  const maxVal = Math.max(...dataValues, activeMetric === "revenue" ? 1000 : 5);
  const minVal = 0;

  // Compute points
  const points = salesTrend.map((d, i) => {
    const val = activeMetric === "revenue" ? d.revenue : d.orders;
    const x =
      salesTrend.length > 1
        ? paddingX + (i / (salesTrend.length - 1)) * (width - 2 * paddingX)
        : width / 2;
    const y = height - paddingY - (val / (maxVal || 1)) * (height - 2 * paddingY);
    return { x, y, data: d, val };
  });

  // Construct SVG path string
  const pathD = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = points[idx - 1];
    // Bezier control points for smooth line
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, "");

  // Area path for gradient background
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  const totalPeriodRevenue = salesTrend.reduce((sum, d) => sum + d.revenue, 0);
  const totalPeriodOrders = salesTrend.reduce((sum, d) => sum + d.orders, 0);

  // Status breakdown calculations
  const totalOrdersCount = Object.values(ordersByStatus).reduce((a, b) => a + b, 0) || 1;
  const statusColors: Record<string, string> = {
    delivered: "bg-emerald-500 text-emerald-700 dark:text-emerald-300",
    shipped: "bg-blue-500 text-blue-700 dark:text-blue-300",
    processing: "bg-amber-500 text-amber-700 dark:text-amber-300",
    confirmed: "bg-indigo-500 text-indigo-700 dark:text-indigo-300",
    pending: "bg-yellow-500 text-yellow-700 dark:text-yellow-300",
    cancelled: "bg-rose-500 text-rose-700 dark:text-rose-300",
    refunded: "bg-purple-500 text-purple-700 dark:text-purple-300",
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Sales Trend Chart (Span 2) */}
      <Card className="lg:col-span-2 shadow-sm border bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/20">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span>Sales & Order Trends</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Daily trend analysis for the past 14 days
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-background p-0.5">
            <Button
              variant={activeMetric === "revenue" ? "default" : "ghost"}
              size="xs"
              onClick={() => setActiveMetric("revenue")}
              className="text-xs h-7 px-2.5"
            >
              Revenue
            </Button>
            <Button
              variant={activeMetric === "orders" ? "default" : "ghost"}
              size="xs"
              onClick={() => setActiveMetric("orders")}
              className="text-xs h-7 px-2.5"
            >
              Orders
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight">
                {activeMetric === "revenue"
                  ? `₹${totalPeriodRevenue.toLocaleString("en-IN")}`
                  : `${totalPeriodOrders} Orders`}
              </div>
              <p className="text-xs text-muted-foreground">
                Total for recorded period
              </p>
            </div>
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div className="rounded-lg border bg-popover px-3 py-1.5 shadow-md text-right text-xs">
                <div className="font-semibold text-foreground">
                  {points[hoveredIndex].data.date}
                </div>
                <div className="text-primary font-medium">
                  {activeMetric === "revenue"
                    ? `₹${points[hoveredIndex].val.toLocaleString("en-IN")}`
                    : `${points[hoveredIndex].val} Orders`}
                </div>
              </div>
            )}
          </div>

          {/* Responsive SVG Chart */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-52 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = height - paddingY - pct * (height - 2 * paddingY);
                const labelVal = Math.round(minVal + pct * (maxVal - minVal));
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="currentColor"
                      opacity="0.5"
                    >
                      {activeMetric === "revenue" ? `₹${labelVal}` : labelVal}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              {areaD && (
                <path d={areaD} fill="url(#chartGradient)" />
              )}

              {/* Curve line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === i ? 5 : 3}
                    className="cursor-pointer transition-all fill-background stroke-primary"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {/* Invisible hit area */}
                  <rect
                    x={pt.x - 15}
                    y={0}
                    width={30}
                    height={height}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              ))}

              {/* X Axis dates */}
              {points.map((pt, i) => {
                // Show every 2nd or 3rd date label
                if (i % 2 !== 0 && i !== points.length - 1) return null;
                const formattedDate = pt.data.date.slice(5); // MM-DD
                return (
                  <text
                    key={i}
                    x={pt.x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="currentColor"
                    opacity="0.6"
                  >
                    {formattedDate}
                  </text>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Orders Status Breakdown & Categories (Span 1) */}
      <div className="flex flex-col gap-6">
        <Card className="shadow-sm border bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Order Status Distribution</span>
              <span className="text-xs font-normal text-muted-foreground">
                {totalOrdersCount} Total
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3">
            {Object.entries(ordersByStatus).map(([status, count]) => {
              const pct = Math.round((count / totalOrdersCount) * 100);
              const colorDot = statusColors[status] || "bg-muted text-muted-foreground";

              return (
                <div key={status} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 capitalize font-medium">
                      <span className={`size-2 rounded-full ${colorDot.split(" ")[0]}`} />
                      {status}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorDot.split(" ")[0]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Categories Breakdown */}
        {categoryBreakdown.length > 0 && (
          <Card className="shadow-sm border bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-semibold">
                Products by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-2.5">
              {categoryBreakdown.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground font-medium">{cat.name}</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground">
                    {cat.count} products
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
