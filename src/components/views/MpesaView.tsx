import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { DarajaStkModal } from '../mpesa/DarajaStkModal';
import { TillStreamTable } from '../mpesa/TillStreamTable';
import { DarajaConfigModal } from '../mpesa/DarajaConfigModal';
import {
  SmartphoneNfc,
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
  Settings,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const MpesaView: React.FC = () => {
  const {
    mpesaTransactions,
    invoices,
    darajaConfig,
    addMpesaTransaction,
    notify,
  } = useApp();

  // Test STK Push states
  const [stkModalOpen, setStkModalOpen] = useState(false);
  const [testPhone] = useState('0722100200');
  const [testAmount] = useState('1500');

  // Config modal
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Fraud / Duplicate Verification tool
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    checked: boolean;
    isDuplicate: boolean;
    message: string;
  } | null>(null);

  // Financial aggregates
  const totalMpesaVolume = mpesaTransactions.reduce((sum, t) => sum + t.amount, 0);
  const reconciledTxs = mpesaTransactions.filter((t) => t.status === 'RECONCILED');
  const unclaimedTxs = mpesaTransactions.filter((t) => t.status === 'UNCLAIMED');

  const reconciledAmount = reconciledTxs.reduce((sum, t) => sum + t.amount, 0);
  const unclaimedAmount = unclaimedTxs.reduce((sum, t) => sum + t.amount, 0);

  // Compare with POS invoices
  let totalPosMpesaRecorded = 0;
  invoices.forEach((inv) => {
    inv.payments.forEach((p) => {
      if (p.method.startsWith('MPESA')) totalPosMpesaRecorded += p.amount;
    });
  });

  const reconciliationDelta = totalPosMpesaRecorded - reconciledAmount;

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    const clean = verificationCode.trim().toUpperCase();
    const existing = mpesaTransactions.find((t) => t.receiptNumber.toUpperCase() === clean);

    if (existing) {
      setVerificationResult({
        checked: true,
        isDuplicate: existing.status === 'RECONCILED',
        message:
          existing.status === 'RECONCILED'
            ? `WARNING: Code ${clean} was ALREADY REDEEMED for Invoice ${existing.linkedInvoiceNumber || 'Sale'} (${formatKES(existing.amount)}) on ${new Date(existing.timestamp).toLocaleDateString()}. Reject customer claim!`
            : `VALID UNCLAIMED PAYMENT: Code ${clean} is a verified incoming payment of ${formatKES(existing.amount)} from ${existing.customerName}. Ready to claim!`,
      });
    } else {
      setVerificationResult({
        checked: true,
        isDuplicate: false,
        message: `CODE NOT FOUND: No Safaricom transaction found with code ${clean} on Till ${darajaConfig.tillNumber}. Check if customer sent to the correct Till number.`,
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Safaricom Daraja M-Pesa Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Daraja STK Push engine, Till {darajaConfig.tillNumber} stream, and end-of-shift fraud prevention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>API Credentials</span>
          </button>

          <button
            onClick={() => setStkModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
          >
            <SmartphoneNfc className="w-4 h-4" />
            <span>Test STK Push Prompt</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Total Gateway Volume</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
            {formatKES(totalMpesaVolume)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
            {mpesaTransactions.length} processed transactions
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Reconciled to POS Sales</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono-numbers mt-1">
            {formatKES(reconciledAmount)}
          </div>
          <div className="text-[11px] text-emerald-800 mt-1 font-mono-numbers">
            {reconciledTxs.length} matched sales
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Unclaimed Till Balance</div>
          <div className="text-2xl font-bold text-amber-700 font-mono-numbers mt-1">
            {formatKES(unclaimedAmount)}
          </div>
          <div className="text-[11px] text-amber-800 mt-1 font-mono-numbers">
            {unclaimedTxs.length} waiting cashier claim
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">End-of-Shift Reconcile Variance</div>
          <div
            className={`text-2xl font-bold font-mono-numbers mt-1 ${
              reconciliationDelta === 0 ? 'text-emerald-700' : 'text-slate-900'
            }`}
          >
            {formatKES(reconciliationDelta)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {reconciliationDelta === 0 ? '100% Balanced Books' : 'Reconciliation variance'}
          </div>
        </div>
      </div>

      {/* Fraud Prevention & Duplicate Verification Tool */}
      <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <h2 className="text-sm font-bold text-slate-900">
            Anti-Fraud M-Pesa Receipt Code Verification
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Prevent double-spending and forged SMS receipts. Verify if an incoming M-Pesa code genuinely hit your Safaricom Till and whether it was already credited to another sale.
        </p>

        <form onSubmit={handleVerifyCode} className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <input
            type="text"
            placeholder="Enter customer M-Pesa code (e.g. SJA9921KM0 or SJB1094PL2)..."
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            Verify Code
          </button>
        </form>

        {verificationResult && (
          <div
            className={`p-3 rounded-lg border text-xs font-mono mt-2 ${
              verificationResult.isDuplicate
                ? 'bg-rose-50 border-rose-200 text-rose-950 font-bold'
                : verificationResult.message.includes('VALID')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold'
                : 'bg-amber-50 border-amber-200 text-amber-950 font-medium'
            }`}
          >
            <div className="flex items-start gap-2">
              {verificationResult.isDuplicate ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>{verificationResult.message}</div>
            </div>
          </div>
        )}
      </div>

      {/* Till Stream Table Component */}
      <TillStreamTable />

      {/* Daraja STK Push Simulation Modal */}
      {stkModalOpen && (
        <DarajaStkModal
          amount={parseFloat(testAmount) || 1500}
          phone={testPhone}
          onSuccess={(code, ph) => {
            addMpesaTransaction({
              receiptNumber: code,
              phoneNumber: ph,
              customerName: 'STK Push Customer',
              amount: parseFloat(testAmount) || 1500,
              channel: 'STK_PUSH',
              status: 'UNCLAIMED',
            });
            notify(
              'success',
              'STK Payment Confirmed',
              `Received ${formatKES(parseFloat(testAmount))} via M-Pesa from ${ph}. Ref: ${code}`
            );
            setStkModalOpen(false);
          }}
          onCancel={() => setStkModalOpen(false)}
        />
      )}

      {/* Daraja Config Modal */}
      {configModalOpen && <DarajaConfigModal onClose={() => setConfigModalOpen(false)} />}
    </div>
  );
};
