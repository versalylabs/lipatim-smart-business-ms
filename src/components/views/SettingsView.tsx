import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getIndexedDBStats } from '../../utils/offlineDb';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ROLE_PERMISSIONS, UserPermissions, UserRole } from '../../types/user';
import { formatKES, validateKraPin } from '../../utils/kenya';
import { BranchManagerModal } from '../branch/BranchManagerModal';
import {
  ShieldCheck,
  Check,
  X,
  Printer,
  RotateCcw,
  Bluetooth,
  Database,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
  CheckCircle2,
  Zap,
  Users,
  UserPlus,
  Lock,
  Building2,
  LogOut,
  BadgeCheck,
  Store,
  Plus,
  MapPin,
  Phone,
  Boxes,
  Edit2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    session,
    currentTenant,
    logout,
    resetToDemoData,
    notify,
    isOnline,
    toggleSimulatedOffline,
    pendingSyncCount,
    syncOfflineQueue,
    lastSyncedAt,
    printerDevice,
    printerPaperSize,
    setPrinterPaperSize,
    connectBluetoothPrinter,
    connectSimulatedPrinter,
    disconnectPrinter,
    testThermalPrinter,
    invoices,
    products,
    branches,
    activeBranchId,
    setActiveBranchId,
    currentRole,
    setCurrentRole,
    users,
    addStaffUser,
    toggleStaffActive,
    businessProfile,
    updateBusinessProfile,
  } = useApp();

  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [businessName, setBusinessName] = useState(businessProfile.name);
  const [kraPin, setKraPin] = useState(businessProfile.kraPin);
  const [phone, setPhone] = useState(businessProfile.phone);

  // Multi-Branch Manager Modal State
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchModalMode, setBranchModalMode] = useState<'list' | 'add' | 'edit'>('list');
  const [branchToEdit, setBranchToEdit] = useState<string | undefined>(undefined);

  // Add Staff form state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('cashier');
  const [newStaffBranch, setNewStaffBranch] = useState(branches[0]?.id || 'br_cbd');
  const [newStaffPhone, setNewStaffPhone] = useState('+254 7');

  const [idbStats, setIdbStats] = useState({
    cachedInvoicesCount: invoices.length,
    cachedProductsCount: products.length,
    queuedSyncCount: pendingSyncCount,
  });

  useEffect(() => {
    getIndexedDBStats().then((stats) => {
      setIdbStats({
        cachedInvoicesCount: stats.cachedInvoicesCount || invoices.length,
        cachedProductsCount: stats.cachedProductsCount || products.length,
        queuedSyncCount: stats.queuedSyncCount || pendingSyncCount,
      });
    });
  }, [invoices, products, pendingSyncCount]);

  const activeUsersCount = users.filter((u) => u.active).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const pinCheck = validateKraPin(kraPin);
    if (!pinCheck.isValid) {
      notify('error', 'Invalid KRA PIN', pinCheck.error || 'Format must be P051239841K');
      return;
    }
    updateBusinessProfile({
      name: businessName.trim(),
      kraPin: kraPin.trim().toUpperCase(),
      phone: phone.trim(),
    });
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    addStaffUser({
      name: newStaffName.trim(),
      role: newStaffRole,
      assignedBranchId: newStaffBranch,
      phone: newStaffPhone.trim(),
    });
    setNewStaffName('');
    setNewStaffPhone('+254 7');
    setShowAddStaff(false);
  };

  const permissionRows: { key: keyof UserPermissions; label: string; desc: string }[] = [
    {
      key: 'canViewCostPrices',
      label: 'View Cost Price & COGS Margins',
      desc: 'Protects wholesale buying prices from counter staff',
    },
    {
      key: 'canManageInventory',
      label: 'Receive GRN Stock & Adjust Batches',
      desc: 'Log deliveries, supplier POs, and shrinkage write-offs',
    },
    {
      key: 'canVoidInvoice',
      label: 'Issue KRA eTIMS Credit Notes / Voids',
      desc: 'Reverse fiscalized receipts on VSCU/OSCU ledger',
    },
    {
      key: 'canApplyCustomDiscount',
      label: 'Approve Custom Cart Discounts',
      desc: 'Prevent unauthorized margin erosion at POS checkout',
    },
    {
      key: 'canManageExpenses',
      label: 'Log Opex & Pay Supplier Ledgers',
      desc: 'Record rent, KPLC tokens, wages, and supplier payouts',
    },
    {
      key: 'canExportKRAFilings',
      label: 'Export KRA iTax VAT 3 & Shift Z-Reports',
      desc: 'Download official monthly tax CSVs and seal shifts',
    },
    {
      key: 'canManageSettings',
      label: 'Manage RBAC Staff & System Settings',
      desc: 'Add/suspend users, configure roles, and manage hardware pairing',
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            RBAC Security, Dedicated Enterprise Deployment &amp; Hardware Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Multi-Role Access Control (Cashier / Manager / Owner-Admin), dedicated workspace tenant, Web Bluetooth ESC/POS printers, and IndexedDB sync.
          </p>
        </div>

        {/* Interface Theme Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold w-fit">
          <BadgeCheck className="w-4 h-4 text-emerald-600" />
          <span>High-Contrast Light Mode</span>
        </div>
      </div>

      {/* Cashier / Manager RBAC Warning Banner if not Owner/Admin */}
      {currentRole !== 'admin' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900">
                Restricted View — Active Role: {currentRole.toUpperCase()}
              </div>
              <div className="text-amber-700 mt-0.5">
                You are currently previewing LipaTim as a <strong>{currentRole}</strong>. Switch to <strong>Owner (Admin)</strong> to configure staff accounts or hardware.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentRole('admin')}
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg shrink-0 transition-colors"
          >
            Elevate to Owner (Admin)
          </button>
        </div>
      )}

      {/* PHASE 8: MULTI-ROLE RBAC STAFF DIRECTORY & PERMISSIONS MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Staff Accounts & Quota Enforcement */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Multi-Role Staff Accounts &amp; Terminal PINs
                  </h2>
                  <div className="text-[11px] text-slate-500">
                    Active seats: {activeUsersCount} accounts (Dedicated Enterprise System)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddStaff(!showAddStaff)}
                disabled={currentRole !== 'admin'}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Staff Member</span>
              </button>
            </div>

            {/* Add Staff Form */}
            {showAddStaff && (
              <form
                onSubmit={handleAddStaff}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="font-bold text-slate-800">Provision New POS Operator / Manager</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Peter Njoroge"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Assigned Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="cashier">Cashier (POS &amp; M-Pesa Only)</option>
                      <option value="manager">Store Manager (Stock, GRN &amp; Z-Reports)</option>
                      <option value="admin">Owner / Admin (Full ERP Access)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Assigned Outlet</label>
                    <select
                      value={newStaffBranch}
                      onChange={(e) => setNewStaffBranch(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">M-Pesa / SMS Phone</label>
                    <input
                      type="text"
                      required
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddStaff(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg"
                  >
                    Save &amp; Generate PIN
                  </button>
                </div>
              </form>
            )}

            {/* Staff Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase">
                    <th className="py-2 font-semibold">Staff Member</th>
                    <th className="py-2 font-semibold">RBAC Role</th>
                    <th className="py-2 font-semibold">Outlet</th>
                    <th className="py-2 font-semibold">POS PIN</th>
                    <th className="py-2 font-semibold text-right">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const branchObj = branches.find((b) => b.id === u.assignedBranchId);
                    const isSimulatingThisRole = currentRole === u.role && u.active;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 pr-2">
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.phone || '+254 700 000000'}</div>
                        </td>
                        <td className="py-2.5 pr-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                              u.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : u.role === 'manager'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role === 'admin' ? 'OWNER / ADMIN' : u.role}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 text-[11px] text-slate-600">
                          {branchObj?.name.replace(' Branch', '') || u.assignedBranchId}
                        </td>
                        <td className="py-2.5 pr-2 font-mono text-[11px] text-slate-500">
                          {currentRole === 'admin' ? u.pinCode || '****' : '••••'}
                        </td>
                        <td className="py-2.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setCurrentRole(u.role)}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                              isSimulatingThisRole
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isSimulatingThisRole ? 'Active Session' : 'Switch Role'}
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              disabled={currentRole !== 'admin'}
                              onClick={() => toggleStaffActive(u.id)}
                              className={`px-2 py-1 rounded text-[10px] font-semibold disabled:opacity-40 ${
                                u.active
                                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {u.active ? 'Suspend' : 'Activate'}
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

          {/* Deployment Capacity & System Status */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-[10px] text-slate-500">Staff Accounts</div>
              <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                {activeUsersCount} Active
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-[10px] text-slate-500">Branch Counters</div>
              <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                {branches.length} Configured
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-[10px] text-slate-500">eTIMS Transactions</div>
              <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5">
                {invoices.length} Total Recorded
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Granular Role-Based Access Control (RBAC) Matrix */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Role-Based Access Control (RBAC) Matrix
                  </h2>
                  <div className="text-[11px] text-slate-500">
                    Enforced security policies across Cashier, Manager &amp; Owner
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase">
                    <th className="py-2 font-semibold">Security Capability</th>
                    <th className="py-2 font-semibold text-center">Cashier</th>
                    <th className="py-2 font-semibold text-center">Manager</th>
                    <th className="py-2 font-semibold text-center">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissionRows.map((row) => (
                    <tr key={String(row.key)}>
                      <td className="py-2 pr-2">
                        <div className="font-semibold text-slate-800 text-[11px]">{row.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">{row.desc}</div>
                      </td>
                      {(['cashier', 'manager', 'admin'] as UserRole[]).map((role) => {
                        const allowed = ROLE_PERMISSIONS[role][row.key];
                        return (
                          <td key={role} className="py-2 text-center">
                            {allowed ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                                <X className="w-3 h-3" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span>Test RBAC Guards Live:</span>
            <div className="flex items-center gap-1">
              {(['cashier', 'manager', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCurrentRole(r)}
                  className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase font-bold transition-colors ${
                    currentRole === r
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r === 'admin' ? 'OWNER' : r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-BRANCH OUTLETS & LOCATIONS MANAGEMENT */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Store className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Multi-Branch Outlets &amp; Point-of-Sale Counters
              </h2>
              <p className="text-xs text-slate-500">
                Register and manage store branches, distribution hubs, and regional stock counters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBranchToEdit(undefined);
                setBranchModalMode('add');
                setBranchModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Outlet</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBranchModalMode('list');
                setBranchModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <span>Manage All ({branches.length})</span>
            </button>
          </div>
        </div>

        {/* Branch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {branches.map((b) => {
            const isCurrent = b.id === activeBranchId;
            const branchStockUnits = products.reduce(
              (acc, p) => acc + (p.branchStock?.[b.id] || 0),
              0
            );

            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-3 ${
                  isCurrent
                    ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-slate-900 text-sm truncate">{b.name}</div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-bold shrink-0">
                      {b.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {b.isMainWarehouse && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                        HQ Central
                      </span>
                    )}
                    {isCurrent ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        Active Counter
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        Secondary Outlet
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {b.address}, {b.county}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-mono-numbers">{b.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-600 font-mono-numbers flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-slate-400" />
                    <span>{branchStockUnits} in stock</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => setActiveBranchId(b.id)}
                        className="px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                        title="Switch your POS counter to this outlet"
                      >
                        Switch To
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBranchToEdit(b.id);
                        setBranchModalMode('edit');
                        setBranchModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      title="Edit branch details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEDICATED BUSINESS DEPLOYMENT & MULTI-TENANCY SESSION */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Dedicated Enterprise Deployment &amp; Multi-Tenancy</span>
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Bespoke retail engine tailored directly for individual business owners with zero monthly SaaS limits or tier paywalls.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{session?.tenant?.isDemoTenant ? 'Demo Retail Mode' : 'Clean Enterprise Tenant'}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Tenant Details */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Business Profile
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Business Name</div>
              <div className="font-bold text-slate-900 text-sm truncate">
                {session?.tenant?.name || businessProfile.name}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-slate-500 text-[11px]">KRA PIN</div>
                <div className="font-mono font-semibold text-slate-800 truncate">
                  {session?.tenant?.kraPin || businessProfile.kraPin || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[11px]">Phone</div>
                <div className="font-mono font-semibold text-slate-800 truncate">
                  {session?.tenant?.phone || businessProfile.phone}
                </div>
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Tenant Partition Key</div>
              <div className="font-mono text-[10px] text-slate-600 truncate bg-white px-2 py-1 rounded border border-slate-200">
                {session?.tenant?.id || 'tenant_standalone'}
              </div>
            </div>
          </div>

          {/* Database Isolation */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Multi-Tenant Architecture
            </div>
            <div className="text-slate-700 leading-relaxed text-[11px]">
              Every account registered on LipaTim receives an isolated local &amp; IndexedDB store. New businesses start completely fresh with <strong>zero pre-seeded demo items</strong>.
            </div>
            <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[11px] text-slate-600 font-mono">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Isolated Catalog &amp; Inventories</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Isolated Sales &amp; eTIMS Numbers</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Independent Cashier &amp; Staff PINs</span>
              </div>
            </div>
          </div>

          {/* Active Session & Actions */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Current Active Session
              </div>
              <div className="mt-2">
                <div className="font-bold text-slate-900 truncate">
                  {session?.user?.name || 'Authorized User'}
                </div>
                <div className="font-mono text-[11px] text-slate-500 truncate">
                  {session?.user?.email || 'versalylabs@gmail.com'}
                </div>
                <div className="mt-2 inline-block px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-purple-100 text-purple-800">
                  {session?.user?.role || currentRole} Privileges
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              {session && (
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of LipaTim</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 7: OFFLINE-FIRST ARCHITECTURE & HARDWARE INTEGRATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Web Bluetooth ESC/POS Thermal Printer Direct Pairing */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Bluetooth className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Web Bluetooth ESC/POS Thermal Printer
                  </h2>
                  <div className="text-[11px] text-slate-500">
                    Direct GATT pairing for 58mm / 80mm receipt printers &amp; RJ11 cash drawer kick
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  printerDevice?.connected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {printerDevice?.connected ? 'CONNECTED' : 'STANDBY'}
              </span>
            </div>

            {/* Active Printer Status Box */}
            {printerDevice ? (
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{printerDevice.name}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                    {printerDevice.connectionType} · {printerDevice.paperWidth}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                  <span>Auto-Cut: {printerDevice.autoCut ? 'Enabled (GS V)' : 'Off'}</span>
                  <span>Drawer Pulse: {printerDevice.kickCashDrawer ? 'Pin 2 (ESC p)' : 'Off'}</span>
                </div>
                {printerDevice.lastPrintedAt && (
                  <div className="text-[10px] text-slate-500">
                    Last ESC/POS transmission: {printerDevice.lastPrintedAt}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">No Bluetooth Printer Paired</div>
                <div className="text-[11px] text-slate-500">
                  Pair any portable 58mm or desktop 80mm thermal printer (Xprinter, Sunmi V2, Rongta, Epson) via Web Bluetooth.
                </div>
              </div>
            )}

            {/* Paper Roll Width Selection */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Thermal Paper Roll Width &amp; Character Density
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPrinterPaperSize('58mm')}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    printerPaperSize === '58mm'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>58mm Portable Roll</div>
                  <div className="text-[10px] font-mono text-slate-500 font-normal">
                    32 chars/line · Handheld POS
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPrinterPaperSize('80mm')}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    printerPaperSize === '80mm'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>80mm Counter Roll</div>
                  <div className="text-[10px] font-mono text-slate-500 font-normal">
                    48 chars/line · Auto-Cutter
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Printer Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={connectBluetoothPrinter}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Pair Web Bluetooth</span>
              </button>

              {!printerDevice && (
                <button
                  type="button"
                  onClick={connectSimulatedPrinter}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Use Virtual Sunmi POS
                </button>
              )}

              {printerDevice && (
                <button
                  type="button"
                  onClick={disconnectPrinter}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={testThermalPrinter}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Test ESC/POS Print</span>
            </button>
          </div>
        </div>

        {/* Card 2: IndexedDB Local Cache, Offline Sync Queue & PWA Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    IndexedDB Offline Engine &amp; Auto-Sync Queue
                  </h2>
                  <div className="text-[11px] text-slate-500">
                    Zero-downtime local persistence &amp; background KRA VSCU queue replay
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleSimulatedOffline}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
              </button>
            </div>

            {/* IndexedDB Storage Telemetry */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">IndexedDB SKUs</div>
                <div className="text-lg font-bold text-slate-900 font-mono-numbers mt-0.5">
                  {idbStats.cachedProductsCount}
                </div>
                <div className="text-[10px] text-emerald-700">Cached Offline</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Cached Invoices</div>
                <div className="text-lg font-bold text-slate-900 font-mono-numbers mt-0.5">
                  {idbStats.cachedInvoicesCount}
                </div>
                <div className="text-[10px] text-slate-500">Local Ledger</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Pending Sync</div>
                <div
                  className={`text-lg font-bold font-mono-numbers mt-0.5 ${
                    pendingSyncCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {pendingSyncCount}
                </div>
                <div className="text-[10px] text-slate-500">Last: {lastSyncedAt}</div>
              </div>
            </div>

            {/* Android / Tablet PWA Manifest Status */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">
                    Installable Android POS &amp; Tablet PWA
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Service Worker (`sw.js`) &amp; `manifest.json` registered for standalone fullscreen POS
                  </div>
                </div>
              </div>
              {isInstalled ? (
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  INSTALLED
                </span>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={install}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold text-xs shrink-0"
                >
                  Install POS App
                </button>
              ) : (
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold shrink-0">
                  PWA Ready
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={toggleSimulatedOffline}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {isOnline ? 'Simulate Safaricom Outage' : 'Restore Online Connection'}
            </button>

            <button
              type="button"
              onClick={syncOfflineQueue}
              disabled={!isOnline}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flush Offline Queue ({pendingSyncCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Business Details & Appearance Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
        <form onSubmit={handleSaveProfile} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>KRA eTIMS &amp; Business Registration</span>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Registered Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">KRA PIN (Individual or Non-Individual)</label>
            <input
              type="text"
              value={kraPin}
              onChange={(e) => setKraPin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Official Business Phone (M-Pesa Notifications)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Save Business Profile
            </button>
          </div>
        </form>

        {/* Display Mode, Scanner & Factory Reset */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Display Theme &amp; POS Scanner Configuration</span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1.5">System Display Mode</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <span className="font-semibold text-slate-800">High-Contrast Light Mode Active</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Calibrated for glare-free readability across retail counters, tablet screens, and bright sunlight.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium shrink-0">Enforced</span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Barcode Scanner Wedge</label>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  USB &amp; Bluetooth HID Keyboard Wedge Active. Instant sub-50ms keystroke burst detection on POS counter.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-slate-500">Reset Demo Data &amp; IndexedDB:</span>
            <button
              type="button"
              onClick={resetToDemoData}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Factory Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Branch Management Modal */}
      <BranchManagerModal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        initialMode={branchModalMode}
        initialBranchId={branchToEdit}
      />
    </div>
  );
};
