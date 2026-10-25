import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES, validateKraPin } from '../../utils/kenya';
import { DebtRecord, Customer } from '../../types/sales';
import {
  BookOpenCheck,
  Send,
  Smartphone,
  Plus,
  Lock,
  Unlock,
  Edit2,
  Share2,
} from 'lucide-react';

export const MadeniView: React.FC = () => {
  const {
    debts,
    customers,
    settleDebt,
    toggleCustomerCreditBlock,
    setCustomerCreditLimit,
    addCustomer,
    notify,
  } = useApp();

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'SETTLED'>('ALL');
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState<'MPESA_STK' | 'CASH'>('MPESA_STK');
  const [smsModalDebt, setSmsModalDebt] = useState<DebtRecord | null>(null);
  const [smsLanguage, setSmsLanguage] = useState<'swahili' | 'english'>('swahili');

  // Customer Management Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingLimitCust, setEditingLimitCust] = useState<Customer | null>(null);
  const [newLimitInput, setNewLimitInput] = useState('');

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPin, setNewCustPin] = useState('');
  const [newCustLocation, setNewCustLocation] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('20000');

  const totalOutstanding = debts.reduce((sum, d) => sum + d.balanceRemaining, 0);
  const overdueDebts = debts.filter((d) => d.status === 'OVERDUE');
  const activeDebts = debts.filter((d) => d.status === 'ACTIVE');
  const settledDebts = debts.filter((d) => d.status === 'SETTLED');

  const filteredDebts = debts.filter((d) => {
    if (filter === 'ALL') return true;
    return d.status === filter;
  });

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    const amt = parseFloat(settleAmount);
    if (!amt || amt <= 0) return;
    if (amt > selectedDebt.balanceRemaining) {
      notify(
        'warning',
        'Overpayment Blocked',
        `Settlement amount cannot exceed remaining balance of ${formatKES(selectedDebt.balanceRemaining)}.`
      );
      return;
    }

    settleDebt(selectedDebt.id, amt, settleMethod);
    setSelectedDebt(null);
    setSettleAmount('');
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    if (newCustPin.trim()) {
      const pinCheck = validateKraPin(newCustPin);
      if (!pinCheck.isValid) {
        notify('error', 'Invalid KRA PIN', pinCheck.error || 'Format must be P051239841K');
        return;
      }
    }

    addCustomer({
      name: newCustName,
      phone: newCustPhone,
      kraPin: newCustPin ? newCustPin.trim().toUpperCase() : undefined,
      location: newCustLocation || undefined,
      creditLimit: parseFloat(newCustLimit) || 10000,
    });

    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustPin('');
    setNewCustLocation('');
  };

  const handleUpdateLimitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLimitCust) return;
    const limitNum = parseFloat(newLimitInput);
    if (isNaN(limitNum) || limitNum < 0) return;

    setCustomerCreditLimit(editingLimitCust.id, limitNum);
    setEditingLimitCust(null);
  };

  const getSmsTemplate = (debt: DebtRecord) => {
    if (smsLanguage === 'swahili') {
      return `Habari ${debt.customerName}, tunakukumbusha kulipa salio la deni lako la KES ${debt.balanceRemaining.toLocaleString()} lililotakiwa kabla ya ${debt.dueDate}. Unaweza kulipa kwa M-Pesa Till 8841920. Asante kwa biashara yako - LipaTim Retail.`;
    }
    return `Dear ${debt.customerName}, kindly remember to settle your outstanding store credit balance of KES ${debt.balanceRemaining.toLocaleString()} due on ${debt.dueDate}. Pay via M-Pesa Till 8841920. Thank you for your continued partnership - LipaTim Retail.`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Customer Credit (Madeni) Ledger</h1>
            <span className="text-xs font-mono bg-rose-50 text-rose-800 px-2 py-0.5 rounded font-bold border border-rose-200">
              Outstanding: {formatKES(totalOutstanding)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enforce strict customer credit limits, manage 14-day repayment schedules, and send automated bilingual SMS reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Debtor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Total Credit Outstanding</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
            {formatKES(totalOutstanding)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
            {debts.length} historical debt entries
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Overdue Accounts (&gt;14 days)</div>
          <div className="text-2xl font-bold text-rose-600 font-mono-numbers mt-1">
            {overdueDebts.length}
          </div>
          <div className="text-[11px] text-rose-700 mt-1">Immediate SMS collection required</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Active Nominal Debtors</div>
          <div className="text-2xl font-bold text-amber-700 font-mono-numbers mt-1">
            {activeDebts.length}
          </div>
          <div className="text-[11px] text-amber-800 mt-1">Within agreed repayment terms</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Settled Credit Rate</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono-numbers mt-1">
            {Math.round((settledDebts.length / (debts.length || 1)) * 100)}%
          </div>
          <div className="text-[11px] text-emerald-800 mt-1">{settledDebts.length} settled accounts</div>
        </div>
      </div>

      {/* Customer Credit Directory & Limit Management */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Customer Credit Limits &amp; Defaulter Controls</h2>
            <div className="text-[11px] text-slate-500">
              Manage maximum allowed exposure and toggle credit access to prevent chronic bad debts
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">{customers.length} registered clients</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {customers.map((cust) => {
            const utilizationPercent = Math.min(
              100,
              Math.round((cust.currentDebt / (cust.creditLimit || 1)) * 100)
            );

            return (
              <div
                key={cust.id}
                className={`p-3.5 rounded-xl border transition-all text-xs ${
                  cust.isCreditBlocked
                    ? 'border-rose-300 bg-rose-50/40'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{cust.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{cust.phone}</div>
                    {cust.kraPin && (
                      <div className="text-[10px] text-slate-400 font-mono">PIN: {cust.kraPin}</div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleCustomerCreditBlock(cust.id)}
                    className={`p-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      cust.isCreditBlocked
                        ? 'border-rose-300 bg-rose-100 text-rose-800'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                    title={cust.isCreditBlocked ? 'Click to restore credit' : 'Click to freeze credit'}
                  >
                    {cust.isCreditBlocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Blocked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Allowed</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Current Debt:</span>
                    <span className="font-bold text-slate-900 font-mono-numbers">
                      {formatKES(cust.currentDebt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Credit Limit:</span>
                    <button
                      onClick={() => {
                        setEditingLimitCust(cust);
                        setNewLimitInput(cust.creditLimit.toString());
                      }}
                      className="font-bold text-emerald-700 hover:underline flex items-center gap-1 font-mono-numbers"
                      title="Edit Credit Limit"
                    >
                      <span>{formatKES(cust.creditLimit)}</span>
                      <Edit2 className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        utilizationPercent >= 90
                          ? 'bg-rose-600'
                          : utilizationPercent >= 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-right font-mono text-slate-400">
                    {utilizationPercent}% of limit used
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Debts &amp; Repayment Schedule</h2>
              <div className="text-[11px] text-slate-500">
                14-day credit cycles with automated KRA invoice reconciliation
              </div>
            </div>
          </div>

          {/* Segmented Filter */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium max-w-full overflow-x-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({debts.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === 'ACTIVE' ? 'bg-white text-amber-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeDebts.length})
            </button>
            <button
              onClick={() => setFilter('OVERDUE')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === 'OVERDUE' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overdue ({overdueDebts.length})
            </button>
            <button
              onClick={() => setFilter('SETTLED')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === 'SETTLED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Settled ({settledDebts.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Debtor / Customer</th>
                <th className="py-3 px-3">Linked Invoice</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Initial Debt</th>
                <th className="py-3 px-3 text-right">Amount Paid</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.map((d) => {
                const isOverdue = d.status === 'OVERDUE';
                const isSettled = d.status === 'SETTLED';

                return (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{d.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.customerPhone}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{d.invoiceNumber}</td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {d.dueDate}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-500">
                      {formatKES(d.initialAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-emerald-700 font-medium">
                      {formatKES(d.amountPaid)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      {formatKES(d.balanceRemaining)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                          isSettled
                            ? 'bg-slate-100 text-slate-600'
                            : isOverdue
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isSettled && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSmsModalDebt(d)}
                            className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                            title="Send SMS Reminder"
                          >
                            <Send className="w-3 h-3 text-blue-600" />
                            <span>Remind</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDebt(d);
                              setSettleAmount(d.balanceRemaining.toString());
                            }}
                            className="px-3 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                          >
                            Settle
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Debt Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSettle}
            className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Settle Madeni Payment</h3>
              <button
                type="button"
                onClick={() => setSelectedDebt(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-semibold text-slate-800">{selectedDebt.customerName}</div>
              <div className="text-slate-500 font-mono">Invoice: {selectedDebt.invoiceNumber}</div>
              <div className="text-slate-500">
                Outstanding Balance: <span className="font-bold text-rose-700 font-mono-numbers">{formatKES(selectedDebt.balanceRemaining)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Amount to Pay (KES)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max={selectedDebt.balanceRemaining}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                >
                  <option value="MPESA_STK">M-Pesa (Buy Goods Till 8841920)</option>
                  <option value="CASH">Cash Drawer</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedDebt(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Confirm Settlement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SMS Reminder Modal */}
      {smsModalDebt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Bilingual SMS Debt Prompt</h3>
              </div>
              <button onClick={() => setSmsModalDebt(null)} className="text-slate-400 hover:text-slate-700 text-lg">
                &times;
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">Language:</span>
              <button
                onClick={() => setSmsLanguage('swahili')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  smsLanguage === 'swahili' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Swahili
              </button>
              <button
                onClick={() => setSmsLanguage('english')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  smsLanguage === 'english' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                English
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 leading-relaxed">
              {getSmsTemplate(smsModalDebt)}
            </div>

            <div className="text-[11px] text-slate-500">
              Recipient Phone: <strong className="font-mono text-slate-800">{smsModalDebt.customerPhone}</strong>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSmsModalDebt(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(getSmsTemplate(smsModalDebt));
                  const phone = smsModalDebt.customerPhone.replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                  notify('success', 'WhatsApp Dispatched', `Reminder opened for ${smsModalDebt.customerName}.`);
                  setSmsModalDebt(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Debtor / Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCustomerSubmit}
            className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Register Customer / Debtor</h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer / Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mama Wambui Groceries"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Safaricom Mobile Phone</label>
                <input
                  type="text"
                  required
                  placeholder="0712 345 678"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">KRA PIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="P051239841K"
                    value={newCustPin}
                    onChange={(e) => setNewCustPin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Credit Limit (KES)</label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={newCustLimit}
                    onChange={(e) => setNewCustLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Location / Stall Number</label>
                <input
                  type="text"
                  placeholder="e.g. Stall #44 Ngara Market or River Rd"
                  value={newCustLocation}
                  onChange={(e) => setNewCustLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Register Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Credit Limit Modal */}
      {editingLimitCust && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateLimitSubmit}
            className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Set Credit Limit</h3>
              <button
                type="button"
                onClick={() => setEditingLimitCust(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-semibold text-slate-800">{editingLimitCust.name}</div>
              <div className="text-slate-500 font-mono">Current Limit: {formatKES(editingLimitCust.creditLimit)}</div>
            </div>

            <div className="text-xs space-y-1.5">
              <label className="block font-medium text-slate-700">New Max Credit Ceiling (KES)</label>
              <input
                type="number"
                step="1000"
                min="0"
                required
                value={newLimitInput}
                onChange={(e) => setNewLimitInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingLimitCust(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Save Limit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
