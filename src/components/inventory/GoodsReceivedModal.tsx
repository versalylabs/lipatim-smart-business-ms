import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { Truck, Plus, Calendar, DollarSign, Tag, X } from 'lucide-react';

interface GoodsReceivedModalProps {
  onClose: () => void;
}

export const GoodsReceivedModal: React.FC<GoodsReceivedModalProps> = ({ onClose }) => {
  const { products, suppliers, branches, activeBranch, currentUser, createGoodsReceivedNote } =
    useApp();

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [branchId, setBranchId] = useState(activeBranch.id);
  const [batchNumber, setBatchNumber] = useState(`BCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [unitCost, setUnitCost] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState('');

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const selectedBranch = branches.find((b) => b.id === branchId) || activeBranch;

  // Auto-populate cost and retail price on product select
  const handleProductChange = (pId: string) => {
    setProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setUnitCost(prod.costPrice.toString());
      setRetailPrice(prod.sellingPrice.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedSupplier) return;

    const qtyNum = parseInt(quantity) || 1;
    const costNum = parseFloat(unitCost) || selectedProduct.costPrice;
    const retailNum = parseFloat(retailPrice) || selectedProduct.sellingPrice;

    createGoodsReceivedNote({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      batchNumber,
      expiryDate: expiryDate || undefined,
      quantity: qtyNum,
      unitCost: costNum,
      totalCost: costNum * qtyNum,
      retailPrice: retailNum,
      supplierInvoiceRef,
      receivedBy: currentUser.name,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Goods Received Note (Stock-In)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Supplier and Branch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Wholesale Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Receiving Branch</label>
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
            </div>
          </div>

          {/* Product Select */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Item Being Received</label>
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit}) - In Stock: {p.totalStock}
                </option>
              ))}
            </select>
          </div>

          {/* Batch & Expiry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Batch / Lot Number</label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Expiry Date (Optional/Perishable)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Units Received</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Wholesale Cost (KES)</label>
              <input
                type="number"
                step="0.5"
                required
                value={unitCost || (selectedProduct?.costPrice.toString() ?? '')}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Retail Price (KES)</label>
              <input
                type="number"
                step="0.5"
                required
                value={retailPrice || (selectedProduct?.sellingPrice.toString() ?? '')}
                onChange={(e) => setRetailPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold text-emerald-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Wholesaler Invoice / Delivery Note Ref</label>
            <input
              type="text"
              placeholder="e.g. INV-UNG-88192 or DN-0094"
              value={supplierInvoiceRef}
              onChange={(e) => setSupplierInvoiceRef(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
            <span className="text-emerald-900 font-semibold">Total Stock Value In:</span>
            <span className="font-bold text-emerald-950 font-mono-numbers text-sm">
              {formatKES((parseFloat(unitCost) || selectedProduct?.costPrice || 0) * (parseInt(quantity) || 0))}
            </span>
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
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
          >
            Create GRN &amp; Update Stock
          </button>
        </div>
      </form>
    </div>
  );
};
