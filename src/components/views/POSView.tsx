import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { calculateItemTax, calculateInvoiceTaxSummary, buildEtimsPayload } from '../../utils/taxCalculator';
import {
  generateInvoiceNumber,
  generateCuSerialNumber,
  generateKraVerificationDetails,
  generateMpesaReceiptCode,
} from '../../utils/kenya';
import { posSound } from '../../utils/sound';
import { BarcodeScannerBar } from '../pos/BarcodeScannerBar';
import { LineItemDiscountModal } from '../pos/LineItemDiscountModal';
import { BatchSelectModal } from '../pos/BatchSelectModal';
import { HoldCartModal } from '../pos/HoldCartModal';
import { ReceiptModal } from '../pos/ReceiptModal';
import { DarajaStkModal } from '../mpesa/DarajaStkModal';
import { CartItem, Invoice, PaymentMethod, PaymentRecord } from '../../types/sales';
import { Product, StockBatch } from '../../types/inventory';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  SmartphoneNfc,
  Banknote,
  BookOpenCheck,
  PauseCircle,
  Tag,
  Split,
  User,
  ShieldAlert,
  ShoppingBag,
  LayoutGrid,
} from 'lucide-react';

export const POSView: React.FC = () => {
  const {
    products,
    customers,
    activeBranch,
    currentUser,
    addInvoice,
    invoices,
    isOnline,
    heldOrders,
    notify,
  } = useApp();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'CATALOG' | 'CART'>('CATALOG');

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [stkModalOpen, setStkModalOpen] = useState(false);
  const [discountModalItem, setDiscountModalItem] = useState<CartItem | null>(null);
  const [batchModalProduct, setBatchModalProduct] = useState<Product | null>(null);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Payment configuration
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MPESA_STK');
  const [customerPhone, setCustomerPhone] = useState('0722100200');
  const [cashTendered, setCashTendered] = useState('');

  // Split tender inputs
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitMpesaAmount, setSplitMpesaAmount] = useState('');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Sync customer phone when customer changes
  useEffect(() => {
    if (selectedCustomer?.phone) {
      setCustomerPhone(selectedCustomer.phone);
    }
  }, [selectedCustomer]);

  // Cart operations
  const handleScanItem = (product: Product) => {
    const branchBatches = (product.batches || []).filter(
      (b) => b.branchId === activeBranch.id && b.currentQuantity > 0
    );

    // If product has multiple active batches in this branch, prompt batch selection
    if (branchBatches.length > 1) {
      setBatchModalProduct(product);
      return;
    }
    addItemToCart(product, branchBatches[0]);
  };

  const addItemToCart = (product: Product, batch?: StockBatch) => {
    const existing = cart.find(
      (i) => i.productId === product.id && (batch ? i.batchId === batch.id : !i.batchId)
    );
    const branchStock = batch ? batch.currentQuantity : product.branchStock[activeBranch.id] || 0;

    if (existing) {
      if (existing.quantity >= branchStock) {
        posSound.playWarningBuzz();
        notify('warning', 'Stock Limit', `Only ${branchStock} units available for ${product.name}.`);
        return;
      }
      updateQuantity(product.id, existing.quantity + 1, batch?.id);
    } else {
      if (branchStock <= 0) {
        posSound.playWarningBuzz();
        notify('warning', 'Out of Stock', `${product.name} is currently out of stock at ${activeBranch.name}.`);
        return;
      }

      const calc = calculateItemTax(product.sellingPrice, 1, 0, product.taxRateCode);
      const newItem: CartItem = {
        productId: product.id,
        batchId: batch?.id,
        barcode: product.barcode,
        name: batch ? `${product.name} (${batch.batchNumber})` : product.name,
        quantity: 1,
        availableStock: branchStock,
        unitPrice: product.sellingPrice,
        originalPrice: product.sellingPrice,
        discountPerUnit: 0,
        taxRateCode: product.taxRateCode,
        taxRatePercent: calc.vatPerUnit > 0 ? 16 : 0,
        netUnitAmount: calc.netUnitAmount,
        vatPerUnit: calc.vatPerUnit,
        totalNet: calc.totalNet,
        totalVat: calc.totalVat,
        totalGross: calc.totalGross,
      };
      setCart((prev) => [...prev, newItem]);
    }
  };

  const updateQuantity = (productId: string, newQty: number, batchId?: string) => {
    if (newQty <= 0) {
      removeFromCart(productId, batchId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId || (batchId ? item.batchId !== batchId : Boolean(item.batchId))) {
          return item;
        }
        if (newQty > item.availableStock) {
          posSound.playWarningBuzz();
          notify('warning', 'Stock Limit', `Maximum available stock is ${item.availableStock}.`);
          return item;
        }
        const calc = calculateItemTax(item.originalPrice, newQty, item.discountPerUnit, item.taxRateCode);
        return {
          ...item,
          quantity: newQty,
          totalNet: calc.totalNet,
          totalVat: calc.totalVat,
          totalGross: calc.totalGross,
        };
      })
    );
  };

  const applyLineDiscount = (productId: string, discountPerUnit: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const calc = calculateItemTax(item.originalPrice, item.quantity, discountPerUnit, item.taxRateCode);
        return {
          ...item,
          discountPerUnit,
          unitPrice: calc.effectiveUnitPrice,
          totalNet: calc.totalNet,
          totalVat: calc.totalVat,
          totalGross: calc.totalGross,
        };
      })
    );
  };

  const removeFromCart = (productId: string, batchId?: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && (batchId ? i.batchId === batchId : !i.batchId)))
    );
  };

  const clearCart = () => setCart([]);

  const taxSummary = calculateInvoiceTaxSummary(cart);

  // Check credit limit and credit block viability
  const isCreditBlocked = Boolean(selectedCustomer?.isCreditBlocked);
  const creditLimitExceeded =
    Boolean(selectedCustomer) &&
    selectedMethod === 'CREDIT' &&
    selectedCustomer!.currentDebt + taxSummary.grandTotal > selectedCustomer!.creditLimit;

  const isCashInsufficient =
    selectedMethod === 'CASH' && (parseFloat(cashTendered) || 0) < taxSummary.grandTotal;

  const splitSum = (parseFloat(splitCashAmount) || 0) + (parseFloat(splitMpesaAmount) || 0);
  const isSplitMismatch =
    selectedMethod === 'SPLIT' && Math.abs(splitSum - taxSummary.grandTotal) >= 1;

  // Filter products for active branch search
  const filteredProducts = products.filter((p) => {
    const query = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.barcode.includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.categoryName.toLowerCase().includes(query)
    );
  });

  const handleOpenCheckout = (defaultMethod?: PaymentMethod) => {
    if (cart.length === 0) return;
    if (defaultMethod) setSelectedMethod(defaultMethod);
    setCashTendered(taxSummary.grandTotal.toString());
    const halfCash = Math.floor(taxSummary.grandTotal / 2);
    setSplitCashAmount(halfCash.toString());
    setSplitMpesaAmount((taxSummary.grandTotal - halfCash).toString());
    setPaymentModalOpen(true);
  };

  // Keyboard shortcuts for F4 (Hold), F8 (Split), F9 (M-Pesa Checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        setHoldModalOpen(true);
      } else if (e.key === 'F8' && cart.length > 0) {
        e.preventDefault();
        handleOpenCheckout('SPLIT');
      } else if (e.key === 'F9' && cart.length > 0) {
        e.preventDefault();
        handleOpenCheckout('MPESA_STK');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, taxSummary.grandTotal]);

  const handleSplitCashChange = (val: string) => {
    setSplitCashAmount(val);
    const num = parseFloat(val) || 0;
    const remainder = Math.max(0, taxSummary.grandTotal - num);
    setSplitMpesaAmount(remainder.toString());
  };

  const handleSplitMpesaChange = (val: string) => {
    setSplitMpesaAmount(val);
    const num = parseFloat(val) || 0;
    const remainder = Math.max(0, taxSummary.grandTotal - num);
    setSplitCashAmount(remainder.toString());
  };

  const finalizeSale = (customMpesaReceipt?: string, customPhone?: string) => {
    const seq = invoices.length + 101;
    const invNumber = generateInvoiceNumber(seq);
    const cuSerial = generateCuSerialNumber(activeBranch.code, seq);
    const verification = generateKraVerificationDetails(
      cuSerial,
      new Date().toISOString(),
      taxSummary.grandTotal
    );

    let payments: PaymentRecord[] = [];
    let changeGiven = 0;

    if (selectedMethod === 'SPLIT') {
      const cashAmt = parseFloat(splitCashAmount) || 0;
      const mpesaAmt = parseFloat(splitMpesaAmount) || 0;
      payments = [
        {
          id: `pmt_c_${Date.now()}`,
          method: 'CASH',
          amount: cashAmt,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        },
        {
          id: `pmt_m_${Date.now()}`,
          method: 'MPESA_STK',
          amount: mpesaAmt,
          mpesaReceiptNumber: customMpesaReceipt || generateMpesaReceiptCode(),
          customerPhone: customPhone || customerPhone,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        },
      ];
    } else if (selectedMethod === 'CASH') {
      const tendered = parseFloat(cashTendered) || taxSummary.grandTotal;
      changeGiven = Math.max(0, tendered - taxSummary.grandTotal);
      payments = [
        {
          id: `pmt_${Date.now()}`,
          method: 'CASH',
          amount: taxSummary.grandTotal,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        },
      ];
    } else if (selectedMethod.startsWith('MPESA')) {
      payments = [
        {
          id: `pmt_${Date.now()}`,
          method: selectedMethod,
          amount: taxSummary.grandTotal,
          mpesaReceiptNumber: customMpesaReceipt || generateMpesaReceiptCode(),
          customerPhone: customPhone || customerPhone,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        },
      ];
    } else if (selectedMethod === 'CREDIT') {
      payments = [
        {
          id: `pmt_${Date.now()}`,
          method: 'CREDIT',
          amount: taxSummary.grandTotal,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const pmtTyCode =
      selectedMethod === 'CASH'
        ? '01'
        : selectedMethod === 'CREDIT'
        ? '02'
        : selectedMethod === 'SPLIT'
        ? '05'
        : '04';

    const etimsPayload = buildEtimsPayload(
      invNumber,
      seq,
      cart,
      taxSummary,
      currentUser.name,
      selectedCustomer?.kraPin,
      selectedCustomer?.name,
      pmtTyCode
    );

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invNumber,
      branchId: activeBranch.id,
      branchName: activeBranch.name,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customer: selectedCustomer,
      items: [...cart],
      subtotal: taxSummary.subtotal,
      totalDiscount: taxSummary.totalDiscount,
      taxableAmounts: taxSummary.taxableAmounts,
      taxAmounts: taxSummary.taxAmounts,
      totalTax: taxSummary.totalTax,
      grandTotal: taxSummary.grandTotal,
      amountPaid: taxSummary.grandTotal,
      changeGiven,
      payments,
      paymentStatus: selectedMethod === 'CREDIT' ? 'UNPAID' : 'PAID',
      etimsTransmission: etimsPayload,
      etimsValidation: {
        status: isOnline ? 'TRANSMITTED' : 'OFFLINE_QUEUED',
        cuSerialNumber: cuSerial,
        scuSignature: verification.signature,
        qrCodeUrl: verification.qrUrl,
        internalHash: verification.internalHash,
        transmittedAt: isOnline ? new Date().toISOString() : undefined,
      },
      offlineQueued: !isOnline,
      createdAt: new Date().toISOString(),
    };

    // Chime feedback
    posSound.playSuccessChime();

    addInvoice(newInvoice);
    setStkModalOpen(false);
    setPaymentModalOpen(false);
    setCompletedInvoice(newInvoice);
    clearCart();
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto min-h-full lg:h-[calc(100vh-3.5rem)] flex flex-col space-y-3">
      {/* Top Banner with Quick Actions and Scanner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Sales counter</h1>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Demo mode
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Outlet: <span className="font-semibold text-slate-800">{activeBranch.name}</span> · Cashier: {currentUser.name}
          </div>
        </div>

        {/* Action Buttons: Suspended Carts Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHoldModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Held Carts</span>
            {heldOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                {heldOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Barcode Scanner Bar */}
      <div className="shrink-0">
        <BarcodeScannerBar onScanItem={handleScanItem} />
      </div>

      {/* Mobile / Tablet View Switcher (<1024px) */}
      <div className="flex lg:hidden bg-slate-200/70 p-1 rounded-xl shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('CATALOG')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'CATALOG'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
          <span>Catalog ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('CART')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'CART'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
          <span>Active Cart ({cart.length})</span>
          {cart.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px]">
              {formatKES(taxSummary.grandTotal, false)}
            </span>
          )}
        </button>
      </div>

      {/* POS Two-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left: Product Catalog Search */}
        <div
          className={`lg:col-span-7 flex-col min-h-0 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs ${
            mobileTab === 'CATALOG' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="relative mb-3 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, category, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Catalog Grid */}
          <div className="flex-1 overflow-y-auto max-h-[55vh] lg:max-h-none pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start">
            {filteredProducts.map((p) => {
              const stock = p.branchStock[activeBranch.id] || 0;
              const isOut = stock <= 0;

              return (
                <button
                  key={p.id}
                  disabled={isOut}
                  onClick={() => {
                    posSound.playScannerBeep();
                    handleScanItem(p);
                  }}
                  className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    isOut
                      ? 'opacity-40 border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xs active:scale-[0.98]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono gap-1">
                      <span className="truncate">{p.categoryName}</span>
                      <span className="shrink-0">Band {p.taxRateCode}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-900 mt-1 line-clamp-2 leading-snug">
                      {p.name}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-emerald-800 font-mono-numbers">
                      {formatKES(p.sellingPrice)}
                    </span>
                    <span className={`text-[10px] font-mono ${stock <= p.reorderLevel ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                      {stock} {p.unit}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick mobile checkout bar when viewing catalog with items in cart */}
          {cart.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex lg:hidden items-center justify-between gap-2">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  {cart.reduce((s, i) => s + i.quantity, 0)} Items in Cart
                </div>
                <div className="text-sm font-bold text-emerald-800 font-mono-numbers">
                  {formatKES(taxSummary.grandTotal)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('CART')}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
                >
                  Review Cart
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCheckout()}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-xs"
                >
                  Checkout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Active Cashier Cart & KRA Breakdown */}
        <div
          className={`lg:col-span-5 flex-col min-h-0 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs ${
            mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Customer Selection & Debt Status */}
          <div className="pb-3 border-b border-slate-100 shrink-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Customer / B2B eTIMS Buyer</span>
              </label>
              {selectedCustomer && (
                <span className="text-[10px] font-mono text-slate-500">
                  Limit: {formatKES(selectedCustomer.creditLimit, false)}
                </span>
              )}
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
            >
              <option value="">Walk-in Cash Customer (Standard eTIMS)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.kraPin ? `(PIN: ${c.kraPin})` : ''} - Debt: {formatKES(c.currentDebt, false)}
                </option>
              ))}
            </select>

            {selectedCustomer && selectedCustomer.currentDebt > 0 && (
              <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded flex items-center justify-between">
                <span>Existing Madeni Balance:</span>
                <span className="font-bold font-mono-numbers">{formatKES(selectedCustomer.currentDebt)}</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto max-h-[45vh] lg:max-h-none py-2 space-y-2 pr-1">
            {cart.length === 0 ? (
              <div className="h-44 lg:h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Receipt className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
                <div className="text-xs font-medium">Cart is Empty</div>
                <div className="text-[11px] mt-0.5">Scan barcode or pick item from catalog</div>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.productId}-${item.batchId || 'default'}`}
                  className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>{formatKES(item.unitPrice)}</span>
                      <span>·</span>
                      <span>Band {item.taxRateCode}</span>
                      {item.discountPerUnit > 0 && (
                        <span className="text-emerald-700 font-semibold">
                          (-{formatKES(item.discountPerUnit)} off)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.batchId)}
                        className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono-numbers font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.batchId)}
                        className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Discount Trigger Button */}
                    <button
                      onClick={() => setDiscountModalItem(item)}
                      className="p-1 text-slate-400 hover:text-emerald-700 rounded transition-colors"
                      title="Apply Line Discount"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>

                    <div className="text-right min-w-[68px] font-mono-numbers font-bold text-slate-900">
                      {formatKES(item.totalGross)}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId, item.batchId)}
                      className="text-slate-300 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tax Breakdown & Checkout Footer */}
          <div className="pt-3 border-t border-slate-200 space-y-2 shrink-0">
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal (Net of Tax):</span>
                <span className="font-mono-numbers">{formatKES(taxSummary.totalNetTaxable)}</span>
              </div>
              <div className="flex justify-between">
                <span>16% Standard VAT (Band A):</span>
                <span className="font-mono-numbers">{formatKES(taxSummary.taxAmounts.A)}</span>
              </div>
              {taxSummary.taxableAmounts.B > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Zero-Rated Goods (Band B):</span>
                  <span className="font-mono-numbers">{formatKES(taxSummary.taxableAmounts.B)} (0% VAT)</span>
                </div>
              )}
              {taxSummary.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Total Discount Given:</span>
                  <span className="font-mono-numbers">-{formatKES(taxSummary.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-100">
                <span>TOTAL PAYABLE (KES):</span>
                <span className="font-mono-numbers text-emerald-800 text-lg">
                  {formatKES(taxSummary.grandTotal)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={cart.length === 0}
                onClick={() => setHoldModalOpen(true)}
                className="px-3 py-2.5 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg font-medium disabled:opacity-30 transition-colors"
                title="Suspend active cart (F4)"
              >
                Hold
              </button>
              <button
                disabled={cart.length === 0}
                onClick={clearCart}
                className="px-3 py-2.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30"
              >
                Clear
              </button>
              <button
                disabled={cart.length === 0}
                onClick={() => handleOpenCheckout()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>Tender &amp; Validate eTIMS ({formatKES(taxSummary.grandTotal, false)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Tender Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Checkout Tender</h3>
                <div className="text-xs text-slate-500 font-mono">
                  {cart.length} items · Total VAT: {formatKES(taxSummary.totalTax)}
                </div>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">
                &times;
              </button>
            </div>

            <div className="text-center py-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-xs text-emerald-800 font-medium">Grand Total Due</div>
              <div className="text-2xl font-bold text-emerald-950 font-mono-numbers">
                {formatKES(taxSummary.grandTotal)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedMethod('MPESA_STK')}
                className={`p-2.5 rounded-lg border text-center font-semibold flex flex-col items-center gap-1 transition-colors ${
                  selectedMethod === 'MPESA_STK'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <SmartphoneNfc className="w-4 h-4 text-emerald-600" />
                <span>M-Pesa</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('CASH')}
                className={`p-2.5 rounded-lg border text-center font-semibold flex flex-col items-center gap-1 transition-colors ${
                  selectedMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4 text-slate-700" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('SPLIT')}
                className={`p-2.5 rounded-lg border text-center font-semibold flex flex-col items-center gap-1 transition-colors ${
                  selectedMethod === 'SPLIT'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Split className="w-4 h-4 text-blue-600" />
                <span>Split</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('CREDIT')}
                className={`p-2.5 rounded-lg border text-center font-semibold flex flex-col items-center gap-1 transition-colors ${
                  selectedMethod === 'CREDIT'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <BookOpenCheck className="w-4 h-4 text-amber-600" />
                <span>Madeni</span>
              </button>
            </div>

            {/* Dynamic Inputs based on Method */}
            {selectedMethod === 'MPESA_STK' && (
              <div className="space-y-2.5 text-xs">
                <label className="block font-medium text-slate-700">Customer Safaricom Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-semibold"
                />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-500">
                    Dispatch live Daraja STK Push prompt or record instant Till payment:
                  </span>
                  <button
                    type="button"
                    onClick={() => setStkModalOpen(true)}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-semibold shrink-0 transition-colors"
                  >
                    Simulate Phone Prompt
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'CASH' && (
              <div className="space-y-2 text-xs">
                <label className="block font-medium text-slate-700">Cash Received in Drawer (KES)</label>
                <input
                  type="number"
                  min={taxSummary.grandTotal}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={taxSummary.grandTotal.toString()}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                />
                {isCashInsufficient ? (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 font-medium">
                    Cash received must be at least {formatKES(taxSummary.grandTotal)}.
                  </div>
                ) : (
                  parseFloat(cashTendered) > taxSummary.grandTotal && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-semibold font-mono-numbers flex justify-between">
                      <span>Change to Return:</span>
                      <span>{formatKES(parseFloat(cashTendered) - taxSummary.grandTotal)}</span>
                    </div>
                  )
                )}
              </div>
            )}

            {selectedMethod === 'SPLIT' && (
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Cash Part (KES)</label>
                    <input
                      type="number"
                      min="0"
                      max={taxSummary.grandTotal}
                      value={splitCashAmount}
                      onChange={(e) => handleSplitCashChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">M-Pesa Part (KES)</label>
                    <input
                      type="number"
                      min="0"
                      max={taxSummary.grandTotal}
                      value={splitMpesaAmount}
                      onChange={(e) => handleSplitMpesaChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold text-emerald-800"
                    />
                  </div>
                </div>

                {isSplitMismatch && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-[11px]">
                    Split total ({formatKES(splitSum)}) must equal Grand Total ({formatKES(taxSummary.grandTotal)}).
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700 mb-1">M-Pesa Phone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'CREDIT' && (
              <div className="space-y-2 text-xs">
                {!selectedCustomer ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                    Please select a registered customer from the dropdown above to book credit (madeni).
                  </div>
                ) : isCreditBlocked ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Customer Credit Blocked!</span>
                    </div>
                    <div>
                      {selectedCustomer.name}&apos;s account is currently frozen from new credit sales. Please settle existing arrears first.
                    </div>
                  </div>
                ) : creditLimitExceeded ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Credit Limit Exceeded!</span>
                    </div>
                    <div>
                      {selectedCustomer.name}&apos;s credit limit is {formatKES(selectedCustomer.creditLimit)}.
                      Current debt is {formatKES(selectedCustomer.currentDebt)}. Adding {formatKES(taxSummary.grandTotal)} exceeds limit.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg">
                    <div className="font-bold">Book to {selectedCustomer.name}&apos;s Credit Account</div>
                    <div className="mt-0.5 text-[11px]">
                      New balance will be {formatKES(selectedCustomer.currentDebt + taxSummary.grandTotal)}. Repayment scheduled in 14 days.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Offline Notice */}
            {!isOnline && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-lg">
                <strong>Offline Mode Active:</strong> Invoice will be generated, signed locally, and queued for KRA VSCU transmission when internet reconnects.
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                disabled={
                  (selectedMethod === 'CREDIT' && (!selectedCustomer || isCreditBlocked || creditLimitExceeded)) ||
                  isCashInsufficient ||
                  isSplitMismatch
                }
                onClick={() => finalizeSale()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg shadow-sm"
              >
                Complete Sale &amp; Sign eTIMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Safaricom Daraja STK Push Countdown Modal */}
      {stkModalOpen && (
        <DarajaStkModal
          amount={selectedMethod === 'SPLIT' ? parseFloat(splitMpesaAmount) || 0 : taxSummary.grandTotal}
          phone={customerPhone}
          onSuccess={(mpesaCode, phone) => finalizeSale(mpesaCode, phone)}
          onCancel={() => setStkModalOpen(false)}
        />
      )}

      {/* Line Item Discount Modal */}
      {discountModalItem && (
        <LineItemDiscountModal
          item={discountModalItem}
          onApplyDiscount={applyLineDiscount}
          onClose={() => setDiscountModalItem(null)}
        />
      )}

      {/* Batch Select Modal */}
      {batchModalProduct && (
        <BatchSelectModal
          product={batchModalProduct}
          branchId={activeBranch.id}
          onSelectBatch={(batch) => addItemToCart(batchModalProduct, batch)}
          onClose={() => setBatchModalProduct(null)}
        />
      )}

      {/* Suspended Orders / Hold Cart Modal */}
      {holdModalOpen && (
        <HoldCartModal
          currentCart={cart}
          customerId={selectedCustomerId}
          onRecallCart={(recalledCart, custId) => {
            setCart(recalledCart);
            if (custId) setSelectedCustomerId(custId);
          }}
          onClearActiveCart={clearCart}
          onClose={() => setHoldModalOpen(false)}
        />
      )}

      {/* Completed Invoice Printable Thermal Receipt Modal */}
      {completedInvoice && (
        <ReceiptModal invoice={completedInvoice} onClose={() => setCompletedInvoice(null)} />
      )}
    </div>
  );
};
