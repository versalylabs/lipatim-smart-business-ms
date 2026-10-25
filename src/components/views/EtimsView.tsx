import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import {
  ShieldCheck,
  ExternalLink,
  Code2,
  CheckCircle2,
  Clock,
  Receipt,
  Ban,
} from 'lucide-react';
import { Invoice } from '../../types/sales';
import { ReceiptModal } from '../pos/ReceiptModal';

export const EtimsView: React.FC = () => {
  const {
    invoices,
    isOnline,
    syncOfflineQueue,
    pendingSyncCount,
    voidInvoice,
    permissions,
    businessProfile,
  } = useApp();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewJson, setViewJson] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">KRA eTIMS Compliance Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official Virtual Sales Control Unit (VSCU/OSCU) audit logs, cryptographic signatures, and verification URLs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pendingSyncCount > 0 && (
            <button
              onClick={syncOfflineQueue}
              disabled={!isOnline}
              className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm"
            >
              Push {pendingSyncCount} Queued to KRA
            </button>
          )}
          <span className="text-xs font-mono px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>KRA Trader PIN: {businessProfile.kraPin} (Active)</span>
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Transmitted Fiscal Invoices</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
            {invoices.length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Tax compliance record</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Pending Offline Queue</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
            {pendingSyncCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isOnline ? 'Network ready for sync' : 'Offline: waiting for Safaricom/ISP'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Control Unit Architecture</div>
          <div className="text-sm font-bold text-slate-900 font-mono mt-1">
            KRA-VSCU / OSCU v2.1
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cryptographic SHA-256 HMAC &amp; QR Matrix
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">eTIMS Transmission Log</h2>
          <span className="text-xs text-slate-500 font-mono">{invoices.length} fiscal records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Date &amp; Time</th>
                <th className="py-3 px-3">KRA CU Serial Number</th>
                <th className="py-3 px-3">Buyer PIN</th>
                <th className="py-3 px-3 text-right">Taxable Amt</th>
                <th className="py-3 px-3 text-right">VAT (16%)</th>
                <th className="py-3 px-3 text-right">Total (KES)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const isVoided = inv.paymentStatus === 'REFUNDED';
                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/70 transition-colors ${isVoided ? 'opacity-60 bg-slate-50/40' : ''}`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      <div>{inv.invoiceNumber}</div>
                      {isVoided && (
                        <span className="text-[10px] text-rose-600 font-bold">CREDIT NOTE ISSUED</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                      {inv.etimsValidation.cuSerialNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {inv.customer?.kraPin || <span className="text-slate-400">Not Provided</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                      {formatKES(inv.subtotal - inv.totalTax)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                      {formatKES(inv.totalTax)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      {formatKES(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                          isVoided
                            ? 'bg-rose-50 text-rose-700'
                            : inv.etimsValidation.status === 'TRANSMITTED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {inv.etimsValidation.status === 'TRANSMITTED' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{isVoided ? 'VOIDED' : inv.etimsValidation.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReceiptInvoice(inv)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 rounded bg-slate-100 hover:bg-emerald-50 transition-colors font-mono text-[11px]"
                          title="Reprint Thermal Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5 inline mr-1" />
                          Receipt
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setViewJson(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded bg-slate-100 hover:bg-slate-200 transition-colors font-mono text-[11px]"
                          title="Inspect VSCU JSON Payload"
                        >
                          <Code2 className="w-3.5 h-3.5 inline mr-1" />
                          JSON
                        </button>
                        {permissions.canVoidInvoice && !isVoided && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Issue KRA eTIMS Credit Note (Void) for ${inv.invoiceNumber} and return items to stock?`
                                )
                              ) {
                                voidInvoice(inv.id, 'Customer Return / Credit Note');
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 rounded bg-rose-50 hover:bg-rose-100 transition-colors font-mono text-[11px]"
                            title="Issue KRA Credit Note & Restore Stock"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedInvoice && viewJson && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-xl p-5 sm:p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official KRA VSCU Payload</h3>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedInvoice.invoiceNumber} · {selectedInvoice.etimsValidation.cuSerialNumber}
                </div>
              </div>
              <button
                onClick={() => setViewJson(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs">
              <pre>{JSON.stringify(selectedInvoice.etimsTransmission, null, 2)}</pre>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <a
                href={selectedInvoice.etimsValidation.qrCodeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Live KRA iTax Confirmation Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setViewJson(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Reprint Modal */}
      {receiptInvoice && (
        <ReceiptModal invoice={receiptInvoice} onClose={() => setReceiptInvoice(null)} />
      )}
    </div>
  );
};
