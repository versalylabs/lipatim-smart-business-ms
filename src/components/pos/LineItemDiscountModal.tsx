import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { CartItem } from '../../types/sales';
import { Percent, Tag, Lock, CheckCircle2 } from 'lucide-react';

interface LineItemDiscountModalProps {
  item: CartItem;
  onApplyDiscount: (productId: string, discountPerUnit: number) => void;
  onClose: () => void;
}

export const LineItemDiscountModal: React.FC<LineItemDiscountModalProps> = ({
  item,
  onApplyDiscount,
  onClose,
}) => {
  const { currentRole, permissions, notify, users } = useApp();
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(
    item.discountPerUnit > 0 ? item.discountPerUnit.toString() : '5'
  );
  const [managerPin, setManagerPin] = useState('');
  const [pinError, setPinError] = useState('');

  const isCashier = currentRole === 'cashier';

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(discountValue) || 0;

    // A cashier needs a PIN belonging to an active manager.
    if (isCashier && !permissions.canApplyCustomDiscount) {
      const managerApproved = users.some(
        (user) => user.active && user.role === 'manager' && user.pinCode === managerPin
      );
      if (!managerApproved) {
        setPinError('Invalid Manager Authorization PIN. Ask Store Manager to approve.');
        return;
      }
    }

    let calculatedDiscountPerUnit = 0;
    if (discountType === 'percent') {
      calculatedDiscountPerUnit = Number(((item.originalPrice * val) / 100).toFixed(2));
    } else {
      calculatedDiscountPerUnit = val;
    }

    if (calculatedDiscountPerUnit > item.originalPrice) {
      alert('Discount cannot exceed original product price.');
      return;
    }

    onApplyDiscount(item.productId, calculatedDiscountPerUnit);
    notify(
      'success',
      'Discount Applied',
      `Applied ${formatKES(calculatedDiscountPerUnit)} discount per unit on ${item.name}.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleApply}
        className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Line Item Discount</h3>
            <div className="text-xs text-slate-500 truncate max-w-[220px]">{item.name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg"
          >
            &times;
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Retail Unit Price:</span>
            <span className="font-bold font-mono-numbers">{formatKES(item.originalPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tax Classification:</span>
            <span className="font-mono">Band {item.taxRateCode} ({item.taxRatePercent}%)</span>
          </div>
        </div>

        {/* Discount Type Toggle */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setDiscountType('percent')}
            className={`p-2 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors ${
              discountType === 'percent'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Percentage (%)</span>
          </button>

          <button
            type="button"
            onClick={() => setDiscountType('fixed')}
            className={`p-2 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors ${
              discountType === 'fixed'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Fixed KES Amount</span>
          </button>
        </div>

        <div className="text-xs space-y-1">
          <label className="block font-medium text-slate-700">
            {discountType === 'percent' ? 'Discount Percentage (%)' : 'Discount in KES per Unit'}
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            required
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-bold"
          />
        </div>

        {/* Manager Override PIN required for Cashier */}
        {isCashier && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Manager Authorization Required</span>
            </div>
            <div className="text-[11px] text-amber-800">
              Ask an active store manager to enter their PIN to approve this discount.
            </div>
            <input
              type="password"
              placeholder="Enter Manager PIN"
              value={managerPin}
              onChange={(e) => {
                setManagerPin(e.target.value);
                setPinError('');
              }}
              className="w-full px-3 py-1.5 border border-amber-300 rounded-md bg-white font-mono text-xs"
            />
            {pinError && <div className="text-[11px] text-rose-600 font-medium">{pinError}</div>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
          >
            Apply Discount
          </button>
        </div>
      </form>
    </div>
  );
};
