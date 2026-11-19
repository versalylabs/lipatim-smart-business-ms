import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { KraItaxReturnModal } from '../reports/KraItaxReturnModal';
import { ShiftZReportModal } from '../reports/ShiftZReportModal';
import {
  Printer,
  Download,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  PackageX,
  Users,
  Award,
  ArrowUpRight,
  Layers,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    invoices,
    expenses,
    products,
    branches,
    activeBranch,
    grns,
    permissions,
    notify,
    setActiveTab,
  } = useApp();

  const [scope, setScope] = useState<'all' | 'branch'>('all');
  const [subTab, setSubTab] = useState<'overview' | 'kra_vat' | 'velocity'>('overview');
  const [openingFloat, setOpeningFloat] = useState('5000');
  const [countedCash, setCountedCash] = useState('');
  const [itaxModalOpen, setItaxModalOpen] = useState(false);
  const [zReportModalOpen, setZReportModalOpen] = useState(false);

  const scopedInvoices =
    scope === 'branch'
      ? invoices.filter((i) => i.branchId === activeBranch.id)
      : invoices;

  const scopedExpenses =
    scope === 'branch'
      ? expenses.filter((e) => e.branchId === activeBranch.id)
      : expenses;

  // Aggregations
  const totalGross = scopedInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalTax = scopedInvoices.reduce((sum, i) => sum + i.totalTax, 0);
  const totalNetSales = scopedInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDiscounts = scopedInvoices.reduce((sum, i) => sum + i.totalDiscount, 0);

  // Detailed Payments breakdown
  let cashSales = 0;
  let mpesaStkSales = 0;
  let mpesaTillSales = 0;
  let mpesaPaybillSales = 0;
  let creditSales = 0;

  // Tax Band Breakdown
  let netBandA = 0;
  let vatBandA = 0;
  let netBandB = 0;
  let netBandC = 0;
  let netBandE = 0;
  let vatBandE = 0;

  scopedInvoices.forEach((inv) => {
    inv.payments.forEach((p) => {
      if (p.method === 'CASH') cashSales += p.amount;
      else if (p.method === 'MPESA_STK') mpesaStkSales += p.amount;
      else if (p.method === 'MPESA_TILL') mpesaTillSales += p.amount;
      else if (p.method === 'MPESA_PAYBILL') mpesaPaybillSales += p.amount;
      else if (p.method === 'CREDIT') creditSales += p.amount;
    });

    netBandA += inv.taxableAmounts.A || 0;
    vatBandA += inv.taxAmounts.A || 0;
    netBandB += inv.taxableAmounts.B || 0;
    netBandC += inv.taxableAmounts.C || 0;
    netBandE += inv.taxableAmounts.E || 0;
    vatBandE += inv.taxAmounts.E || 0;
  });

  const mpesaSales = mpesaStkSales + mpesaTillSales + mpesaPaybillSales;

  // Calculate COGS and Item Performance
  let estimatedCOGS = 0;
  const itemSalesMap: Record<
    string,
    {
      productId: string;
      name: string;
      sku: string;
      categoryName: string;
      unitsSold: number;
      grossRevenue: number;
      netRevenue: number;
      cogs: number;
      grossMargin: number;
    }
  > = {};

  scopedInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = prod ? prod.costPrice : item.unitPrice * 0.75;
      const itemCogs = unitCost * item.quantity;
      estimatedCOGS += itemCogs;

      if (!itemSalesMap[item.productId]) {
        itemSalesMap[item.productId] = {
          productId: item.productId,
          name: item.name,
          sku: prod?.sku || item.barcode,
          categoryName: prod?.categoryName || 'General Retail',
          unitsSold: 0,
          grossRevenue: 0,
          netRevenue: 0,
          cogs: 0,
          grossMargin: 0,
        };
      }
      itemSalesMap[item.productId].unitsSold += item.quantity;
      itemSalesMap[item.productId].grossRevenue += item.totalGross;
      itemSalesMap[item.productId].netRevenue += item.totalNet;
      itemSalesMap[item.productId].cogs += itemCogs;
      itemSalesMap[item.productId].grossMargin += item.totalNet - itemCogs;
    });
  });

  const topGrossingItems = Object.values(itemSalesMap).sort(
    (a, b) => b.grossRevenue - a.grossRevenue
  );

  // Dead / Slow-Moving Stock (products with 0 units sold in current scope)
  const deadStockItems = products.filter((p) => !itemSalesMap[p.id] && p.totalStock > 0);

  // Cashier Sales Velocity
  const cashierVelocityMap: Record<
    string,
    {
      cashierId: string;
      name: string;
      invoicesCount: number;
      itemsScanned: number;
      grossSales: number;
      mpesaCollected: number;
      cashCollected: number;
    }
  > = {};

  scopedInvoices.forEach((inv) => {
    if (!cashierVelocityMap[inv.cashierId]) {
      cashierVelocityMap[inv.cashierId] = {
        cashierId: inv.cashierId,
        name: inv.cashierName,
        invoicesCount: 0,
        itemsScanned: 0,
        grossSales: 0,
        mpesaCollected: 0,
        cashCollected: 0,
      };
    }
    const c = cashierVelocityMap[inv.cashierId];
    c.invoicesCount += 1;
    c.itemsScanned += inv.items.reduce((s, i) => s + i.quantity, 0);
    c.grossSales += inv.grandTotal;
    inv.payments.forEach((p) => {
      if (p.method === 'CASH') c.cashCollected += p.amount;
      else if (p.method.startsWith('MPESA')) c.mpesaCollected += p.amount;
    });
  });

  const cashierRankings = Object.values(cashierVelocityMap).sort(
    (a, b) => b.grossSales - a.grossSales
  );

  // Profit & Loss Metrics
  const grossProfit = totalNetSales - estimatedCOGS;
  const grossMarginPercent =
    totalNetSales > 0 ? ((grossProfit / totalNetSales) * 100).toFixed(1) : '0.0';
  const totalExpenses = scopedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const netMarginPercent =
    totalNetSales > 0 ? ((netProfit / totalNetSales) * 100).toFixed(1) : '0.0';

  // Expense Breakdown by Category
  const expensesByCategory: Record<string, number> = {};
  scopedExpenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  // Cash Drawer Reconciliation
  const cashOpexOut = scopedExpenses
    .filter((e) => e.paymentMethod === 'CASH')
    .reduce((sum, e) => sum + e.amount, 0);
  const floatAmount = parseFloat(openingFloat) || 0;
  const expectedDrawerCash = floatAmount + cashSales - cashOpexOut;
  const physicalCash = parseFloat(countedCash) || 0;
  const drawerVariance = countedCash ? physicalCash - expectedDrawerCash : 0;

  // Input VAT from Supplier GRNs
  const totalPurchasesGross = grns.reduce((sum, g) => sum + g.totalCost, 0);
  const totalInputVat = totalPurchasesGross - totalPurchasesGross / 1.16;
  const netVatPayable = Math.max(0, totalTax - totalInputVat);

  // Multi-Branch Comparison
  const branchMetrics = branches.map((branch) => {
    const brInvoices = invoices.filter((i) => i.branchId === branch.id);
    const brSales = brInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const brNet = brInvoices.reduce((sum, i) => sum + i.subtotal, 0);
    const brVat = brInvoices.reduce((sum, i) => sum + i.totalTax, 0);
    const brExpenses = expenses
      .filter((e) => e.branchId === branch.id)
      .reduce((sum, e) => sum + e.amount, 0);

    let brCogs = 0;
    brInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        brCogs += (prod ? prod.costPrice : item.unitPrice * 0.75) * item.quantity;
      });
    });

    return {
      branch,
      sales: brSales,
      net: brNet,
      vat: brVat,
      cogs: brCogs,
      grossProfit: brNet - brCogs,
      expenses: brExpenses,
      netProfit: brNet - brCogs - brExpenses,
      invoiceCount: brInvoices.length,
      averageBasket: brInvoices.length > 0 ? Math.round(brSales / brInvoices.length) : 0,
    };
  });

  // Quick 1-Click KRA VAT 3 CSV Download
  const handleQuickExportVatCsv = () => {
    const headers = [
      'Trader Invoice No',
      'KRA CU Serial No',
      'Transaction Date',
      'Branch Code',
      'Buyer KRA PIN',
      'Buyer Name',
      'Taxable 16% (Band A)',
      'Output VAT 16%',
      'Zero-Rated 0% (Band B)',
      'Exempt (Band C)',
      'Gross Total (KES)',
    ];

    const rows = scopedInvoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.etimsValidation.cuSerialNumber}"`,
      `"${inv.createdAt.slice(0, 10)}"`,
      `"${inv.branchName}"`,
      `"${inv.customer?.kraPin || 'WALK-IN'}"`,
      `"${inv.customer?.name || 'General Public'}"`,
      inv.taxableAmounts.A.toFixed(2),
      inv.taxAmounts.A.toFixed(2),
      inv.taxableAmounts.B.toFixed(2),
      inv.taxableAmounts.C.toFixed(2),
      inv.grandTotal.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `KRA_iTax_VAT3_Schedule_${scope === 'branch' ? activeBranch.code : 'CONSOLIDATED'}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify(
      'success',
      '1-Click KRA VAT 3 CSV Exported',
      `Exported ${scopedInvoices.length} eTIMS fiscal records formatted for KRA iTax.`
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Reports and tax returns
            </h1>
            <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
              VSCU Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Print shift summaries and prepare VAT returns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Switcher */}
          <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setScope('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                scope === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Branches ({invoices.length})
            </button>
            <button
              onClick={() => setScope('branch')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                scope === 'branch'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeBranch.code} Only
            </button>
          </div>

          <button
            onClick={() => setZReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Shift Z-Report Modal</span>
          </button>

          <button
            onClick={() => setItaxModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1-Click KRA iTax VAT 3</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Gross Turnover (Incl. VAT)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-2">
            {formatKES(totalGross)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono-numbers">
            <span>Net: {formatKES(totalNetSales)}</span>
            <span className="text-emerald-700 font-semibold">{scopedInvoices.length} Invoices</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Gross Operating Profit</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-2">
            {permissions.canViewProfitMargins ? formatKES(grossProfit) : 'KES ••••••'}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono-numbers">
            <span>COGS: {permissions.canViewProfitMargins ? formatKES(estimatedCOGS) : 'Locked'}</span>
            <span className="text-blue-700 font-semibold">{grossMarginPercent}% Margin</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Net Profit (After Opex)</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div
            className={`text-2xl font-bold font-mono-numbers mt-2 ${
              netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {permissions.canViewProfitMargins ? formatKES(netProfit) : 'KES ••••••'}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono-numbers">
            <span>Opex: -{formatKES(totalExpenses)}</span>
            <span className="font-semibold">{netMarginPercent}% Net</span>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <span>KRA Output VAT Liability</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-950 font-mono-numbers mt-2">
            {formatKES(totalTax)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-800 font-mono-numbers">
            <span>Input VAT: -{formatKES(totalInputVat)}</span>
            <span className="font-bold underline cursor-pointer" onClick={() => setItaxModalOpen(true)}>
              File VAT 3 &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-4 sm:gap-6 text-xs font-semibold min-w-max">
          <button
            onClick={() => setSubTab('overview')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              subTab === 'overview'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>1. Shift Z-Report &amp; Real-Time P&amp;L</span>
          </button>

          <button
            onClick={() => setSubTab('kra_vat')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              subTab === 'kra_vat'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>2. KRA iTax VAT 3 Return &amp; Tax Schedule</span>
          </button>

          <button
            onClick={() => setSubTab('velocity')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              subTab === 'velocity'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>3. Top Grossing Items, Dead Stock &amp; Cashier Velocity</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Z-REPORT & REAL-TIME PROFIT & LOSS */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Interactive Shift-End Z-Report */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Shift-End Z-Report Generator</h2>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {scope === 'branch'
                        ? `Counter: ${activeBranch.name} (${activeBranch.code})`
                        : 'Consolidated All Branches'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {new Date().toLocaleDateString('en-KE')}
                    </span>
                    <button
                      onClick={() => setZReportModalOpen(true)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {/* Cash Drawer Reconciliation Inputs */}
                <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Opening Cash Float (KES)
                    </label>
                    <input
                      type="number"
                      value={openingFloat}
                      onChange={(e) => setOpeningFloat(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Physical Drawer Count (KES)
                    </label>
                    <input
                      type="number"
                      placeholder={expectedDrawerCash.toString()}
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs font-bold text-emerald-800"
                    />
                  </div>
                </div>

                {/* Z-Reading Tape Preview */}
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs space-y-2">
                  <div className="text-center font-bold text-sm pb-2 border-b border-dashed border-slate-300">
                    LIPATIM POS Z-READINGAUDIT
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Tender Reconciliation</div>
                    <div className="flex justify-between">
                      <span>Cash Sales Collected:</span>
                      <span className="font-bold font-mono-numbers">{formatKES(cashSales)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800">
                      <span>M-Pesa STK Push:</span>
                      <span className="font-bold font-mono-numbers">{formatKES(mpesaStkSales)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>M-Pesa Buy Goods (Till):</span>
                      <span className="font-bold font-mono-numbers">{formatKES(mpesaTillSales)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>M-Pesa Paybill (B2B):</span>
                      <span className="font-bold font-mono-numbers">{formatKES(mpesaPaybillSales)}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Customer Credit (Madeni):</span>
                      <span className="font-bold font-mono-numbers">{formatKES(creditSales)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-slate-900">
                    <span>GROSS SHIFT TURNOVER:</span>
                    <span className="font-mono-numbers">{formatKES(totalGross)}</span>
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Band A (16% Taxable Net):</span>
                      <span className="font-mono-numbers">{formatKES(netBandA)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Band A Output VAT (16%):</span>
                      <span className="font-mono-numbers">{formatKES(vatBandA)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Band B (0% Zero-Rated):</span>
                      <span className="font-mono-numbers">{formatKES(netBandB)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Band C (Exempt Supplies):</span>
                      <span className="font-mono-numbers">{formatKES(netBandC)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                    <div className="flex justify-between text-[11px] text-rose-700">
                      <span>Less: Cash Paid Out (Opex):</span>
                      <span className="font-mono-numbers">-{formatKES(cashOpexOut)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 text-xs">
                      <span>EXPECTED DRAWER CASH:</span>
                      <span className="font-mono-numbers text-emerald-800">
                        {formatKES(expectedDrawerCash)}
                      </span>
                    </div>
                  </div>

                  {countedCash && (
                    <div
                      className={`p-2 rounded flex items-center justify-between font-bold text-xs ${
                        drawerVariance === 0
                          ? 'bg-emerald-100/80 text-emerald-900'
                          : drawerVariance > 0
                          ? 'bg-blue-100/80 text-blue-900'
                          : 'bg-rose-100/80 text-rose-900'
                      }`}
                    >
                      <span>
                        {drawerVariance === 0
                          ? 'DRAWER BALANCED EXACT:'
                          : drawerVariance > 0
                          ? 'CASH SURPLUS (OVER):'
                          : 'CASH SHORTAGE (SHORT):'}
                      </span>
                      <span>
                        {drawerVariance > 0 ? `+${formatKES(drawerVariance)}` : formatKES(drawerVariance)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>KRA VSCU Serial: {activeBranch.code}-SHIFT-Z</span>
                <button
                  onClick={() => setZReportModalOpen(true)}
                  className="text-slate-700 font-sans font-semibold hover:underline"
                >
                  Open Full Z-Report &amp; Seal Shift &rarr;
                </button>
              </div>
            </div>

            {/* Right Card: Real-Time Profit & Loss Statement */}
            {permissions.canViewProfitMargins ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Real-Time Profit &amp; Loss (P&amp;L) Statement
                      </h2>
                      <div className="text-[11px] text-slate-500">
                        Verified COGS vs. Net Sales Revenue &amp; Operational Expenses
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Gross Turnover (Incl. VAT):</span>
                      <span className="font-mono-numbers font-semibold text-slate-800">
                        {formatKES(totalGross)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Less: Output VAT Collected (16% / 8%):</span>
                      <span className="font-mono-numbers text-slate-500">-{formatKES(totalTax)}</span>
                    </div>

                    {totalDiscounts > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Less: Line-Item Cart Discounts:</span>
                        <span className="font-mono-numbers text-amber-700">
                          -{formatKES(totalDiscounts)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-2 px-2.5 bg-slate-50 rounded-lg font-bold text-slate-900">
                      <span>1. Net Sales Revenue (Excl. VAT):</span>
                      <span className="font-mono-numbers">{formatKES(totalNetSales)}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">
                        2. Less: Cost of Goods Sold (Verified Batch Cost):
                      </span>
                      <span className="font-mono-numbers font-semibold text-rose-700">
                        -{formatKES(estimatedCOGS)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2.5 px-3 bg-emerald-50/60 border border-emerald-200/80 rounded-lg font-bold">
                      <div>
                        <span className="text-emerald-950">3. Gross Profit Margin:</span>
                        <span className="ml-2 text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          {grossMarginPercent}%
                        </span>
                      </div>
                      <span className="text-emerald-800 font-mono-numbers">{formatKES(grossProfit)}</span>
                    </div>

                    {/* Itemized Operating Expenses */}
                    <div className="pt-2 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        4. Less: Operating Expenses (Opex)
                      </div>
                      {Object.entries(expensesByCategory).map(([cat, amt]) => (
                        <div
                          key={cat}
                          className="flex justify-between text-[11px] text-slate-600 pl-2 border-l-2 border-slate-200"
                        >
                          <span>{cat.replace(/_/g, ' ')}:</span>
                          <span className="font-mono-numbers text-rose-600">-{formatKES(amt)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-1.5 border-t border-slate-100 font-semibold text-slate-700">
                        <span>Total Operating Expenses:</span>
                        <span className="font-mono-numbers text-rose-700">
                          -{formatKES(totalExpenses)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between pt-3 border-t-2 border-slate-900 font-bold text-sm">
                      <div>
                        <span>5. Net Operating Profit / (Loss):</span>
                        <span className="ml-2 text-[11px] font-mono font-normal text-slate-500">
                          ({netMarginPercent}% net)
                        </span>
                      </div>
                      <span
                        className={`font-mono-numbers text-base ${
                          netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatKES(netProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">KRA Corporate Tax Note:</span> Verified eTIMS expenses reduce taxable profit.
                  </div>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="text-emerald-700 font-semibold hover:underline shrink-0 ml-2"
                  >
                    Manage Opex &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center text-center p-8">
                <div className="text-slate-400 text-xs max-w-xs space-y-2">
                  <DollarSign className="w-8 h-8 mx-auto text-slate-300" />
                  <div className="font-bold text-slate-700 text-sm">Profit &amp; Loss Restricted</div>
                  <div>
                    Your current role (Cashier) is restricted from viewing wholesale COGS and net profit statements. Switch to Manager or Admin in the top bar to view.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Multi-Branch Financial Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Multi-Branch P&amp;L &amp; Tax Comparison
                </h2>
                <div className="text-[11px] text-slate-500">
                  Side-by-side revenue, COGS, Opex, and KRA VAT across all {branches.length} Kenyan outlets
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">{branches.length} Active Stores</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Branch Name &amp; Code</th>
                    <th className="py-3 px-3 text-right">Invoices</th>
                    <th className="py-3 px-3 text-right">Gross Sales</th>
                    <th className="py-3 px-3 text-right">Output VAT</th>
                    <th className="py-3 px-3 text-right">COGS</th>
                    <th className="py-3 px-3 text-right">Gross Profit</th>
                    <th className="py-3 px-3 text-right">Branch Opex</th>
                    <th className="py-3 px-4 text-right">Net Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchMetrics.map((bm) => (
                    <tr key={bm.branch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{bm.branch.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {bm.branch.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                        {bm.invoiceCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                        {formatKES(bm.sales)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                        {formatKES(bm.vat)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                        {permissions.canViewProfitMargins ? formatKES(bm.cogs) : '•••'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-emerald-700">
                        {permissions.canViewProfitMargins ? formatKES(bm.grossProfit) : '•••'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-rose-600">
                        -{formatKES(bm.expenses)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono-numbers font-bold ${
                          bm.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
                        }`}
                      >
                        {permissions.canViewProfitMargins ? formatKES(bm.netProfit) : '•••'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KRA iTAX VAT 3 RETURN & SCHEDULE */}
      {subTab === 'kra_vat' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  KRA iTax VAT 3 Monthly Return Worksheet (October 2026)
                </h2>
                <div className="text-xs text-slate-500">
                  Directly aligned with KRA Form VAT 3 Sections B (Output Tax), F (Input Tax), and M (Net Tax Payable)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickExportVatCsv}
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Quick Export CSV</span>
                </button>
                <button
                  onClick={() => setItaxModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Open Full VAT 3 Wizard &amp; PRN Slip</span>
                </button>
              </div>
            </div>

            {/* VAT Band Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase">
                    <th className="py-2.5 px-4">KRA eTIMS Tax Band</th>
                    <th className="py-2.5 px-3">Statutory Classification</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value (Excl. VAT)</th>
                    <th className="py-2.5 px-3 text-right">VAT Rate</th>
                    <th className="py-2.5 px-4 text-right">Output VAT Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-slate-900">Band A</td>
                    <td className="py-2.5 px-3 font-sans">Standard Rated Supplies (General Retail, Hardware)</td>
                    <td className="py-2.5 px-3 text-right">{formatKES(netBandA)}</td>
                    <td className="py-2.5 px-3 text-right">16.0%</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatKES(vatBandA)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-blue-700">Band B</td>
                    <td className="py-2.5 px-3 font-sans">Zero-Rated Supplies (Pharmaceuticals, Medicaments)</td>
                    <td className="py-2.5 px-3 text-right">{formatKES(netBandB)}</td>
                    <td className="py-2.5 px-3 text-right">0.0%</td>
                    <td className="py-2.5 px-4 text-right text-slate-400">KES 0.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-amber-700">Band C</td>
                    <td className="py-2.5 px-3 font-sans">Exempt Supplies (Unprocessed Milk &amp; Agricultural)</td>
                    <td className="py-2.5 px-3 text-right">{formatKES(netBandC)}</td>
                    <td className="py-2.5 px-3 text-right">EXEMPT</td>
                    <td className="py-2.5 px-4 text-right text-slate-400">KES 0.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-purple-700">Band E</td>
                    <td className="py-2.5 px-3 font-sans">Petroleum &amp; Special Rate Supplies</td>
                    <td className="py-2.5 px-3 text-right">{formatKES(netBandE)}</td>
                    <td className="py-2.5 px-3 text-right">8.0%</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatKES(vatBandE)}</td>
                  </tr>
                  <tr className="bg-emerald-50/70 font-bold">
                    <td className="py-3 px-4 font-sans text-emerald-950" colSpan={2}>
                      Total Output Tax (Section B + E)
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-950">{formatKES(totalNetSales)}</td>
                    <td className="py-3 px-3 text-right">—</td>
                    <td className="py-3 px-4 text-right text-emerald-800 text-sm">{formatKES(totalTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Invoice-Level KRA eTIMS Verification Ledger */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-900 mb-2">
                Itemized eTIMS Fiscal Invoices Included in Return ({scopedInvoices.length})
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">KRA CU Serial Number</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Buyer &amp; KRA PIN</th>
                      <th className="py-2.5 px-3 text-right">Band A (16%)</th>
                      <th className="py-2.5 px-3 text-right">Band B/C (0%)</th>
                      <th className="py-2.5 px-3 text-right">Output VAT</th>
                      <th className="py-2.5 px-3 text-right">Gross Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {scopedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-3 text-[11px] text-emerald-700 font-semibold">
                          {inv.etimsValidation.cuSerialNumber}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">
                          {inv.createdAt.slice(0, 10)}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-medium text-slate-800">
                            {inv.customer?.name || 'Walk-in Cash Buyer'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {inv.customer?.kraPin || 'B2C General Public'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">{formatKES(inv.taxableAmounts.A)}</td>
                        <td className="py-2.5 px-3 text-right">
                          {formatKES((inv.taxableAmounts.B || 0) + (inv.taxableAmounts.C || 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {formatKES(inv.totalTax)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatKES(inv.grandTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUSINESS PERFORMANCE CHARTS (TOP GROSSING, DEAD STOCK, CASHIER VELOCITY) */}
      {subTab === 'velocity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Grossing Items */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Top Grossing Products &amp; Margin Contribution
                  </h2>
                  <div className="text-[11px] text-slate-500">
                    Ranked by gross revenue velocity and verified unit margin
                  </div>
                </div>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3">
                {topGrossingItems.map((item, idx) => {
                  const maxRev = topGrossingItems[0]?.grossRevenue || 1;
                  const barWidth = Math.max(8, Math.round((item.grossRevenue / maxRev) * 100));

                  return (
                    <div key={item.productId} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">{item.name}</span>
                            <span className="ml-2 text-[10px] font-mono text-slate-400">{item.sku}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono-numbers">
                          <span className="font-bold text-slate-900">{formatKES(item.grossRevenue)}</span>
                          <span className="ml-2 text-[11px] text-emerald-700 font-semibold">
                            ({item.unitsSold} sold)
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      {permissions.canViewProfitMargins && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-numbers">
                          <span>Category: {item.categoryName}</span>
                          <span>
                            COGS: {formatKES(item.cogs)} ·{' '}
                            <strong className="text-emerald-700">
                              Profit: {formatKES(item.grossMargin)}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Cashier Velocity & Dead Stock */}
            <div className="space-y-6">
              {/* Cashier Sales Velocity */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Cashier Sales Velocity</h3>
                    <div className="text-[11px] text-slate-500">Operator checkout speed &amp; tender mix</div>
                  </div>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>

                <div className="space-y-2.5 text-xs">
                  {cashierRankings.map((c) => (
                    <div key={c.cashierId} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="font-mono-numbers font-bold text-emerald-800">
                          {formatKES(c.grossSales)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-numbers">
                        <span>{c.invoicesCount} receipts · {c.itemsScanned} items</span>
                        <span>Avg: {formatKES(Math.round(c.grossSales / c.invoicesCount))}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>M-Pesa: {formatKES(c.mpesaCollected)}</span>
                        <span>Cash: {formatKES(c.cashCollected)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dead / Slow-Moving Stock Alert */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Dead / Slow-Moving Stock ({deadStockItems.length})
                    </h3>
                    <div className="text-[11px] text-slate-500">
                      Zero velocity items tying up working capital
                    </div>
                  </div>
                  <PackageX className="w-4 h-4 text-amber-600" />
                </div>

                {deadStockItems.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {deadStockItems.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/70 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{prod.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {prod.totalStock} {prod.unit} in stock · {prod.sku}
                          </div>
                        </div>
                        <div className="text-right font-mono-numbers">
                          <div className="font-bold text-amber-900">
                            {formatKES(prod.costPrice * prod.totalStock)}
                          </div>
                          <div className="text-[10px] text-amber-700">Tied Capital</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50/50 rounded-lg border border-emerald-100">
                    100% Active SKU Turnover! Every stocked product has recorded sales in this period.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {itaxModalOpen && <KraItaxReturnModal onClose={() => setItaxModalOpen(false)} />}
      {zReportModalOpen && <ShiftZReportModal onClose={() => setZReportModalOpen(false)} />}
    </div>
  );
};

