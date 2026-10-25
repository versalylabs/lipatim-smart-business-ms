import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { StockBatch, Product } from '../../types/inventory';
import { Calendar, AlertTriangle, CheckCircle2, XCircle, Trash2, Clock } from 'lucide-react';

export const ExpiryAuditTable: React.FC = () => {
  const { products, branches, recordStockAdjustment } = useApp();

  interface BatchRow {
    product: Product;
    batch: StockBatch;
    branchName: string;
    daysRemaining: number;
    status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'GOOD';
  }

  const batchRows: BatchRow[] = [];
  const now = new Date().getTime();

  products.forEach((prod) => {
    prod.batches?.forEach((batch) => {
      if (batch.expiryDate) {
        const expTime = new Date(batch.expiryDate).getTime();
        const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        const branch = branches.find((b) => b.id === batch.branchId);

        let status: BatchRow['status'] = 'GOOD';
        if (diffDays <= 0) status = 'EXPIRED';
        else if (diffDays <= 30) status = 'CRITICAL';
        else if (diffDays <= 90) status = 'WARNING';

        batchRows.push({
          product: prod,
          batch,
          branchName: branch?.name || 'Counter',
          daysRemaining: diffDays,
          status,
        });
      }
    });
  });

  // Sort batches by closest expiry first
  batchRows.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rose-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Perishables &amp; Pharmacy Expiry Audit</h2>
            <div className="text-[11px] text-slate-500">
              Active shelf monitoring for OTC medicines, dairy, and grocery perishables
            </div>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500 font-mono-numbers">
          {batchRows.length} audited batches
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Item &amp; Category</th>
              <th className="py-3 px-3">Batch Number</th>
              <th className="py-3 px-3">Location</th>
              <th className="py-3 px-3">Expiry Date</th>
              <th className="py-3 px-3 text-right">Units Remaining</th>
              <th className="py-3 px-3 text-center">Urgency</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batchRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No dated perishable batches currently recorded.
                </td>
              </tr>
            ) : (
              batchRows.map(({ product, batch, branchName, daysRemaining, status }) => {
                return (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{product.categoryName}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">{batch.batchNumber}</td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">{branchName}</td>
                    <td className="py-3 px-3 font-mono font-semibold">
                      <span
                        className={
                          status === 'EXPIRED'
                            ? 'text-rose-700 font-bold'
                            : status === 'CRITICAL'
                            ? 'text-orange-700 font-bold'
                            : status === 'WARNING'
                            ? 'text-amber-700'
                            : 'text-slate-800'
                        }
                      >
                        {batch.expiryDate}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      {batch.currentQuantity} {product.unit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                          status === 'EXPIRED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : status === 'CRITICAL'
                            ? 'bg-orange-50 text-orange-800 border border-orange-200'
                            : status === 'WARNING'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {status === 'EXPIRED' ? (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>EXPIRED</span>
                          </>
                        ) : status === 'CRITICAL' ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-orange-600" />
                            <span>{daysRemaining}d left</span>
                          </>
                        ) : status === 'WARNING' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{daysRemaining}d left</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Valid ({daysRemaining}d)</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {batch.currentQuantity > 0 && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Write off expired/damaged batch ${batch.batchNumber} (${batch.currentQuantity} units)?`
                              )
                            ) {
                              recordStockAdjustment(
                                product.id,
                                batch.branchId,
                                batch.currentQuantity,
                                'STOCK_OUT_EXPIRY',
                                `Expired batch ${batch.batchNumber} disposal`,
                                batch.id
                              );
                            }
                          }}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                          title="Dispose and write off batch"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Dispose</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
