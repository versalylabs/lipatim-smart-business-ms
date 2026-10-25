import React, { useState } from 'react';
import { formatKES } from '../../utils/kenya';
import { Product } from '../../types/inventory';
import { Invoice } from '../../types/sales';
import {
  Flame,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  Package,
} from 'lucide-react';

interface TopSellingProductsCardProps {
  invoices: Invoice[];
  products: Product[];
  onNavigateToInventory: () => void;
  onNavigateToPOS: () => void;
}

type RankingMetric = 'volume' | 'revenue' | 'profit';

export const TopSellingProductsCard: React.FC<TopSellingProductsCardProps> = ({
  invoices,
  products,
  onNavigateToInventory,
  onNavigateToPOS,
}) => {
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>('volume');
  const [viewLimit, setViewLimit] = useState<number>(5);

  // Aggregate product sales from all invoices
  const productSalesMap = new Map<
    string,
    {
      productId: string;
      name: string;
      barcode: string;
      totalQuantity: number;
      totalRevenue: number;
      transactionCount: number;
    }
  >();

  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const existing = productSalesMap.get(item.productId);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.totalGross;
        existing.transactionCount += 1;
      } else {
        productSalesMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          barcode: item.barcode,
          totalQuantity: item.quantity,
          totalRevenue: item.totalGross,
          transactionCount: 1,
        });
      }
    });
  });

  const aggregatedList = Array.from(productSalesMap.values()).map((ps) => {
    const prod = products.find((p) => p.id === ps.productId);
    const costPrice = prod?.costPrice || 0;
    const sellingPrice =
      prod?.sellingPrice || (ps.totalQuantity > 0 ? ps.totalRevenue / ps.totalQuantity : 0);
    const currentStock = prod?.totalStock ?? 0;
    const reorderLevel = prod?.reorderLevel ?? 10;
    const categoryName = prod?.categoryName || 'General';
    const estimatedCost = costPrice * ps.totalQuantity;
    const estimatedProfit = Math.max(0, ps.totalRevenue - estimatedCost);
    const profitMarginPercent =
      ps.totalRevenue > 0 ? (estimatedProfit / ps.totalRevenue) * 100 : 0;

    return {
      ...ps,
      costPrice,
      sellingPrice,
      currentStock,
      reorderLevel,
      categoryName,
      estimatedProfit,
      profitMarginPercent,
    };
  });

  // Sort by selected metric
  const sortedProducts = [...aggregatedList].sort((a, b) => {
    if (rankingMetric === 'volume') return b.totalQuantity - a.totalQuantity;
    if (rankingMetric === 'revenue') return b.totalRevenue - a.totalRevenue;
    return b.estimatedProfit - a.estimatedProfit;
  });

  const displayedProducts = sortedProducts.slice(0, viewLimit);

  // Maximum value for proportional inline progress bar
  const maxMetricValue =
    sortedProducts.length > 0
      ? rankingMetric === 'volume'
        ? sortedProducts[0].totalQuantity
        : rankingMetric === 'revenue'
        ? sortedProducts[0].totalRevenue
        : sortedProducts[0].estimatedProfit
      : 1;

  const totalSoldUnits = aggregatedList.reduce((sum, p) => sum + p.totalQuantity, 0);
  const totalSoldRevenue = aggregatedList.reduce((sum, p) => sum + p.totalRevenue, 0);

  // Check if any top 5 bestseller is below reorder level
  const topBestsellerStockAlerts = sortedProducts.slice(0, 5).filter(
    (p) => p.currentStock <= p.reorderLevel
  );

  if (invoices.length === 0 || aggregatedList.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3 min-h-[320px]">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Flame className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900">No Sales Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Once transactions are rung up at the POS counter, live popularity rankings will appear here.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToPOS}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Launch POS Counter</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header & Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Product Popularity Ranking
              </h2>
              <p className="text-[11px] text-slate-500">Live POS velocity &amp; sales volume</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setViewLimit(viewLimit === 5 ? 8 : 5)}
              className="px-2 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
              title="Toggle list count"
            >
              Top {viewLimit === 5 ? '5' : '8'}
            </button>
          </div>
        </div>

        {/* Metric Switcher Pills */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setRankingMetric('volume')}
            className={`flex-1 py-1 rounded-md transition-all text-center ${
              rankingMetric === 'volume'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Units Sold
          </button>
          <button
            type="button"
            onClick={() => setRankingMetric('revenue')}
            className={`flex-1 py-1 rounded-md transition-all text-center ${
              rankingMetric === 'revenue'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Revenue
          </button>
          <button
            type="button"
            onClick={() => setRankingMetric('profit')}
            className={`flex-1 py-1 rounded-md transition-all text-center ${
              rankingMetric === 'profit'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Profit Margin
          </button>
        </div>
      </div>

      {/* Stockout Alert Tag if any top seller is low */}
      {topBestsellerStockAlerts.length > 0 && (
        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate text-[11px]">
              <span className="font-bold">Stockout Risk:</span> {topBestsellerStockAlerts[0].name} (
              {topBestsellerStockAlerts[0].currentStock} left)
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToInventory}
            className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline shrink-0 ml-2"
          >
            Restock
          </button>
        </div>
      )}

      {/* High-Density Compact Ranked Products List */}
      <div className="space-y-1.5">
        {displayedProducts.map((p, idx) => {
          const rank = idx + 1;
          const currentVal =
            rankingMetric === 'volume'
              ? p.totalQuantity
              : rankingMetric === 'revenue'
              ? p.totalRevenue
              : p.estimatedProfit;

          const percentage = Math.max(6, Math.round((currentVal / (maxMetricValue || 1)) * 100));
          const isLowStock = p.currentStock <= p.reorderLevel;

          const medal =
            rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

          return (
            <div
              key={p.productId}
              className="group p-2 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                {/* Left: Medal, Name, Category */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 flex items-center justify-center font-bold text-xs shrink-0 ${
                      rank <= 3 ? 'text-sm' : 'text-[11px] text-slate-500 font-mono'
                    }`}
                  >
                    {medal}
                  </span>
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-slate-900 truncate block text-xs group-hover:text-emerald-700 transition-colors">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {p.categoryName} · {p.transactionCount} orders
                    </span>
                  </div>
                </div>

                {/* Right: Numbers and Meter */}
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900 font-mono-numbers text-xs">
                    {rankingMetric === 'volume' && `${p.totalQuantity} units`}
                    {rankingMetric === 'revenue' && formatKES(p.totalRevenue)}
                    {rankingMetric === 'profit' && formatKES(p.estimatedProfit)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono-numbers">
                    {rankingMetric === 'volume' && formatKES(p.totalRevenue)}
                    {rankingMetric === 'revenue' && `${p.totalQuantity} units`}
                    {rankingMetric === 'profit' && `${p.profitMarginPercent.toFixed(0)}% margin`}
                  </div>
                </div>
              </div>

              {/* Inline Progress Track */}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      rank === 1
                        ? 'bg-emerald-600'
                        : rank === 2
                        ? 'bg-blue-600'
                        : rank === 3
                        ? 'bg-amber-600'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono-numbers text-slate-400 shrink-0">
                  {percentage}%
                </span>
                {isLowStock && (
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded shrink-0">
                    Low: {p.currentStock}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Total & Link */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="font-mono-numbers text-[11px]">
          Sold: <span className="font-bold text-slate-800">{totalSoldUnits}</span> units (
          <span className="font-bold text-emerald-700">{formatKES(totalSoldRevenue)}</span>)
        </div>
        <button
          type="button"
          onClick={onNavigateToInventory}
          className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] flex items-center gap-0.5"
        >
          <span>Catalog</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
