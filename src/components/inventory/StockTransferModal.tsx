import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { ArrowLeftRight, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface StockTransferModalProps {
  onClose: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({ onClose }) => {
  const { products, branches, activeBranch, currentUser, performStockTransfer, notify } = useApp();

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [sourceBranchId, setSourceBranchId] = useState('br_ind_area');
  const [destinationBranchId, setDestinationBranchId] = useState('br_cbd');
  const [quantity, setQuantity] = useState('10');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find((p) => p.id === productId);
  const sourceBranch = branches.find((b) => b.id === sourceBranchId) || branches[0];
  const destBranch = branches.find((b) => b.id === destinationBranchId) || branches[1];

  const sourceAvailableStock = selectedProduct ? selectedProduct.branchStock[sourceBranchId] || 0 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (sourceBranchId === destinationBranchId) {
      alert('Source and destination branches must be different.');
      return;
    }

    const qtyNum = parseInt(quantity) || 1;
    if (qtyNum > sourceAvailableStock) {
      alert(`Cannot transfer ${qtyNum} units. Only ${sourceAvailableStock} available at ${sourceBranch.name}.`);
      return;
    }

    const success = performStockTransfer({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sourceBranchId: sourceBranch.id,
      sourceBranchName: sourceBranch.name,
      destinationBranchId: destBranch.id,
      destinationBranchName: destBranch.name,
      quantity: qtyNum,
      status: 'COMPLETED',
      dispatchedBy: currentUser.name,
      notes,
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Inter-Branch Stock Transfer</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Select Item to Transfer</label>
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
              <label className="block font-medium text-slate-700 mb-1">Source (From)</label>
              <select
                value={sourceBranchId}
                onChange={(e) => setSourceBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-slate-500 mt-1 font-mono-numbers">
                In Stock at Source: <strong className="text-slate-800">{sourceAvailableStock} {selectedProduct?.unit}</strong>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Destination (To)</label>
              <select
                value={destinationBranchId}
                onChange={(e) => setDestinationBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === sourceBranchId}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Transfer Quantity</label>
            <input
              type="number"
              min="1"
              max={sourceAvailableStock}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Transfer Notes / Reason</label>
            <input
              type="text"
              placeholder="e.g. Weekend restock or low stock dispatch"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
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
            disabled={sourceAvailableStock < parseInt(quantity) || sourceBranchId === destinationBranchId}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg shadow-sm"
          >
            Dispatch Transfer
          </button>
        </div>
      </form>
    </div>
  );
};
