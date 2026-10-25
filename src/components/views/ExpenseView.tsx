import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES, validateKraPin } from '../../utils/kenya';
import { Expense, ExpenseCategory, Supplier } from '../../types/expense';
import {
  Plus,
  Receipt,
  Building2,
  Zap,
  Users,
  CreditCard,
  FileCheck2,
  DollarSign,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const ExpenseView: React.FC = () => {
  const {
    expenses,
    addExpense,
    suppliers,
    supplierPayments,
    paySupplier,
    addSupplier,
    activeBranch,
    permissions,
    notify,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'opex' | 'suppliers' | 'history'>('opex');

  // Modals
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showPaySupplierModal, setShowPaySupplierModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);

  // New Expense form
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('ELECTRICITY_KPLC');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseVendor, setExpenseVendor] = useState('Kenya Power & Lighting Co');
  const [expenseReference, setExpenseReference] = useState('');
  const [expenseMethod, setExpenseMethod] = useState<'CASH' | 'MPESA' | 'BANK'>('MPESA');
  const [kplcMeterNo, setKplcMeterNo] = useState('');
  const [kplcTokens, setKplcTokens] = useState('');

  // Pay Supplier form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'BANK' | 'MPESA' | 'CASH'>('BANK');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Add Supplier form
  const [supName, setSupName] = useState('');
  const [supPin, setSupPin] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supTerms, setSupTerms] = useState('30');
  const [supAddress, setSupAddress] = useState('');

  const totalOpex = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.balancePayable, 0);
  const totalSupplierDisbursed = supplierPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;

    let finalNotes = '';
    if (expenseCategory === 'ELECTRICITY_KPLC' && kplcMeterNo) {
      finalNotes = `Meter: ${kplcMeterNo} · Tokens: ${kplcTokens || 'Prepaid'}`;
    }

    addExpense({
      title: expenseTitle,
      category: expenseCategory,
      amount: parseFloat(expenseAmount),
      vendorOrRecipient: expenseVendor,
      referenceNo: expenseReference,
      paymentMethod: expenseMethod,
      description: finalNotes,
      branchId: activeBranch.id,
    });

    setShowAddExpenseModal(false);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseReference('');
    setKplcMeterNo('');
    setKplcTokens('');
  };

  const handlePaySupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPayment || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > selectedSupplierForPayment.balancePayable) {
      notify(
        'warning',
        'Overpayment Blocked',
        `Disbursement cannot exceed supplier balance payable (${formatKES(selectedSupplierForPayment.balancePayable)}).`
      );
      return;
    }

    paySupplier(
      selectedSupplierForPayment.id,
      amt,
      payMethod,
      payRef || `REF-${Date.now().toString().slice(-6)}`,
      payNotes
    );

    setShowPaySupplierModal(false);
    setSelectedSupplierForPayment(null);
    setPayAmount('');
    setPayRef('');
    setPayNotes('');
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supPhone) return;

    if (supPin.trim()) {
      const check = validateKraPin(supPin);
      if (!check.isValid) {
        notify('error', 'Invalid KRA PIN', check.error || 'Format must be P051239841K');
        return;
      }
    }

    addSupplier({
      name: supName,
      kraPin: supPin ? supPin.trim().toUpperCase() : undefined,
      contactPerson: supContact,
      phone: supPhone,
      address: supAddress,
      paymentTermsDays: parseInt(supTerms) || 30,
    });

    setShowAddSupplierModal(false);
    setSupName('');
    setSupPin('');
    setSupContact('');
    setSupPhone('');
    setSupAddress('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Expenses &amp; Supplier Ledgers</h1>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
              Tax Deductible Opex
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track commercial rent, KPLC electricity tokens, casual wages, and accounts payable to wholesale suppliers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {permissions.canManageExpenses && (
            <>
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Wholesaler</span>
              </button>

              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Record Opex Expense</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Total Operating Costs (Opex)</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
            {formatKES(totalOpex)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
            {expenses.length} logged expense items
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Wholesale Accounts Payable</div>
          <div className="text-2xl font-bold text-rose-600 font-mono-numbers mt-1">
            {formatKES(totalPayables)}
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-mono-numbers">
            {suppliers.filter((s) => s.balancePayable > 0).length} suppliers awaiting settlement
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Supplier Settlements Paid</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono-numbers mt-1">
            {formatKES(totalSupplierDisbursed)}
          </div>
          <div className="text-[11px] text-emerald-800 mt-1 font-mono-numbers">
            {supplierPayments.length} verified disbursements
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl max-w-full overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('opex')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'opex' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Operating Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'suppliers'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Wholesaler Accounts Payable ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Disbursement Audit Log ({supplierPayments.length})
        </button>
      </div>

      {/* Tab 1: Operating Expenses (Opex) */}
      {activeTab === 'opex' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Operating Expenses Audit Log</h2>
              <div className="text-[11px] text-slate-500">
                100% Tax deductible against corporate income tax under Kenyan tax law
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500 font-mono-numbers">{expenses.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Expense Title &amp; Category</th>
                  <th className="py-3 px-3">Recipient / Vendor</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Reference / Token</th>
                  <th className="py-3 px-3">Approved By</th>
                  <th className="py-3 px-4 text-right">Amount (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{e.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
                        {e.category.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{e.vendorOrRecipient}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{e.date}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{e.paymentMethod}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {e.referenceNo || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{e.approvedBy}</td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-900">
                      {formatKES(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Wholesale Supplier Accounts Payable */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Wholesale Supplier Accounts Payable</h2>
              <div className="text-[11px] text-slate-500">
                Track supplier credit terms, purchase volumes, and outstanding invoices
              </div>
            </div>
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
            >
              + Add Wholesaler
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier &amp; KRA PIN</th>
                  <th className="py-3 px-3">Contact Person &amp; Phone</th>
                  <th className="py-3 px-3">Location / Address</th>
                  <th className="py-3 px-3 text-center">Credit Terms</th>
                  <th className="py-3 px-3 text-right">Total Purchased</th>
                  <th className="py-3 px-3 text-right">Balance Payable</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s) => {
                  const hasDebt = s.balancePayable > 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          PIN: {s.kraPin || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{s.contactPerson}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.phone}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">{s.address || 'Nairobi Depot'}</td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {s.paymentTermsDays} Days
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                        {formatKES(s.totalPurchased)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold">
                        <span className={hasDebt ? 'text-rose-700' : 'text-slate-400'}>
                          {formatKES(s.balancePayable)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasDebt && (
                          <button
                            onClick={() => {
                              setSelectedSupplierForPayment(s);
                              setPayAmount(s.balancePayable.toString());
                              setShowPaySupplierModal(true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Pay Wholesaler
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Supplier Payment History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Wholesale Disbursement History</h2>
              <div className="text-[11px] text-slate-500">
                Audited records of EFT bank transfers and M-Pesa settlements to suppliers
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500 font-mono-numbers">
              {supplierPayments.length} disbursements
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Wholesaler</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Reference / EFT Code</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-3">Disbursed By</th>
                  <th className="py-3 px-4 text-right">Amount (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.supplierName}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {new Date(p.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{p.paymentMethod}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{p.referenceNo}</td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[200px]">{p.notes || '—'}</td>
                    <td className="py-3 px-3 text-slate-600">{p.paidBy}</td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-emerald-800">
                      {formatKES(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Opex Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateExpense}
            className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record Operating Expense</h3>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KPLC Prepaid Power Tokens"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => {
                      const cat = e.target.value as ExpenseCategory;
                      setExpenseCategory(cat);
                      if (cat === 'ELECTRICITY_KPLC') setExpenseVendor('Kenya Power & Lighting Co');
                      else if (cat === 'RENT') setExpenseVendor('Prime Plaza Landlords Ltd');
                      else if (cat === 'COUNTY_LICENSES') setExpenseVendor('Nairobi County Government (NRS)');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="ELECTRICITY_KPLC">KPLC Power Tokens</option>
                    <option value="RENT">Commercial Rent &amp; Lease</option>
                    <option value="WATER">Nairobi City Water</option>
                    <option value="STAFF_WAGES">Staff Wages &amp; Advance</option>
                    <option value="COUNTY_LICENSES">County Business Permit</option>
                    <option value="TRANSPORT_LOGISTICS">Transport &amp; Boda</option>
                    <option value="PACKAGING_BAGS">Packaging &amp; Bags</option>
                    <option value="MISCELLANEOUS">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="8500"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {expenseCategory === 'ELECTRICITY_KPLC' && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                  <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>KPLC Prepaid Meter Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Meter No: 3719284102"
                      value={kplcMeterNo}
                      onChange={(e) => setKplcMeterNo(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Token Digits (20 digits)"
                      value={kplcTokens}
                      onChange={(e) => setKplcTokens(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Paid Via</label>
                  <select
                    value={expenseMethod}
                    onChange={(e) => setExpenseMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                  >
                    <option value="MPESA">M-Pesa Paybill / Till</option>
                    <option value="CASH">Cash Drawer</option>
                    <option value="BANK">Bank Transfer (EFT)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vendor / Recipient</label>
                  <input
                    type="text"
                    required
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Reference / M-Pesa Receipt Code</label>
                <input
                  type="text"
                  placeholder="e.g. SJA9182KA9 or NCBA-EFT-991"
                  value={expenseReference}
                  onChange={(e) => setExpenseReference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Log Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {showPaySupplierModal && selectedSupplierForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handlePaySupplierSubmit}
            className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Disburse to Wholesaler</h3>
              <button
                type="button"
                onClick={() => setShowPaySupplierModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedSupplierForPayment.name}</div>
              <div className="text-slate-500 font-mono">PIN: {selectedSupplierForPayment.kraPin || 'N/A'}</div>
              <div className="text-slate-500">
                Outstanding Balance: <span className="font-bold text-rose-700 font-mono-numbers">{formatKES(selectedSupplierForPayment.balancePayable)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Disbursement Amount (KES)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Disbursement Channel</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                >
                  <option value="BANK">Bank Transfer (NCBA / KCB EFT)</option>
                  <option value="MPESA">M-Pesa Business Paybill</option>
                  <option value="CASH">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Bank EFT / M-Pesa Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EFT-NCBA-99410"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes / Invoice Settlement Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Settling Invoice #88192"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPaySupplierModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Disburse Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSupplierSubmit}
            className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Register Wholesale Supplier</h3>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Company / Wholesaler Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bidco Africa Ltd"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">KRA PIN</label>
                  <input
                    type="text"
                    placeholder="P051000987Z"
                    value={supPin}
                    onChange={(e) => setSupPin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={supTerms}
                    onChange={(e) => setSupTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Key Account Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Mary Kamau"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Official Telephone</label>
                  <input
                    type="text"
                    required
                    placeholder="+254 722 000 000"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Depot / Warehouse Address</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Street, Industrial Area"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
