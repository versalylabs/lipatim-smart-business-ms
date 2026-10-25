import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Branch } from '../../types/inventory';
import {
  Building2,
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldCheck,
  Boxes,
  Store,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

interface BranchManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'list' | 'add' | 'edit';
  initialBranchId?: string;
}

const KENYA_COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Kiambu',
  'Uasin Gishu',
  'Machakos',
  'Kilifi',
  'Kajiado',
  'Meru',
  'Kakamega',
  'Nyeri',
  'Trans Nzoia',
  'Bungoma',
  'Kisii',
  'Kericho',
  'Garissa',
  'Embu',
  'Laikipia',
  'Murang\'a',
];

export const BranchManagerModal: React.FC<BranchManagerModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'list',
  initialBranchId,
}) => {
  const {
    branches,
    activeBranchId,
    setActiveBranchId,
    addBranch,
    updateBranch,
    deleteBranch,
    products,
  } = useApp();

  const [mode, setMode] = useState<'list' | 'add' | 'edit'>(initialMode);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(initialBranchId || null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [county, setCounty] = useState('Nairobi');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+254 ');
  const [isMainWarehouse, setIsMainWarehouse] = useState(false);
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or initialize form whenever modal opens (depend ONLY on isOpen to prevent clobbering internal transitions)
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setSuccessBanner('');
      if (initialMode === 'edit' && initialBranchId) {
        startEdit(initialBranchId);
      } else if (initialMode === 'add') {
        resetForm();
        setMode('add');
      } else {
        resetForm();
        setMode('list');
      }
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setCode('');
    setCounty('Nairobi');
    setAddress('');
    setPhone('+254 ');
    setIsMainWarehouse(false);
    setActive(true);
    setErrorMsg('');
    setEditingBranchId(null);
  };

  const startEdit = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return;
    setEditingBranchId(branchId);
    setName(branch.name || '');
    setCode(branch.code || '');
    setCounty(branch.county || 'Nairobi');
    setAddress(branch.address || '');
    setPhone(branch.phone || '+254 ');
    setIsMainWarehouse(Boolean(branch.isMainWarehouse));
    setActive(branch.active ?? true);
    setErrorMsg('');
    setSuccessBanner('');
    setMode('edit');
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg('');

    const cleanName = (name || '').trim();
    const cleanCode = (code || '').trim().toUpperCase();

    if (!cleanName) {
      setErrorMsg('Please specify a branch name.');
      return;
    }
    if (!cleanCode) {
      setErrorMsg('Please enter a unique branch code (e.g., CBD-01, NYL-02).');
      return;
    }

    // Safe check code uniqueness across other branches with optional chaining
    const existingCode = (branches || []).find(
      (b) =>
        b?.code &&
        b.code.toUpperCase() === cleanCode &&
        b.id !== editingBranchId
    );
    if (existingCode) {
      setErrorMsg(`Branch code "${cleanCode}" is already used by ${existingCode.name}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'add') {
        const created = addBranch({
          name: cleanName,
          code: cleanCode,
          county: (county || 'Nairobi').trim(),
          address: (address || 'Commercial Center').trim(),
          phone: (phone || '+254 700 000000').trim(),
          isMainWarehouse,
          active,
        });
        setSuccessBanner(`Branch "${created.name}" (${created.code}) created successfully.`);
      } else if (mode === 'edit' && editingBranchId) {
        updateBranch(editingBranchId, {
          name: cleanName,
          code: cleanCode,
          county: (county || 'Nairobi').trim(),
          address: (address || 'Commercial Center').trim(),
          phone: (phone || '+254 700 000000').trim(),
          isMainWarehouse,
          active,
        });
        setSuccessBanner(`Branch "${cleanName}" details updated successfully.`);
      }

      resetForm();
      setMode('list');
    } catch (err: any) {
      console.error('Failed to save branch outlet:', err);
      setErrorMsg(err?.message || 'Failed to save branch outlet. Please check values and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (branch: Branch) => {
    if (branches.length <= 1) {
      alert('You cannot delete the only remaining branch in the system.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to remove "${branch.name}" (${branch.code})? Existing sales and inventory logs will be preserved in audit records.`
    );
    if (confirmed) {
      deleteBranch(branch.id);
      setSuccessBanner(`Branch "${branch.name}" has been decommissioned.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'list'
                  ? 'Multi-Branch & Store Outlets'
                  : mode === 'add'
                  ? 'Register New Branch Outlet'
                  : 'Edit Branch Outlet Details'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'list'
                  ? 'Manage operating store locations, distribution warehouses, and point-of-sale terminals.'
                  : 'Configure physical address, phone, county, and central warehouse roles.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successBanner && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessBanner('')}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {mode === 'list' ? (
            <div className="space-y-4">
              {/* Top Action Bar */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {branches.length} {branches.length === 1 ? 'Outlet Location' : 'Outlet Locations'} Active
                </span>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setSuccessBanner('');
                    setMode('add');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Branch</span>
                </button>
              </div>

              {/* Branch Cards List */}
              <div className="grid grid-cols-1 gap-3">
                {branches.map((b) => {
                  const isCurrentCounter = b.id === activeBranchId;
                  const branchStockUnits = (products || []).reduce(
                    (acc, p) => acc + (p.branchStock?.[b.id] || 0),
                    0
                  );

                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrentCounter
                          ? 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-300'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                              {b.code}
                            </span>
                            {b.isMainWarehouse && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded">
                                HQ Central Warehouse
                              </span>
                            )}
                            {isCurrentCounter && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active Terminal
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {b.address}, {b.county}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono-numbers">{b.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 font-mono-numbers text-slate-600">
                              <Boxes className="w-3.5 h-3.5 text-slate-400" />
                              <span>{branchStockUnits} units in stock</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {!isCurrentCounter && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveBranchId(b.id);
                                setSuccessBanner(`Active terminal switched to ${b.name}.`);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                              title="Set as your active counter for POS and stock checks"
                            >
                              Switch Counter
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(b.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit branch details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {branches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDelete(b)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete branch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Add / Edit Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Mombasa Nyali Branch"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Outlet Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g., NYL-01"
                    className="w-full px-3 py-2 text-xs uppercase font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    County / Region
                  </label>
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {KENYA_COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        {c} County
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 712 345678"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Physical Street / Building Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., Links Road, Nyali Plaza Ground Floor, Shop 4"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMainWarehouse}
                    onChange={(e) => setIsMainWarehouse(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Designate as Main Central Warehouse / HQ
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Acts as primary recipient for supplier Goods Received Notes (GRN) and inter-branch inventory dispatches.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Active Operational Outlet
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Branch will appear in POS counter selection and inventory distribution reports.
                    </div>
                  </div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode('list');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Branches List</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode('list');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={(e) => handleSave(e)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : mode === 'add'
                      ? 'Create Outlet Branch'
                      : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
