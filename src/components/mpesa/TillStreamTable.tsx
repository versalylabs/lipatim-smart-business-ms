import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { MpesaTransaction, MpesaChannel } from '../../types/sales';
import {
  SmartphoneNfc,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  PlusCircle,
  Link,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface TillStreamTableProps {
  onSelectTransactionToReconcile?: (tx: MpesaTransaction) => void;
}

export const TillStreamTable: React.FC<TillStreamTableProps> = ({
  onSelectTransactionToReconcile,
}) => {
  const {
    mpesaTransactions,
    invoices,
    reconcileMpesaTransaction,
    simulateIncomingMpesaPayment,
    checkDuplicateMpesaCode,
  } = useApp();

  const [filter, setFilter] = useState<'ALL' | 'UNCLAIMED' | 'RECONCILED'>('ALL');
  const [search, setSearch] = useState('');

  // Simulation form modal state
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simAmount, setSimAmount] = useState('2500');
  const [simName, setSimName] = useState('KIPROP CHEPTEGEI');
  const [simPhone, setSimPhone] = useState('+254 714 882 109');
  const [simChannel, setSimChannel] = useState<MpesaChannel>('BUY_GOODS');

  // Reconcile modal
  const [reconcileTx, setReconcileTx] = useState<MpesaTransaction | null>(null);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState('');

  const filteredTransactions = mpesaTransactions.filter((tx) => {
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'UNCLAIMED' && tx.status === 'UNCLAIMED') ||
      (filter === 'RECONCILED' && tx.status === 'RECONCILED');

    const query = search.toLowerCase();
    const matchesSearch =
      tx.receiptNumber.toLowerCase().includes(query) ||
      tx.customerName.toLowerCase().includes(query) ||
      tx.phoneNumber.includes(query) ||
      (tx.linkedInvoiceNumber && tx.linkedInvoiceNumber.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAmount || !simName) return;

    simulateIncomingMpesaPayment(parseFloat(simAmount), simName, simPhone, simChannel);
    setShowSimulateModal(false);
  };

  const handleExecuteReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileTx || !selectedInvoiceNumber) return;

    reconcileMpesaTransaction(reconcileTx.id, selectedInvoiceNumber);
    setReconcileTx(null);
    setSelectedInvoiceNumber('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header & Filters */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SmartphoneNfc className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">M-Pesa Till &amp; Paybill Stream</h2>
            <div className="text-[11px] text-slate-500">
              Live C2B transaction feed matching Till 8841920 &amp; Paybill 522522
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Filter Buttons */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({mpesaTransactions.length})
            </button>
            <button
              onClick={() => setFilter('UNCLAIMED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'UNCLAIMED'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unclaimed ({mpesaTransactions.filter((t) => t.status === 'UNCLAIMED').length})
            </button>
            <button
              onClick={() => setFilter('RECONCILED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'RECONCILED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reconciled ({mpesaTransactions.filter((t) => t.status === 'RECONCILED').length})
            </button>
          </div>

          {/* Simulate Payment Trigger */}
          <button
            onClick={() => setShowSimulateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simulate Incoming Till Payment</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search M-Pesa receipt, customer name, phone, or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Receipt Code</th>
              <th className="py-3 px-3">Customer &amp; Phone</th>
              <th className="py-3 px-3">Channel</th>
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3 text-right">Amount (KES)</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isUnclaimed = tx.status === 'UNCLAIMED';

              return (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <span className="font-bold text-slate-900">{tx.receiptNumber}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{tx.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{tx.phoneNumber}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {tx.channel === 'BUY_GOODS' ? 'Till 8841920' : tx.channel === 'PAYBILL' ? 'Paybill 522522' : 'STK Push'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                    {formatKES(tx.amount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-mono ${
                        isUnclaimed
                          ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {isUnclaimed ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      <span>{tx.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isUnclaimed ? (
                      <button
                        onClick={() => {
                          setReconcileTx(tx);
                          setSelectedInvoiceNumber(invoices[0]?.invoiceNumber || '');
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Link className="w-3 h-3" />
                        <span>Allocate</span>
                      </button>
                    ) : (
                      <span className="font-mono text-[11px] text-slate-500">
                        {tx.linkedInvoiceNumber || 'Allocated'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Simulate Payment Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSimulateSubmit}
            className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Simulate Incoming M-Pesa</h3>
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Amount Paid (KES)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer Sender Name</label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer Phone Number</label>
                <input
                  type="text"
                  required
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Channel</label>
                <select
                  value={simChannel}
                  onChange={(e) => setSimChannel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                >
                  <option value="BUY_GOODS">Buy Goods Till (8841920)</option>
                  <option value="PAYBILL">Paybill Business (522522)</option>
                  <option value="STK_PUSH">STK Push Webhook</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Broadcast Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Allocate to Invoice Modal */}
      {reconcileTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteReconcile}
            className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Allocate M-Pesa to Invoice</h3>
              <button
                type="button"
                onClick={() => setReconcileTx(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">M-Pesa Code:</span>
                <span className="font-bold font-mono text-emerald-800">{reconcileTx.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Received:</span>
                <span className="font-bold font-mono-numbers">{formatKES(reconcileTx.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sender:</span>
                <span className="font-medium">{reconcileTx.customerName}</span>
              </div>
            </div>

            <div className="text-xs space-y-1.5">
              <label className="block font-medium text-slate-700">Link to Unsettled Invoice</label>
              <select
                value={selectedInvoiceNumber}
                onChange={(e) => setSelectedInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.invoiceNumber}>
                    {inv.invoiceNumber} - {formatKES(inv.grandTotal)} ({inv.customer?.name || 'Walk-in'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setReconcileTx(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Confirm Allocation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
