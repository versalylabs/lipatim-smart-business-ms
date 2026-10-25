import React from 'react';
import { Product, StockBatch } from '../../types/inventory';
import { Layers, Calendar, AlertTriangle } from 'lucide-react';

interface BatchSelectModalProps {
  product: Product;
  branchId: string;
  onSelectBatch: (batch?: StockBatch) => void;
  onClose: () => void;
}

export const BatchSelectModal: React.FC<BatchSelectModalProps> = ({
  product,
  branchId,
  onSelectBatch,
  onClose,
}) => {
  const availableBatches = (product.batches || []).filter(
    (b) => b.branchId === branchId && b.currentQuantity > 0
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Select Batch &amp; Expiry (FEFO)</h3>
            <div className="text-xs text-slate-500">{product.name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg"
          >
            &times;
          </button>
        </div>

        <div className="space-y-2 text-xs max-h-[60vh] overflow-y-auto">
          <div className="text-slate-600 font-medium">Available Stock Batches at Current Branch:</div>

          {availableBatches.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-500 space-y-3">
              <div>
                No specific lot batches logged for this branch. Dispense from general branch counter stock ({product.branchStock[branchId] || 0} {product.unit} available).
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectBatch(undefined);
                  onClose();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
              >
                Dispense from General Counter Stock
              </button>
            </div>
          ) : (
            availableBatches.map((b) => {
              const isNearExpiry =
                b.expiryDate &&
                new Date(b.expiryDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onSelectBatch(b);
                    onClose();
                  }}
                  className="w-full p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-slate-900 font-mono text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      <span>{b.batchNumber}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Exp: {b.expiryDate || 'N/A'}</span>
                      </span>
                      {isNearExpiry && (
                        <span className="text-rose-600 font-medium flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Expiring soon</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 font-mono-numbers">
                      {b.currentQuantity} {product.unit}
                    </span>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Select &rarr;</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
