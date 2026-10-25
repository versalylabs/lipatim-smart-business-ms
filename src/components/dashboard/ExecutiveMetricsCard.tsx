import React from 'react';
import { formatKES } from '../../utils/kenya';
import { Invoice } from '../../types/sales';
import { Product } from '../../types/inventory';
import { Expense } from '../../types/expense';
import {
  TrendingUp,
  Clock,
  CircleDollarSign,
  PieChart,
  Zap,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Receipt,
  Boxes,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExecutiveMetricsCardProps {
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  onNavigateToTab: (tab: 'pos' | 'inventory' | 'madeni' | 'expenses' | 'reports') => void;
}

export const ExecutiveMetricsCard: React.FC<ExecutiveMetricsCardProps> = ({
  invoices,
  products,
  expenses,
  onNavigateToTab,
}) => {
  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  // 1. Calculate Cost of Goods Sold (COGS) & Real Profitability
  let totalCogs = 0;
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = prod?.costPrice || 0;
      totalCogs += unitCost * item.quantity;
    });
  });

  const grossProfit = Math.max(0, totalSales - totalCogs);
  const grossMarginPercent = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netEstimatedProfit = grossProfit - totalExpenses;
  const netMarginPercent = totalSales > 0 ? Math.round((netEstimatedProfit / totalSales) * 100) : 0;

  // 2. Average Basket Size / Order Value
  const orderCount = invoices.length;
  const avgBasketSize = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;
  const totalUnitsSold = invoices.reduce(
    (sum, inv) => sum + inv.items.reduce((s, it) => s + it.quantity, 0),
    0
  );
  const avgUnitsPerBasket = orderCount > 0 ? (totalUnitsSold / orderCount).toFixed(1) : '0';

  // 3. Hourly / Peak Rush Time Buckets
  const timeBuckets = [
    { label: '8AM - 10AM', name: 'Early Open', minHour: 8, maxHour: 10, sales: 0, orders: 0 },
    { label: '10AM - 12PM', name: 'Midday', minHour: 10, maxHour: 12, sales: 0, orders: 0 },
    { label: '12PM - 2PM', name: 'Lunch Rush', minHour: 12, maxHour: 14, sales: 0, orders: 0 },
    { label: '2PM - 4PM', name: 'Afternoon', minHour: 14, maxHour: 16, sales: 0, orders: 0 },
    { label: '4PM - 6PM', name: 'Evening Rush', minHour: 16, maxHour: 18, sales: 0, orders: 0 },
    { label: '6PM - 8PM', name: 'Late Peak', minHour: 18, maxHour: 20, sales: 0, orders: 0 },
    { label: '8PM+', name: 'Night Shift', minHour: 20, maxHour: 24, sales: 0, orders: 0 },
  ];

  invoices.forEach((inv) => {
    const d = new Date(inv.createdAt);
    const hour = d.getHours();
    const bucket =
      timeBuckets.find((b) => hour >= b.minHour && hour < b.maxHour) ||
      timeBuckets[timeBuckets.length - 1];
    bucket.sales += inv.grandTotal;
    bucket.orders += 1;
  });

  const maxBucketSales = Math.max(...timeBuckets.map((b) => b.sales), 1);
  const peakBucket = [...timeBuckets].sort((a, b) => b.sales - a.sales)[0];

  // 4. Goods Department / Category Sales Mix
  const categorySalesMap = new Map<string, { name: string; revenue: number; quantity: number }>();
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const catName = prod?.categoryName || 'General Goods';
      const existing = categorySalesMap.get(catName) || { name: catName, revenue: 0, quantity: 0 };
      existing.revenue += item.totalGross;
      existing.quantity += item.quantity;
      categorySalesMap.set(catName, existing);
    });
  });

  const categoryBreakdown = Array.from(categorySalesMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );
  const totalCatRevenue = categoryBreakdown.reduce((sum, c) => sum + c.revenue, 0) || 1;

  // Category palette
  const categoryColors = [
    'bg-emerald-600 text-emerald-800',
    'bg-blue-600 text-blue-800',
    'bg-indigo-600 text-indigo-800',
    'bg-amber-600 text-amber-800',
    'bg-rose-600 text-rose-800',
    'bg-purple-600 text-purple-800',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Widget 1: Peak Rush Velocity & Hourly Traffic Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Trading Velocity &amp; Rush Hours
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hourly POS checkout traffic and peak customer trading periods.
                </p>
              </div>
            </div>

            {/* Busiest Window Pill */}
            {peakBucket && peakBucket.sales > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Zap className="w-3 h-3 text-amber-600" />
                <span>Peak: {peakBucket.label}</span>
              </span>
            )}
          </div>

          {/* Vertical Bar Chart */}
          <div className="mt-4 pt-2">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-end h-32 px-1 border-b border-slate-200 pb-2">
              {timeBuckets.map((bucket, idx) => {
                const heightPercent = Math.max(
                  8,
                  Math.round((bucket.sales / maxBucketSales) * 100)
                );
                const isPeak = peakBucket?.label === bucket.label && bucket.sales > 0;

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                      <div>{bucket.name} ({bucket.label})</div>
                      <div className="font-bold text-emerald-400 font-mono-numbers">
                        {formatKES(bucket.sales)}
                      </div>
                      <div className="text-slate-300">{bucket.orders} orders</div>
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        isPeak
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-xs'
                          : bucket.sales > 0
                          ? 'bg-slate-300 hover:bg-slate-400'
                          : 'bg-slate-100'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels below bars */}
            <div className="grid grid-cols-7 gap-1 text-[9px] text-slate-500 font-medium text-center mt-2">
              {timeBuckets.map((b, idx) => (
                <div key={idx} className="truncate" title={b.label}>
                  <div className="font-bold text-slate-700">{b.label.split(' - ')[0]}</div>
                  <div className="text-[8px] text-slate-400 hidden sm:block">{b.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic Statistics Strip */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase">Avg Basket Size</span>
            <div className="font-bold text-slate-900 font-mono-numbers mt-0.5">
              {formatKES(avgBasketSize)}
            </div>
          </div>

          <div className="p-2 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase">Items / Ticket</span>
            <div className="font-bold text-slate-900 font-mono-numbers mt-0.5">
              {avgUnitsPerBasket} units
            </div>
          </div>

          <div className="p-2 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase">Active Counter</span>
            <div className="font-bold text-emerald-700 font-mono-numbers mt-0.5">
              {orderCount} tickets
            </div>
          </div>
        </div>
      </div>

      {/* Widget 2: Business Owner's Real Profit & P&L Health Meter */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CircleDollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Profitability &amp; Financial Health
                </h3>
                <p className="text-[11px] text-slate-500">
                  Revenue vs Stock Replacement Cost (COGS) vs Operating Expenses.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab('reports')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
            >
              <span>Full P&amp;L</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Breakdown Rows */}
          <div className="mt-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
                <span className="font-semibold text-slate-700">Gross Sales Revenue</span>
              </div>
              <span className="font-mono-numbers font-bold text-slate-900">
                {formatKES(totalSales)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-700">Cost of Goods Sold (COGS)</span>
              </div>
              <span className="font-mono-numbers font-semibold text-amber-900">
                - {formatKES(totalCogs)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="font-bold text-emerald-950">Gross Trading Profit</span>
              </div>
              <div className="text-right">
                <span className="font-mono-numbers font-extrabold text-emerald-800">
                  {formatKES(grossProfit)}
                </span>
                <span className="text-[10px] text-emerald-700 ml-1.5 font-semibold">
                  ({grossMarginPercent}% margin)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-semibold text-slate-700">Operational Expenses (Opex)</span>
              </div>
              <span className="font-mono-numbers font-semibold text-rose-800">
                - {formatKES(totalExpenses)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-lg shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-bold text-xs">Net Retained Operating Profit</div>
                  <div className="text-[10px] text-slate-400">After stock cost &amp; operational expenses</div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono-numbers font-black text-sm ${
                    netEstimatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatKES(netEstimatedProfit)}
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  {netMarginPercent}% net margin
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Contribution Distribution */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Department Sales Mix ({categoryBreakdown.length})</span>
            </span>
            <span className="text-[10px] text-slate-500">Share of turnover</span>
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden">
            {categoryBreakdown.map((cat, idx) => {
              const pct = Math.round((cat.revenue / totalCatRevenue) * 100);
              const colorClass = categoryColors[idx % categoryColors.length].split(' ')[0];

              return (
                <div
                  key={cat.name}
                  className={`${colorClass} h-full transition-all`}
                  style={{ width: `${Math.max(2, pct)}%` }}
                  title={`${cat.name}: ${formatKES(cat.revenue)} (${pct}%)`}
                />
              );
            })}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
            {categoryBreakdown.slice(0, 4).map((cat, idx) => {
              const pct = Math.round((cat.revenue / totalCatRevenue) * 100);
              const colorClass = categoryColors[idx % categoryColors.length].split(' ')[0];

              return (
                <div
                  key={cat.name}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
                  <span className="font-medium truncate max-w-[90px]">{cat.name}</span>
                  <span className="font-bold text-slate-900 font-mono-numbers">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
