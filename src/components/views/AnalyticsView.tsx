import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { KraItaxReturnModal } from '../reports/KraItaxReturnModal';
import { ShiftZReportModal } from '../reports/ShiftZReportModal';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Building2,
  FileSpreadsheet,
  Clock,
  Printer,
  ShieldCheck,
  Percent,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { invoices, expenses, branches, products } = useApp();

  const [itaxModalOpen, setItaxModalOpen] = useState(false);
  const [zReportModalOpen, setZReportModalOpen] = useState(false);

  // Financial aggregates
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalNetTurnover = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalVat = invoices.reduce((sum, inv) => sum + inv.totalTax, 0);

  // Approximate COGS from items sold
  let totalCogs = 0;
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = prod ? prod.costPrice : item.unitPrice * 0.7;
      totalCogs += unitCost * item.quantity;
    });
  });

  const grossProfit = totalNetTurnover - totalCogs;
  const grossMarginPercent = totalNetTurnover > 0 ? Math.round((grossProfit / totalNetTurnover) * 100) : 0;

  const totalOpex = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalOpex;
  const netMarginPercent = totalNetTurnover > 0 ? Math.round((netProfit / totalNetTurnover) * 100) : 0;

  // Tender mix
  let cashTotal = 0;
  let mpesaTotal = 0;
  let creditTotal = 0;

  invoices.forEach((inv) => {
    inv.payments.forEach((p) => {
      if (p.method === 'CASH') cashTotal += p.amount;
      else if (p.method.startsWith('MPESA')) mpesaTotal += p.amount;
      else if (p.method === 'CREDIT') creditTotal += p.amount;
    });
  });

  // Multi-Branch Performance
  const branchMetrics = branches.map((branch) => {
    const branchInvoices = invoices.filter((i) => i.branchId === branch.id);
    const branchSales = branchInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const branchVat = branchInvoices.reduce((sum, i) => sum + i.totalTax, 0);
    const branchExpenses = expenses
      .filter((e) => e.branchId === branch.id)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      branch,
      sales: branchSales,
      vat: branchVat,
      expenses: branchExpenses,
      invoiceCount: branchInvoices.length,
      averageBasket: branchInvoices.length > 0 ? Math.round(branchSales / branchInvoices.length) : 0,
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business performance</h1>
            <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
              Consolidated Books
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compare sales, costs and profit across branches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Shift Z-Report</span>
          </button>

          <button
            onClick={() => setItaxModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Generate KRA iTax VAT 3</span>
          </button>
        </div>
      </div>

      {/* P&L Statement Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Consolidated Profit &amp; Loss (P&amp;L) Statement</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">All 3 Branches Combined</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">1. Net Turnover (Excl. VAT)</div>
            <div className="text-xl font-bold text-slate-900 font-mono-numbers mt-1">
              {formatKES(totalNetTurnover)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
              Gross: {formatKES(totalRevenue)} (VAT: {formatKES(totalVat)})
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">2. Cost of Goods Sold (COGS)</div>
            <div className="text-xl font-bold text-slate-700 font-mono-numbers mt-1">
              {formatKES(totalCogs)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Direct wholesale purchase cost
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">3. Gross Margin</div>
            <div className="text-xl font-bold text-emerald-800 font-mono-numbers mt-1">
              {formatKES(grossProfit)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-mono-numbers font-semibold">
              {grossMarginPercent}% gross margin
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-xs text-emerald-900 font-semibold">4. Net Profit (After Opex)</div>
            <div className="text-2xl font-bold text-emerald-950 font-mono-numbers mt-1">
              {formatKES(netProfit)}
            </div>
            <div className="text-[11px] text-emerald-800 mt-1 font-mono-numbers">
              Opex: -{formatKES(totalOpex)} ({netMarginPercent}% net margin)
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Branch Performance Comparison */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Multi-Branch Retail Breakdown</h2>
            <div className="text-[11px] text-slate-500">
              Comparative store productivity and cashier counter metrics
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">{branches.length} active stores</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Store Name &amp; Code</th>
                <th className="py-3 px-3">Location / County</th>
                <th className="py-3 px-3 text-right">Invoices</th>
                <th className="py-3 px-3 text-right">Avg. Basket</th>
                <th className="py-3 px-3 text-right">Branch Opex</th>
                <th className="py-3 px-3 text-right">KRA VAT</th>
                <th className="py-3 px-4 text-right">Gross Sales (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchMetrics.map(({ branch, sales, vat, expenses: brExp, invoiceCount, averageBasket }) => (
                <tr key={branch.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{branch.name}</span>
                      {branch.isMainWarehouse && (
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono font-bold">
                          HQ
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{branch.address}</td>
                  <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">{invoiceCount}</td>
                  <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                    {formatKES(averageBasket)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-numbers text-slate-500">
                    {formatKES(brExp)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                    {formatKES(vat)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-numbers font-bold text-emerald-800 text-sm">
                    {formatKES(sales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tender Composition & Tax Band Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tender Mix */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="font-bold text-sm text-slate-900">Payment Tender Distribution</div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between font-mono-numbers mb-1">
                <span className="font-semibold text-slate-800">Safaricom M-Pesa:</span>
                <span className="font-bold text-emerald-700">{formatKES(mpesaTotal)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${(mpesaTotal / (totalRevenue || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono-numbers mb-1">
                <span className="font-semibold text-slate-800">Cash Drawer:</span>
                <span className="font-bold text-slate-900">{formatKES(cashTotal)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-slate-700 h-full rounded-full"
                  style={{ width: `${(cashTotal / (totalRevenue || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono-numbers mb-1">
                <span className="font-semibold text-slate-800">Credit (Madeni):</span>
                <span className="font-bold text-amber-700">{formatKES(creditTotal)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${(creditTotal / (totalRevenue || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Rush Hour Distribution */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="font-bold text-sm text-slate-900">Peak Trading Windows</div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <span className="font-semibold text-slate-900">Morning Shift (07:00 - 11:00)</span>
                <div className="text-[10px] text-slate-400">Breakfast staple groceries &amp; OTC medicine</div>
              </div>
              <span className="font-mono font-bold text-slate-800">28% Volume</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <div>
                <span className="font-semibold text-emerald-950">Lunch Rush (12:00 - 14:30)</span>
                <div className="text-[10px] text-emerald-700">Quick retail snacks, dairy, drinks</div>
              </div>
              <span className="font-mono font-bold text-emerald-800">34% Volume</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <span className="font-semibold text-slate-900">Evening Peak (17:00 - 20:30)</span>
                <div className="text-[10px] text-slate-400">Dinner flour, cooking fat, family provisions</div>
              </div>
              <span className="font-mono font-bold text-slate-800">38% Volume</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Modals */}
      {itaxModalOpen && <KraItaxReturnModal onClose={() => setItaxModalOpen(false)} />}
      {zReportModalOpen && <ShiftZReportModal onClose={() => setZReportModalOpen(false)} />}
    </div>
  );
};
