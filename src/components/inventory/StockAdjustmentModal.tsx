import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { MovementType } from '../../types/inventory';
import { Trash2, AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface StockAdjustmentModalProps {
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ onClose }) => {
  const { products, activeBranch, branches, recordStockAdjustment } = useApp();

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [branchId, setBranchId] = useState(activeBranch.id);
  const [adjustmentType, setAdjustmentType] = useState<MovementType>('STOCK_OUT_DAMAGE');
  const [quantity, setQuantity] = useState('2');
  const [reason, setReason] = useState('');

  const selectedProduct = products.find((p) => p.id === productId);
  const currentBranchStock = selectedProduct ? selectedProduct.branchStock[branchId] || 0 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qtyNum = parseInt(quantity) || 1;
    if (qtyNum > currentBranchStock) {
      alert(`Cannot adjust ${qtyNum} units. Only ${currentBranchStock} in stock.`);
      return;
    }

    recordStockAdjustment(selectedProduct.id, branchId, qtyNum, adjustmentType, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900">Write-Off &amp; Stock Adjustment</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Item to Adjust</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit}) - Total: {p.totalStock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-slate-500 mt-1 font-mono-numbers">
                Available: {currentBranchStock} {selectedProduct?.unit}
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Adjustment Reason</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="STOCK_OUT_DAMAGE">Broken / Damaged</option>
                <option value="STOCK_OUT_EXPIRY">Expired Disposal</option>
                <option value="STOCK_OUT_THEFT">Theft / Shrinkage</option>
                <option value="MANUAL_ADJUSTMENT">Stock Audit Variance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Quantity to Remove</label>
            <input
              type="number"
              min="1"
              max={currentBranchStock}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Incident Notes &amp; Explanation</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Dropped in store during shelf restocking, packaging burst"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs resize-none"
            />
          </div>

          {selectedProduct && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-950 font-semibold">
              <span>Financial Loss (at Wholesale Cost):</span>
              <span className="font-bold font-mono-numbers">
                {formatKES(selectedProduct.costPrice * (parseInt(quantity) || 0))}
              </span>
            </div>
          )}
        </div>

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
            disabled={currentBranchStock < parseInt(quantity)}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-lg shadow-sm"
          >
            Confirm Write-Off
          </button>
        </div>
      </form>
    </div>
  );
};
