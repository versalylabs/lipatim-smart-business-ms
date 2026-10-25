import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { CartItem } from '../../types/sales';
import { PauseCircle, PlayCircle, Trash2, Clock, User, X } from 'lucide-react';

interface HoldCartModalProps {
  currentCart: CartItem[];
  customerId?: string;
  onRecallCart: (cart: CartItem[], customerId?: string) => void;
  onClearActiveCart: () => void;
  onClose: () => void;
}

export const HoldCartModal: React.FC<HoldCartModalProps> = ({
  currentCart,
  customerId,
  onRecallCart,
  onClearActiveCart,
  onClose,
}) => {
  const { heldOrders, holdCurrentCart, recallHeldOrder, deleteHeldOrder, customers } = useApp();
  const [holdNote, setHoldNote] = useState('');

  const currentCustomer = customers.find((c) => c.id === customerId);

  const handleHold = () => {
    if (currentCart.length === 0) return;
    holdCurrentCart(currentCart, customerId, currentCustomer?.name, holdNote);
    onClearActiveCart();
    onClose();
  };

  const handleRecall = (id: string) => {
    const recalled = recallHeldOrder(id);
    if (recalled) {
      onRecallCart(recalled.cart, recalled.customerId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">Suspended Orders (Hold Cart)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suspend Active Cart Section */}
        {currentCart.length > 0 && (
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-3 shrink-0">
            <div className="text-xs font-semibold text-amber-950 flex items-center justify-between">
              <span>Suspend Current Active Cart ({currentCart.length} items)</span>
              <span className="font-mono-numbers">
                {formatKES(currentCart.reduce((sum, i) => sum + i.totalGross, 0))}
              </span>
            </div>

            <input
              type="text"
              placeholder="Reason / Note (e.g. Stepped out for M-Pesa cash, picking Panadol...)"
              value={holdNote}
              onChange={(e) => setHoldNote(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-lg bg-white"
            />

            <button
              onClick={handleHold}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Suspend &amp; Free Up Cashier Counter</span>
            </button>
          </div>
        )}

        {/* Existing Held Orders List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px]">
          <div className="text-xs font-semibold text-slate-600 mb-1">
            Held Queue ({heldOrders.length})
          </div>

          {heldOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
              No suspended orders in the queue.
            </div>
          ) : (
            heldOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{order.customerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.timestamp}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {order.cart.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>

                  {order.note && (
                    <div className="text-[10px] text-amber-700 italic mt-0.5 font-medium">
                      Note: {order.note}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900 font-mono-numbers">
                    {formatKES(order.subtotal)}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 justify-end">
                    <button
                      onClick={() => handleRecall(order.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      title="Recall order to active POS register"
                    >
                      <PlayCircle className="w-3 h-3" />
                      <span>Resume</span>
                    </button>

                    <button
                      onClick={() => deleteHeldOrder(order.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Discard held cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
