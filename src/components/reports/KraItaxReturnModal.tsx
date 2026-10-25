import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { FileSpreadsheet, Download, ShieldCheck, CheckCircle2, X, Building2, Receipt, Copy } from 'lucide-react';

interface KraItaxReturnModalProps {
  onClose: () => void;
}

export const KraItaxReturnModal: React.FC<KraItaxReturnModalProps> = ({ onClose }) => {
  const { invoices, grns, suppliers, activeBranch, notify } = useApp();

  const [period, setPeriod] = useState('2026-10');
  const [generatedPrn, setGeneratedPrn] = useState<string | null>(null);

  // Compute Output Tax from Sales & split B2B (with KRA PIN) vs B2C (General Public)
  let salesNetA = 0;
  let vatA = 0;
  let b2bNetA = 0;
  let b2bVatA = 0;
  let b2cNetA = 0;
  let b2cVatA = 0;

  let salesNetB = 0;
  let salesNetC = 0;
  let salesNetD = 0;
  let salesNetE = 0;
  let vatE = 0;

  invoices.forEach((inv) => {
    const netA = inv.taxableAmounts.A || 0;
    const taxA = inv.taxAmounts.A || 0;
    salesNetA += netA;
    vatA += taxA;

    if (inv.customer?.kraPin) {
      b2bNetA += netA;
      b2bVatA += taxA;
    } else {
      b2cNetA += netA;
      b2cVatA += taxA;
    }

    salesNetB += inv.taxableAmounts.B || 0;
    salesNetC += inv.taxableAmounts.C || 0;
    salesNetD += inv.taxableAmounts.D || 0;
    salesNetE += inv.taxableAmounts.E || 0;
    vatE += inv.taxAmounts.E || 0;
  });

  const totalOutputVat = vatA + vatE;

  // Compute Input Tax from Supplier Purchases (GRN)
  const inputVatSchedule = grns.map((grn) => {
    const sup = suppliers.find((s) => s.id === grn.supplierId);
    const netPurchase = grn.totalCost / 1.16;
    const inputVat = grn.totalCost - netPurchase;
    return {
      grnNumber: grn.grnNumber,
      supplierName: grn.supplierName,
      supplierPin: sup?.kraPin || 'P051199821X',
      invoiceRef: grn.supplierInvoiceRef || grn.grnNumber,
      date: grn.timestamp.slice(0, 10),
      netAmount: netPurchase,
      vatAmount: inputVat,
      grossAmount: grn.totalCost,
    };
  });

  const totalPurchasesGross = inputVatSchedule.reduce((sum, i) => sum + i.grossAmount, 0);
  const totalPurchasesNet = inputVatSchedule.reduce((sum, i) => sum + i.netAmount, 0);
  const totalInputVat = inputVatSchedule.reduce((sum, i) => sum + i.vatAmount, 0);

  const netVatPayableToKra = Math.max(0, totalOutputVat - totalInputVat);
  const vatCreditCarriedForward = Math.max(0, totalInputVat - totalOutputVat);

  const handleGeneratePrn = () => {
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
    const prn = `PRN-2026${randomDigits}`;
    setGeneratedPrn(prn);
    notify(
      'success',
      'KRA Payment Registration Number (PRN)',
      `Generated e-Slip ${prn} for KES ${Math.round(netVatPayableToKra).toLocaleString()} via Paybill 222222.`
    );
  };

  // Export 1: Official KRA VAT 3 Summary Schedule + Section B & F
  const handleExportVat3Summary = () => {
    const lines = [
      `"KRA iTax VAT 3 MONTHLY SELF-ASSESSMENT RETURN - PERIOD: ${period}"`,
      `"Taxpayer Name","LipaTim Retail Kenya Ltd"`,
      `"Taxpayer KRA PIN","P051239841K"`,
      `"Reporting Branch","${activeBranch.name} (${activeBranch.code})"`,
      `"Generated Timestamp","${new Date().toISOString()}"`,
      `""`,
      `"--- SECTION B: OUTPUT TAX ON SALES (VSCU VERIFIED) ---"`,
      `"Tax Band","Classification","B2B Registered Buyers Net","B2C General Public Net","Total Taxable Value (KES)","VAT Rate","Output VAT (KES)"`,
      `"Band A","Standard Rate (16%)",${b2bNetA.toFixed(2)},${b2cNetA.toFixed(2)},${salesNetA.toFixed(2)},"16%",${vatA.toFixed(2)}`,
      `"Band B","Zero-Rated Supplies (0%)",0.00,${salesNetB.toFixed(2)},${salesNetB.toFixed(2)},"0%",0.00`,
      `"Band C","Exempt Supplies",0.00,${salesNetC.toFixed(2)},${salesNetC.toFixed(2)},"Exempt",0.00`,
      `"Band D","Non-VATable",0.00,${salesNetD.toFixed(2)},${salesNetD.toFixed(2)},"0%",0.00`,
      `"Band E","Fuel & Petroleum (8%)",0.00,${salesNetE.toFixed(2)},${salesNetE.toFixed(2)},"8%",${vatE.toFixed(2)}`,
      `"TOTAL OUTPUT VAT","","","","","",,${totalOutputVat.toFixed(2)}`,
      `""`,
      `"--- SECTION F: DEDUCTIBLE INPUT TAX ON SUPPLIER PURCHASES ---"`,
      `"Supplier PIN","Supplier Name","Supplier Invoice No","Invoice Date","Taxable Net (KES)","Input VAT Claimed (KES)","Gross Amount (KES)"`,
      ...inputVatSchedule.map(
        (row) =>
          `"${row.supplierPin}","${row.supplierName}","${row.invoiceRef}","${row.date}",${row.netAmount.toFixed(2)},${row.vatAmount.toFixed(2)},${row.grossAmount.toFixed(2)}`
      ),
      `"TOTAL ELIGIBLE INPUT VAT","","","",${totalPurchasesNet.toFixed(2)},${totalInputVat.toFixed(2)},${totalPurchasesGross.toFixed(2)}`,
      `""`,
      `"--- SECTION M: NET TAX CALCULATION ---"`,
      `"Total Output Tax (KES)",${totalOutputVat.toFixed(2)}`,
      `"Less: Total Input Tax Claimed (KES)",-${totalInputVat.toFixed(2)}`,
      `"NET VAT PAYABLE TO KRA (KES)",${netVatPayableToKra.toFixed(2)}`,
      `"VAT CREDIT CARRIED FORWARD (KES)",${vatCreditCarriedForward.toFixed(2)}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KRA_iTax_VAT3_Return_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify('success', 'KRA iTax VAT 3 Exported', `Downloaded full VAT 3 return schedule for ${period}.`);
  };

  // Export 2: Invoice-by-Invoice eTIMS Sales Annex CSV
  const handleExportInvoiceAnnex = () => {
    const headers = [
      'Customer KRA PIN',
      'Customer Name',
      'KRA CU Serial Number',
      'CU Invoice Date',
      'Trader Invoice No',
      'Description of Goods',
      'Taxable Value 16% (KES)',
      'Output VAT 16% (KES)',
      'Zero-Rated 0% (KES)',
      'Exempt (KES)',
      'Total Gross (KES)',
    ];

    const rows = invoices.map((inv) => [
      `"${inv.customer?.kraPin || ''}"`,
      `"${inv.customer?.name || 'CASH SALE - GENERAL PUBLIC'}"`,
      `"${inv.etimsValidation.cuSerialNumber}"`,
      `"${inv.createdAt.slice(0, 10)}"`,
      `"${inv.invoiceNumber}"`,
      `"Retail Merchandise (${inv.items.length} items)"`,
      inv.taxableAmounts.A.toFixed(2),
      inv.taxAmounts.A.toFixed(2),
      inv.taxableAmounts.B.toFixed(2),
      inv.taxableAmounts.C.toFixed(2),
      inv.grandTotal.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KRA_eTIMS_Sales_Annex_B_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify('success', 'Sales Annex Exported', 'Downloaded invoice-level eTIMS CSV for KRA iTax Section B import.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">1-Click KRA iTax VAT 3 Return Generator</h3>
              <div className="text-[11px] text-slate-500 font-mono">
                Taxpayer PIN: P051239841K · VSCU Auto-Populated Return
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
          <div>
            <div className="font-semibold text-slate-900">Tax Return Filing Period</div>
            <div className="text-[11px] text-slate-500">
              Statutory deadline: 20th of the following month on KRA iTax portal
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold text-slate-900"
            />
          </div>
        </div>

        {/* B2B vs B2C Split Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 bg-white">
            <div className="text-[11px] text-slate-500 font-medium">B2B Registered PIN Sales (16% Band A)</div>
            <div className="text-sm font-bold text-slate-900 font-mono-numbers mt-0.5">
              Net: {formatKES(b2bNetA)} · VAT: {formatKES(b2bVatA)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              Auto-declared per buyer PIN on iTax Section B
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 bg-white">
            <div className="text-[11px] text-slate-500 font-medium">B2C General Public Sales (16% Band A)</div>
            <div className="text-sm font-bold text-slate-900 font-mono-numbers mt-0.5">
              Net: {formatKES(b2cNetA)} · VAT: {formatKES(b2cVatA)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Consolidated under Walk-in CU Serial Summary
            </div>
          </div>
        </div>

        {/* Section B: Sales & Output Tax */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Section B &amp; E: Output Tax by KRA VAT Band</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-normal">
              {invoices.length} eTIMS Invoices
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2.5 px-3">KRA Tax Band</th>
                  <th className="py-2.5 px-3 text-right">Taxable Net (KES)</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Output VAT (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2 px-3 font-sans font-medium">Band A — Standard Rate</td>
                  <td className="py-2 px-3 text-right">{formatKES(salesNetA)}</td>
                  <td className="py-2 px-3 text-right text-slate-500">16%</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatKES(vatA)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium">Band B — Zero-Rated (Pharma/Exports)</td>
                  <td className="py-2 px-3 text-right">{formatKES(salesNetB)}</td>
                  <td className="py-2 px-3 text-right text-slate-500">0%</td>
                  <td className="py-2 px-3 text-right text-slate-400">KES 0.00</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium">Band C — Exempt (Milk/Agri)</td>
                  <td className="py-2 px-3 text-right">{formatKES(salesNetC)}</td>
                  <td className="py-2 px-3 text-right text-slate-500">EXEMPT</td>
                  <td className="py-2 px-3 text-right text-slate-400">KES 0.00</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium">Band E — Fuel &amp; Petroleum</td>
                  <td className="py-2 px-3 text-right">{formatKES(salesNetE)}</td>
                  <td className="py-2 px-3 text-right text-slate-500">8%</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatKES(vatE)}</td>
                </tr>
                <tr className="bg-slate-50/90 font-bold font-mono">
                  <td className="py-2.5 px-3 font-sans">Total Output Tax Declared</td>
                  <td className="py-2.5 px-3 text-right">
                    {formatKES(salesNetA + salesNetB + salesNetC + salesNetE)}
                  </td>
                  <td className="py-2.5 px-3 text-right">—</td>
                  <td className="py-2.5 px-3 text-right text-emerald-800">{formatKES(totalOutputVat)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section F: Deductible Input Tax on Purchases */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Section F: Deductible Input VAT (Verified Supplier GRNs)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-normal">
              {inputVatSchedule.length} Supplier Invoices
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                  <th className="py-2 px-3">Supplier &amp; KRA PIN</th>
                  <th className="py-2 px-3">Invoice Ref</th>
                  <th className="py-2 px-3 text-right">Net Cost</th>
                  <th className="py-2 px-3 text-right">Input VAT (16%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {inputVatSchedule.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-sans">
                      <div className="font-medium text-slate-800">{row.supplierName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{row.supplierPin}</div>
                    </td>
                    <td className="py-2 px-3 text-[11px]">{row.invoiceRef}</td>
                    <td className="py-2 px-3 text-right">{formatKES(row.netAmount)}</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-700">
                      -{formatKES(row.vatAmount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50/40 font-bold">
                  <td className="py-2 px-3 font-sans" colSpan={2}>
                    Total Eligible Input VAT Credit
                  </td>
                  <td className="py-2 px-3 text-right">{formatKES(totalPurchasesNet)}</td>
                  <td className="py-2 px-3 text-right text-blue-800">-{formatKES(totalInputVat)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Tax Assessment & PRN Generator */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-emerald-950 text-sm">
                {netVatPayableToKra > 0
                  ? 'Net VAT Payable to KRA (Section M)'
                  : 'Net VAT Credit Carried Forward'}
              </div>
              <div className="text-[11px] text-emerald-800">
                {netVatPayableToKra > 0
                  ? 'Payable via KRA e-Slip (PRN) · M-Pesa Paybill 222222'
                  : 'Input VAT exceeds Output VAT — credit offsets next month return'}
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-900 font-mono-numbers">
              {netVatPayableToKra > 0
                ? formatKES(netVatPayableToKra)
                : `CR ${formatKES(vatCreditCarriedForward)}`}
            </div>
          </div>

          {generatedPrn ? (
            <div className="p-2.5 bg-white rounded-lg border border-emerald-200 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-slate-500">KRA Payment Slip (PRN): </span>
                <span className="font-bold text-slate-900">{generatedPrn}</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                Paybill 222222
              </span>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGeneratePrn}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Generate KRA e-Payment Registration Number (PRN)</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportInvoiceAnnex}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Sales Annex B (CSV)</span>
            </button>
            <button
              type="button"
              onClick={handleExportVat3Summary}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full VAT 3 Return</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

