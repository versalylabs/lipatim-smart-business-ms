import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { AlertTriangle, Send, Share2, Building2, Package, X } from 'lucide-react';

interface SupplierRestockDrawerProps {
  onClose: () => void;
}

export const SupplierRestockDrawer: React.FC<SupplierRestockDrawerProps> = ({ onClose }) => {
  const { products, suppliers, activeBranch, notify } = useApp();

  const lowStockProducts = products.filter((p) => p.totalStock <= p.reorderLevel);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');

  const supplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const generateOrderText = () => {
    const itemsList = lowStockProducts
      .map(
        (p) =>
          `• ${p.name}: Available ${p.totalStock} ${p.unit} (Reorder: ${p.reorderLevel * 2} ${p.unit})`
      )
      .join('\n');

    return (
      `*PURCHASE ORDER: LIPATIM RETAIL (${activeBranch.name.toUpperCase()})*\n` +
      `Date: ${new Date().toLocaleDateString('en-KE')}\n` +
      `To: ${supplier?.name}\n` +
      `Contact: ${supplier?.contactPerson} (${supplier?.phone})\n` +
      `--------------------------------------\n` +
      `Kindly supply the following replenishment stock:\n\n` +
      `${itemsList || 'All inventory currently nominal.'}\n\n` +
      `--------------------------------------\n` +
      `Delivery Address: ${activeBranch.address}\n` +
      `Please issue proforma invoice with KRA eTIMS PIN: P051239841K.`
    );
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateOrderText());
    const phone = supplier?.phone.replace(/[^0-9]/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    notify('success', 'Order Dispatched', `WhatsApp restock order opened for ${supplier?.name}.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Automated Supplier Restock Draft</h3>
              <div className="text-[11px] text-slate-500 font-mono">
                {lowStockProducts.length} items at or below reorder threshold
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs flex-1 overflow-y-auto pr-1">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Wholesaler / Supplier</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.phone}) - Terms: {s.paymentTermsDays} days
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Items Needing Restock</label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 max-h-48 overflow-y-auto">
              {lowStockProducts.length === 0 ? (
                <div className="text-slate-500 text-center py-2">All product stock levels are healthy!</div>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{p.name}</span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Threshold: {p.reorderLevel} · Current: {p.totalStock}
                      </div>
                    </div>
                    <span className="font-bold font-mono text-amber-800">
                      Order +{p.reorderLevel * 2} {p.unit}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Order Message Preview</label>
            <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
              {generateOrderText()}
            </pre>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSendWhatsApp}
            disabled={lowStockProducts.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Send Order via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
