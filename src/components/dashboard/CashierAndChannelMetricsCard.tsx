import React, { useState } from 'react';
import { formatKES } from '../../utils/kenya';
import { Product } from '../../types/inventory';
import { Invoice, DebtRecord } from '../../types/sales';
import { User } from '../../types/user';
import { Expense } from '../../types/expense';
import {
  Users,
  Wallet,
  AlertOctagon,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Banknote,
  Smartphone,
  CreditCard,
  PackageX,
} from 'lucide-react';

interface CashierAndChannelMetricsCardProps {
  invoices: Invoice[];
  products: Product[];
  users: User[];
  debts: DebtRecord[];
  expenses: Expense[];
  onNavigateToTab: (tab: any) => void;
}

type SubTab = 'cashiers' | 'tenders' | 'deadstock';

export const CashierAndChannelMetricsCard: React.FC<CashierAndChannelMetricsCardProps> = ({
  invoices,
  products,
  users,
  debts,
  expenses,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('cashiers');

  // 1. Cashier Shift Performance Breakdown
  const cashierSalesMap = new Map<
    string,
    { name: string; orderCount: number; totalSales: number }
  >();

  invoices.forEach((inv) => {
    const cashierName = inv.cashierName || 'Cashier';
    const existing = cashierSalesMap.get(cashierName);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSales += inv.grandTotal;
    } else {
      cashierSalesMap.set(cashierName, {
        name: cashierName,
        orderCount: 1,
        totalSales: inv.grandTotal,
      });
    }
  });

  const totalInvoiceSales = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const cashierList = Array.from(cashierSalesMap.values()).sort(
    (a, b) => b.totalSales - a.totalSales
  );

  // 2. Payment Channel Breakdown & Live Cash Drawer Till Float
  let totalMpesa = 0;
  let totalCash = 0;
  let totalDebt = 0;

  invoices.forEach((inv) => {
    if (inv.payments && inv.payments.length > 0) {
      inv.payments.forEach((p) => {
        if (p.method === 'CASH') {
          totalCash += p.amount;
        } else if (p.method.startsWith('MPESA')) {
          totalMpesa += p.amount;
        } else if (p.method === 'CREDIT') {
          totalDebt += p.amount;
        } else {
          totalMpesa += p.amount;
        }
      });
    } else {
      // Fallback if payments array is empty
      if (inv.paymentStatus === 'UNPAID') {
        totalDebt += inv.grandTotal;
      } else {
        totalCash += inv.grandTotal;
      }
    }
  });

  // Calculate cash payouts/expenses paid in cash
  const cashExpenses = expenses
    .filter((e) => e.paymentMethod === 'CASH')
    .reduce((sum, e) => sum + e.amount, 0);

  const estimatedCashFloat = Math.max(0, totalCash - cashExpenses);

  const totalRecordedTenders = totalMpesa + totalCash + totalDebt;
  const mpesaPercent = totalRecordedTenders > 0 ? (totalMpesa / totalRecordedTenders) * 100 : 0;
  const cashPercent = totalRecordedTenders > 0 ? (totalCash / totalRecordedTenders) * 100 : 0;
  const debtPercent = totalRecordedTenders > 0 ? (totalDebt / totalRecordedTenders) * 100 : 0;

  // 3. Dead Stock / Capital Tied-up (Products with stock > 0 but 0 recent sales)
  const productSoldIds = new Set<string>();
  invoices.forEach((inv) => inv.items.forEach((item) => productSoldIds.add(item.productId)));

  const deadStockProducts = products
    .filter((p) => !productSoldIds.has(p.id) && p.totalStock > 0)
    .map((p) => ({
      ...p,
      tiedUpCapital: p.costPrice * p.totalStock,
    }))
    .sort((a, b) => b.tiedUpCapital - a.tiedUpCapital)
    .slice(0, 5);

  const totalTiedUpCapital = deadStockProducts.reduce((sum, p) => sum + p.tiedUpCapital, 0);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header & Sub-Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Store Operations &amp; Cash Desk
              </h2>
              <p className="text-[11px] text-slate-500">
                Staff sales, payment channels &amp; till float
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setActiveSubTab('cashiers')}
              className={`px-2 py-1 rounded-md transition-all ${
                activeSubTab === 'cashiers'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cashiers
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('tenders')}
              className={`px-2 py-1 rounded-md transition-all ${
                activeSubTab === 'tenders'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Till &amp; Channels
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('deadstock')}
              className={`px-2 py-1 rounded-md transition-all ${
                activeSubTab === 'deadstock'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Slow Movers
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Cashier Sales Shift Leaderboard */}
      {activeSubTab === 'cashiers' && (
        <div className="space-y-2">
          {cashierList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No sales logged by staff members yet today.
            </div>
          ) : (
            cashierList.slice(0, 4).map((cashier, idx) => {
              const contribution =
                totalInvoiceSales > 0 ? (cashier.totalSales / totalInvoiceSales) * 100 : 0;
              return (
                <div
                  key={cashier.name}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                        {cashier.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{cashier.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {cashier.orderCount} customer {cashier.orderCount === 1 ? 'sale' : 'sales'} rung up
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono-numbers text-slate-900">
                        {formatKES(cashier.totalSales)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-mono-numbers font-medium">
                        {contribution.toFixed(0)}% of store total
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.max(5, contribution)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Payment Channels & Live Cash Drawer Till Float */}
      {activeSubTab === 'tenders' && (
        <div className="space-y-3">
          {/* Estimated Cash Float Pill */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-700" />
              <div>
                <div className="text-[11px] font-bold text-emerald-950">
                  Estimated Cash in Drawer
                </div>
                <div className="text-[10px] text-emerald-700">
                  Cash collected minus cash expenses
                </div>
              </div>
            </div>
            <div className="font-bold font-mono-numbers text-sm text-emerald-900">
              {formatKES(estimatedCashFloat)}
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium text-slate-700">M-Pesa (Till / Paybill / STK)</span>
              </div>
              <div className="text-right">
                <span className="font-bold font-mono-numbers text-slate-900">
                  {formatKES(totalMpesa)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono-numbers ml-1.5">
                  ({mpesaPercent.toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <Banknote className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium text-slate-700">Physical Cash</span>
              </div>
              <div className="text-right">
                <span className="font-bold font-mono-numbers text-slate-900">
                  {formatKES(totalCash)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono-numbers ml-1.5">
                  ({cashPercent.toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium text-slate-700">Customer Credit (Madeni)</span>
              </div>
              <div className="text-right">
                <span className="font-bold font-mono-numbers text-amber-700">
                  {formatKES(totalDebt)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono-numbers ml-1.5">
                  ({debtPercent.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dead Stock & Capital Tied Up (Slow Movers) */}
      {activeSubTab === 'deadstock' && (
        <div className="space-y-2">
          {deadStockProducts.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              High inventory turnover! All catalog items have active transaction velocity.
            </div>
          ) : (
            deadStockProducts.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-900 truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {item.totalStock} units idle in storage · {item.categoryName}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold font-mono-numbers text-rose-700">
                    {formatKES(item.tiedUpCapital)}
                  </div>
                  <div className="text-[10px] text-slate-400">Tied-up Capital</div>
                </div>
              </div>
            ))
          )}

          {totalTiedUpCapital > 0 && (
            <div className="text-[11px] text-slate-500 font-medium px-1 flex items-center justify-between">
              <span>Total Idle Capital in Non-Movers:</span>
              <span className="font-bold text-slate-900 font-mono-numbers">
                {formatKES(totalTiedUpCapital)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <button
          type="button"
          onClick={() => onNavigateToTab('reports')}
          className="text-slate-600 hover:text-slate-900 text-[11px] font-medium flex items-center gap-1"
        >
          <Receipt className="w-3 h-3 text-slate-400" />
          <span>Shift Audit &amp; Z-Report</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab(activeSubTab === 'deadstock' ? 'inventory' : 'mpesa')}
          className="text-blue-700 hover:text-blue-800 font-semibold text-[11px] flex items-center gap-0.5"
        >
          <span>{activeSubTab === 'deadstock' ? 'Inventory Clearance' : 'Daraja Records'}</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
