import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { Printer, CheckCircle2, AlertTriangle, X, ShieldCheck, Lock } from 'lucide-react';

interface ShiftZReportModalProps {
  onClose: () => void;
}

export const ShiftZReportModal: React.FC<ShiftZReportModalProps> = ({ onClose }) => {
  const { invoices, expenses, activeBranch, currentUser, notify } = useApp();

  const [scope, setScope] = useState<'branch' | 'all'>('branch');
  const [openingFloat, setOpeningFloat] = useState('5000');
  const [countedCash, setCountedCash] = useState('');
  const [isShiftSignedOff, setIsShiftSignedOff] = useState(false);

  const scopedInvoices =
    scope === 'branch'
      ? invoices.filter((inv) => inv.branchId === activeBranch.id)
      : invoices;

  const scopedExpenses =
    scope === 'branch'
      ? expenses.filter((e) => e.branchId === activeBranch.id)
      : expenses;

  // Calculate shift totals by detailed payment tender
  let cashSales = 0;
  let mpesaStkSales = 0;
  let mpesaTillSales = 0;
  let mpesaPaybillSales = 0;
  let creditSales = 0;
  let bankSales = 0;

  // Tax band totals
  let taxNetA = 0;
  let taxVatA = 0;
  let taxNetB = 0;
  let taxNetC = 0;
  let taxNetE = 0;
  let taxVatE = 0;

  // Cashier breakdown
  const cashierStats: Record<string, { name: string; count: number; total: number }> = {};

  scopedInvoices.forEach((inv) => {
    inv.payments.forEach((p) => {
      if (p.method === 'CASH') cashSales += p.amount;
      else if (p.method === 'MPESA_STK') mpesaStkSales += p.amount;
      else if (p.method === 'MPESA_TILL') mpesaTillSales += p.amount;
      else if (p.method === 'MPESA_PAYBILL') mpesaPaybillSales += p.amount;
      else if (p.method === 'CREDIT') creditSales += p.amount;
      else if (p.method === 'BANK_TRANSFER') bankSales += p.amount;
    });

    taxNetA += inv.taxableAmounts.A || 0;
    taxVatA += inv.taxAmounts.A || 0;
    taxNetB += inv.taxableAmounts.B || 0;
    taxNetC += inv.taxableAmounts.C || 0;
    taxNetE += inv.taxableAmounts.E || 0;
    taxVatE += inv.taxAmounts.E || 0;

    if (!cashierStats[inv.cashierId]) {
      cashierStats[inv.cashierId] = { name: inv.cashierName, count: 0, total: 0 };
    }
    cashierStats[inv.cashierId].count += 1;
    cashierStats[inv.cashierId].total += inv.grandTotal;
  });

  const mpesaSales = mpesaStkSales + mpesaTillSales + mpesaPaybillSales;
  const totalGrossSales = cashSales + mpesaSales + creditSales + bankSales;
  const vatCollected = taxVatA + taxVatE;

  const cashExpenses = scopedExpenses
    .filter((e) => e.paymentMethod === 'CASH')
    .reduce((sum, e) => sum + e.amount, 0);

  const floatNum = parseFloat(openingFloat) || 0;
  const expectedCashInDrawer = floatNum + cashSales - cashExpenses;

  const countedNum = parseFloat(countedCash) || 0;
  const cashVariance = countedCash ? countedNum - expectedCashInDrawer : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleSignOffShift = () => {
    setIsShiftSignedOff(true);
    notify(
      'success',
      'Shift Z-Report Signed & Locked',
      `Z-Reading #Z-${new Date().toISOString().slice(0, 10).replace(/-/g, '')} sealed for ${
        scope === 'branch' ? activeBranch.name : 'All Branches'
      } (${formatKES(totalGrossSales)} gross).`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">End-of-Day Shift Z-Report</h3>
              {isShiftSignedOff && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  <Lock className="w-3 h-3" /> SEALED
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {scope === 'branch' ? `Branch: ${activeBranch.name} (${activeBranch.code})` : 'Consolidated All Branches'} · {currentUser.name}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Toggle */}
        <div className="flex items-center justify-between bg-slate-100 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setScope('branch')}
            className={`flex-1 py-1.5 px-3 rounded-md font-semibold transition-all ${
              scope === 'branch' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Counter ({activeBranch.code})
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`flex-1 py-1.5 px-3 rounded-md font-semibold transition-all ${
              scope === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Branches (Consolidated)
          </button>
        </div>

        {/* Shift Cash Balancing Inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Morning Opening Float (KES)</label>
            <input
              type="number"
              disabled={isShiftSignedOff}
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono text-xs font-bold disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Physical Counted Cash (KES)</label>
            <input
              type="number"
              disabled={isShiftSignedOff}
              placeholder={expectedCashInDrawer.toString()}
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono text-xs font-bold text-emerald-800 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Printable Z-Report Body */}
        <div
          id="printable-receipt"
          className="border border-slate-200 rounded-xl p-4 bg-white text-xs font-mono space-y-3"
        >
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <div className="font-bold text-sm text-slate-900">DAILY SHIFT AUDIT (Z-REPORT)</div>
            <div className="text-[11px] font-semibold text-slate-700">
              {scope === 'branch' ? activeBranch.name : 'LIPATIM CONSOLIDATED ENTERPRISE'}
            </div>
            <div className="text-[10px] text-slate-500">
              PIN: P051239841K · {new Date().toLocaleDateString('en-KE')} · {new Date().toLocaleTimeString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Transactions: {scopedInvoices.length} fiscal invoices
            </div>
          </div>

          {/* Sales by Tender */}
          <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
            <div className="font-bold text-slate-900 pb-1">1. TENDER COLLECTIONS:</div>
            <div className="flex justify-between">
              <span>Cash Drawer Sales:</span>
              <span className="font-bold">{formatKES(cashSales)}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>M-Pesa Daraja STK Push:</span>
              <span>{formatKES(mpesaStkSales)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>M-Pesa Buy Goods (Till):</span>
              <span>{formatKES(mpesaTillSales)}</span>
            </div>
            {mpesaPaybillSales > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>M-Pesa Paybill (B2B):</span>
                <span>{formatKES(mpesaPaybillSales)}</span>
              </div>
            )}
            <div className="flex justify-between text-amber-800">
              <span>Store Credit (Madeni):</span>
              <span>{formatKES(creditSales)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-900">
              <span>TOTAL GROSS TURNOVER:</span>
              <span>{formatKES(totalGrossSales)}</span>
            </div>
          </div>

          {/* KRA eTIMS Tax Breakdown */}
          <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
            <div className="font-bold text-slate-900 pb-1">2. KRA eTIMS TAX SUMMARY:</div>
            <div className="flex justify-between text-[11px]">
              <span>Band A (16% Standard Net):</span>
              <span>{formatKES(taxNetA)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-semibold">
              <span>Band A Output VAT (16%):</span>
              <span>{formatKES(taxVatA)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Band B (0% Zero-Rated):</span>
              <span>{formatKES(taxNetB)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Band C (Exempt Supplies):</span>
              <span>{formatKES(taxNetC)}</span>
            </div>
            {taxNetE > 0 && (
              <div className="flex justify-between text-[11px]">
                <span>Band E (8% Fuel VAT):</span>
                <span>{formatKES(taxVatE)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-emerald-800">
              <span>TOTAL OUTPUT VAT:</span>
              <span>{formatKES(vatCollected)}</span>
            </div>
          </div>

          {/* Cash Drawer Reconciliation */}
          <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
            <div className="font-bold text-slate-900 pb-1">3. DRAWER RECONCILIATION:</div>
            <div className="flex justify-between">
              <span>(+) Opening Float:</span>
              <span>{formatKES(floatNum)}</span>
            </div>
            <div className="flex justify-between">
              <span>(+) Cash Sales Collected:</span>
              <span>{formatKES(cashSales)}</span>
            </div>
            <div className="flex justify-between text-rose-700">
              <span>(-) Cash Paid Out (Opex):</span>
              <span>-{formatKES(cashExpenses)}</span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-slate-900">
              <span>EXPECTED DRAWER CASH:</span>
              <span className="text-emerald-800">{formatKES(expectedCashInDrawer)}</span>
            </div>
            {countedCash && (
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>ACTUAL COUNTED CASH:</span>
                <span>{formatKES(countedNum)}</span>
              </div>
            )}
          </div>

          {/* Over / Short Discrepancy */}
          {countedCash && (
            <div
              className={`p-2.5 rounded-lg flex items-center justify-between font-bold ${
                cashVariance === 0
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : cashVariance > 0
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {cashVariance === 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                {cashVariance === 0
                  ? 'Drawer Balanced Exact:'
                  : cashVariance > 0
                  ? 'Cash Surplus (Over):'
                  : 'Cash Shortage (Short):'}
              </span>
              <span>{cashVariance > 0 ? `+${formatKES(cashVariance)}` : formatKES(cashVariance)}</span>
            </div>
          )}

          {/* Cashier Breakdown */}
          {Object.values(cashierStats).length > 0 && (
            <div className="space-y-1 py-1 border-b border-dashed border-slate-300 text-[11px]">
              <div className="font-bold text-slate-900 pb-0.5">4. OPERATOR TELEMETRY:</div>
              {Object.values(cashierStats).map((c, idx) => (
                <div key={idx} className="flex justify-between text-slate-600">
                  <span>
                    {c.name} ({c.count} inv):
                  </span>
                  <span className="font-semibold text-slate-800">{formatKES(c.total)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-[10px] text-slate-400 text-center space-y-0.5">
            <div className="font-semibold text-slate-600">
              KRA VSCU Daily Z-Counter · Serial {activeBranch.code}-Z-20261005
            </div>
            <div>Operator: {currentUser.name} · Certified for KRA Daily Audit</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {!isShiftSignedOff && (
              <button
                type="button"
                onClick={handleSignOffShift}
                className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sign Off &amp; Seal Shift</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Thermal Z-Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

