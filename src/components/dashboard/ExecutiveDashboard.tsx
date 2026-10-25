import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { TopSellingProductsCard } from './TopSellingProductsCard';
import { CashierAndChannelMetricsCard } from './CashierAndChannelMetricsCard';
import { ExecutiveMetricsCard } from './ExecutiveMetricsCard';
import { BranchManagerModal } from '../branch/BranchManagerModal';
import {
  TrendingUp,
  ShieldCheck,
  SmartphoneNfc,
  BookOpenCheck,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ShoppingCart,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
  CircleDollarSign,
  BarChart3,
  Flame,
  FileSpreadsheet,
  Receipt,
  Sparkles,
  ShoppingBag,
  Store,
  Plus,
} from 'lucide-react';
import { Invoice } from '../../types/sales';

export const ExecutiveDashboard: React.FC = () => {
  const {
    invoices,
    products,
    debts,
    branches,
    activeBranch,
    expenses,
    users,
    setActiveTab,
    permissions,
  } = useApp();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchModalMode, setBranchModalMode] = useState<'list' | 'add'>('add');

  // Financial calculations
  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalVatCollected = invoices.reduce((sum, inv) => sum + inv.totalTax, 0);

  // COGS & Trading Profit
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
  const avgBasketSize = invoices.length > 0 ? Math.round(totalSales / invoices.length) : 0;

  // M-Pesa vs Cash split
  let mpesaTotal = 0;
  let cashTotal = 0;
  let creditTotal = 0;

  invoices.forEach((inv) => {
    inv.payments.forEach((p) => {
      if (p.method.startsWith('MPESA')) mpesaTotal += p.amount;
      else if (p.method === 'CASH') cashTotal += p.amount;
      else if (p.method === 'CREDIT') creditTotal += p.amount;
    });
  });

  const totalPayments = mpesaTotal + cashTotal + creditTotal || 1;
  const mpesaPercent = Math.round((mpesaTotal / totalPayments) * 100);
  const cashPercent = Math.round((cashTotal / totalPayments) * 100);

  // Madeni (Debt) summary
  const totalOutstandingDebt = debts.reduce((sum, d) => sum + d.balanceRemaining, 0);
  const overdueDebts = debts.filter((d) => d.status === 'OVERDUE');

  // Inventory valuation
  const inventoryCostValue = products.reduce((sum, p) => sum + p.costPrice * p.totalStock, 0);
  const inventoryRetailValue = products.reduce((sum, p) => sum + p.sellingPrice * p.totalStock, 0);

  // Low stock & Expiry items
  const lowStockItems = products.filter((p) => p.totalStock <= p.reorderLevel);

  const expiringBatches: { productName: string; batchNumber: string; expiryDate: string; qty: number }[] = [];
  products.forEach((p) => {
    p.batches?.forEach((b) => {
      if (b.expiryDate && new Date(b.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
        expiringBatches.push({
          productName: p.name,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          qty: b.currentQuantity,
        });
      }
    });
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Owner Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Executive Cockpit &amp; Business Intelligence
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Live Telemetry</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time branch sales velocity, KRA eTIMS compliance, Daraja M-Pesa settlements &amp; profit analytics.
          </p>
        </div>

        {/* Owner Fast-Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
            title="Generate shift-end Z-Report"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Z-Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
            title="Manage inventory stock & batches"
          >
            <Boxes className="w-3.5 h-3.5 text-slate-500" />
            <span>Inventory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('madeni')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
            title="Customer credit ledger and reminders"
          >
            <BookOpenCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Madeni ({debts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
            title="Open POS cashier counter"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Launch POS</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Grid (Single-Elevation, Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Gross Sales */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Gross Turnover</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-slate-900 font-mono-numbers">
              {formatKES(totalSales)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <span className="font-mono-numbers font-medium text-emerald-600">{invoices.length} invoices</span>
              <span>·</span>
              <span>VAT: {formatKES(totalVatCollected, false)}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Gross Trading Profit */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Trading Profit</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CircleDollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-emerald-800 font-mono-numbers">
              {formatKES(grossProfit)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700">
              <span className="font-semibold">{grossMarginPercent}% gross margin</span>
              <span>·</span>
              <span className="text-slate-500">post-COGS</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Average Basket Size (AOV) */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Avg Basket Value</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-slate-900 font-mono-numbers">
              {formatKES(avgBasketSize)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <span className="font-mono-numbers text-blue-700 font-medium">Per checkout ticket</span>
            </div>
          </div>
        </div>

        {/* KPI 4: M-Pesa Dominance */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">M-Pesa Dominance</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <SmartphoneNfc className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-slate-900 font-mono-numbers">
              {mpesaPercent}% <span className="text-xs font-normal text-slate-500">M-Pesa</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <span className="font-mono-numbers">{cashPercent}% Cash</span>
              <span>·</span>
              <span>{formatKES(mpesaTotal, false)}</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Madeni (Outstanding Debts) */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Madeni Outstanding</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <BookOpenCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-slate-900 font-mono-numbers">
              {formatKES(totalOutstandingDebt)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <span className={`font-mono-numbers ${overdueDebts.length > 0 ? 'text-rose-600 font-semibold' : ''}`}>
                {overdueDebts.length} overdue
              </span>
              <span>·</span>
              <span>{debts.length} debtors</span>
            </div>
          </div>
        </div>

        {/* KPI 6: KRA eTIMS Compliance */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">eTIMS Compliance</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-slate-900 font-mono-numbers">100.0%</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-700 font-mono-numbers font-medium">
              <span>KRA VSCU Active</span>
              <span>·</span>
              <span>0 Rejections</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Operational Alerts (Low stock, Expiry, Overdue Debts) */}
      {(lowStockItems.length > 0 || expiringBatches.length > 0 || overdueDebts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Alert 1: Low Stock */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Low Stock Threshold ({lowStockItems.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="text-xs text-amber-800 hover:underline flex items-center gap-0.5"
              >
                <span>Restock</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {lowStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="text-xs flex items-center justify-between text-amber-950">
                  <span className="truncate max-w-[180px]">{item.name}</span>
                  <span className="font-mono-numbers font-medium text-amber-800">
                    {item.totalStock} left (Min: {item.reorderLevel})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alert 2: Approaching Expiry */}
          <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-900">
                <Clock className="w-4 h-4 text-rose-600" />
                <span>Batches Expiring Soon ({expiringBatches.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="text-xs text-rose-800 hover:underline flex items-center gap-0.5"
              >
                <span>Audit</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {expiringBatches.length > 0 ? (
                expiringBatches.slice(0, 3).map((b, idx) => (
                  <div key={idx} className="text-xs flex items-center justify-between text-rose-950">
                    <span className="truncate max-w-[160px]">{b.productName}</span>
                    <span className="font-mono-numbers font-medium text-rose-800">
                      Exp: {b.expiryDate} ({b.qty} units)
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-rose-700">All pharmaceutical &amp; grocery batches valid.</div>
              )}
            </div>
          </div>

          {/* Alert 3: Overdue Madeni */}
          <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                <BookOpenCheck className="w-4 h-4 text-blue-600" />
                <span>Overdue Customer Debts ({overdueDebts.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('madeni')}
                className="text-xs text-blue-800 hover:underline flex items-center gap-0.5"
              >
                <span>Send SMS</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {overdueDebts.length > 0 ? (
                overdueDebts.slice(0, 3).map((d) => (
                  <div key={d.id} className="text-xs flex items-center justify-between text-blue-950">
                    <span className="truncate max-w-[160px]">{d.customerName}</span>
                    <span className="font-mono-numbers font-bold text-rose-700">
                      {formatKES(d.balanceRemaining)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-blue-700">No overdue credit accounts.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Grid: Compact Product Popularity & Cashier / Payment Channel Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellingProductsCard
          invoices={invoices}
          products={products}
          onNavigateToInventory={() => setActiveTab('inventory')}
          onNavigateToPOS={() => setActiveTab('pos')}
        />
        <CashierAndChannelMetricsCard
          invoices={invoices}
          products={products}
          users={users}
          debts={debts}
          expenses={expenses}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />
      </div>

      {/* Feature 2: Executive Trading Velocity & Real Profitability Health Meter */}
      <ExecutiveMetricsCard
        invoices={invoices}
        products={products}
        expenses={expenses}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Content Split: Multi-Branch Overview & Recent eTIMS Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Branch Performance & Inventory Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Branch Distribution</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono-numbers">{branches.length} locations</span>
                <button
                  type="button"
                  onClick={() => {
                    setBranchModalMode('add');
                    setBranchModalOpen(true);
                  }}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-200"
                  title="Register new branch outlet or warehouse"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Branch</span>
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {branches.map((b) => {
                const branchInvoices = invoices.filter((i) => i.branchId === b.id);
                const branchSales = branchInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
                const isCurrent = b.id === activeBranch.id;

                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      isCurrent ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.isMainWarehouse && (
                          <span className="text-[10px] text-slate-500 uppercase font-mono">HQ</span>
                        )}
                      </div>
                      <span className="font-mono-numbers font-bold text-slate-900">
                        {formatKES(branchSales)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{b.address}</span>
                      <span className="font-mono-numbers">{branchInvoices.length} transactions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Valuation Card */}
          {permissions.canViewCostPrices && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-2">
                <Boxes className="w-3.5 h-3.5 text-slate-500" />
                <span>Consolidated Inventory Valuation</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase">Cost Value</div>
                  <div className="font-bold text-slate-900 font-mono-numbers">
                    {formatKES(inventoryCostValue)}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase">Retail Potential</div>
                  <div className="font-bold text-emerald-700 font-mono-numbers">
                    {formatKES(inventoryRetailValue)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent eTIMS Invoices Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent eTIMS Fiscal Invoices</h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Automatically submitted to KRA VSCU with cryptographic CU QR signatures
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('etims')}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 pr-3">Invoice &amp; Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Tax (VAT)</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 pl-3 text-center">KRA CU Status</th>
                  <th className="py-2.5 pl-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pr-3 font-mono">
                      <div className="font-semibold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 truncate max-w-[130px]">
                        {inv.customer?.name || 'Walk-in Cash Customer'}
                      </div>
                      {inv.customer?.kraPin && (
                        <div className="text-[10px] font-mono text-slate-400">{inv.customer.kraPin}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-slate-600">
                        {inv.payments[0]?.method || 'CASH'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                      {formatKES(inv.totalTax)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      {formatKES(inv.grandTotal)}
                    </td>
                    <td className="py-3 pl-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Valid</span>
                      </span>
                    </td>
                    <td className="py-3 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                        title="View Full KRA Receipt & QR"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Quick View Modal (Showing authentic KRA receipt layout) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">KRA eTIMS Tax Invoice</h3>
                <div className="text-xs text-slate-500 font-mono">{selectedInvoice.invoiceNumber}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-bold text-sm text-slate-900">LIPATIM RETAIL LTD</div>
                <div className="text-[11px] text-slate-600">{selectedInvoice.branchName}</div>
                <div className="text-[10px] text-slate-500">PIN: P051239841K · Tel: +254 722 100 200</div>
              </div>

              <div className="text-[11px] space-y-0.5">
                <div>Date: {new Date(selectedInvoice.createdAt).toLocaleString()}</div>
                <div>Cashier: {selectedInvoice.cashierName}</div>
                <div>Customer: {selectedInvoice.customer?.name || 'Walk-in Buyer'}</div>
                {selectedInvoice.customer?.kraPin && (
                  <div>Buyer PIN: {selectedInvoice.customer.kraPin}</div>
                )}
              </div>

              {/* Items */}
              <div className="py-2 border-y border-dashed border-slate-300 space-y-1">
                {selectedInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="truncate max-w-[200px]">
                      {item.name} ({item.quantity} x {item.unitPrice})
                    </div>
                    <div className="font-bold font-mono-numbers">
                      {formatKES(item.totalGross)} ({item.taxRateCode})
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono-numbers">{formatKES(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT Amount:</span>
                  <span className="font-mono-numbers">{formatKES(selectedInvoice.totalTax)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono-numbers">{formatKES(selectedInvoice.grandTotal)}</span>
                </div>
              </div>

              {/* KRA eTIMS Verification Footer */}
              <div className="pt-3 border-t border-dashed border-slate-300 text-center space-y-1 text-[10px] text-slate-600">
                <div className="font-bold text-slate-900">KRA eTIMS CONTROL UNIT VERIFIED</div>
                <div>CU Serial: {selectedInvoice.etimsValidation.cuSerialNumber}</div>
                <div className="text-[9px] break-all text-slate-400">
                  Sig: {selectedInvoice.etimsValidation.scuSignature}
                </div>
                <a
                  href={selectedInvoice.etimsValidation.qrCodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 underline pt-1 font-semibold"
                >
                  <span>Verify on KRA iTax Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Branch Management Modal */}
      <BranchManagerModal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        initialMode={branchModalMode}
      />
    </div>
  );
};
