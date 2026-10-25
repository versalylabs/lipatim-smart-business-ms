import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { KRA_TAX_CLASSIFICATIONS } from '../../types/tax';
import { GoodsReceivedModal } from '../inventory/GoodsReceivedModal';
import { StockTransferModal } from '../inventory/StockTransferModal';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
import { ExpiryAuditTable } from '../inventory/ExpiryAuditTable';
import { SupplierRestockDrawer } from '../inventory/SupplierRestockDrawer';
import { CategoryManagerModal } from '../inventory/CategoryManagerModal';
import {
  Search,
  Plus,
  Truck,
  ArrowLeftRight,
  Trash2,
  AlertTriangle,
  Download,
  Edit3,
  Layers,
} from 'lucide-react';
import { Product } from '../../types/inventory';

export const InventoryView: React.FC = () => {
  const {
    products,
    categories,
    activeBranch,
    branches,
    grns,
    stockTransfers,
    addProduct,
    updateProduct,
    deleteProduct,
    permissions,
    notify,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'grn' | 'transfers' | 'expiry'>(
    'catalog'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showRestockDrawer, setShowRestockDrawer] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalInitialId, setCategoryModalInitialId] = useState<string | null>(null);

  // Reset category filter if selected category was deleted
  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.some((c) => c.id === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  // New / Edit product form fields
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newSelling, setNewSelling] = useState('');
  const [newStock, setNewStock] = useState('50');
  const [newTaxCode, setNewTaxCode] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [newCatId, setNewCatId] = useState(categories[0]?.id || '');
  const [newBarcode, setNewBarcode] = useState('');
  const [newReorder, setNewReorder] = useState('15');

  const filteredProducts = products.filter((p) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.barcode.includes(query) ||
      p.sku.toLowerCase().includes(query);
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const lowStockCount = products.filter((p) => p.totalStock <= p.reorderLevel).length;

  const openAddModal = () => {
    setEditingProduct(null);
    setNewName('');
    setNewCost('');
    setNewSelling('');
    setNewStock('50');
    setNewTaxCode('A');
    setNewCatId(categories[0]?.id || '');
    setNewBarcode('');
    setNewReorder('15');
    setShowAddProductModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNewName(product.name);
    setNewCost(product.costPrice.toString());
    setNewSelling(product.sellingPrice.toString());
    setNewStock((product.branchStock[activeBranch.id] || 0).toString());
    setNewTaxCode(product.taxRateCode);
    setNewCatId(product.categoryId);
    setNewBarcode(product.barcode);
    setNewReorder(product.reorderLevel.toString());
    setShowAddProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSelling) return;

    const categoryObj = categories.find((c) => c.id === newCatId);

    if (editingProduct) {
      const updatedBranchStock = {
        ...editingProduct.branchStock,
        [activeBranch.id]: parseInt(newStock) || 0,
      };
      const newTotalStock = Object.values(updatedBranchStock).reduce((sum, q) => sum + q, 0);

      updateProduct(editingProduct.id, {
        name: newName,
        barcode: newBarcode || editingProduct.barcode,
        categoryId: newCatId,
        categoryName: categoryObj?.name || editingProduct.categoryName,
        costPrice: parseFloat(newCost) || 0,
        sellingPrice: parseFloat(newSelling) || 0,
        reorderLevel: parseInt(newReorder) || 10,
        taxRateCode: newTaxCode,
        branchStock: updatedBranchStock,
        totalStock: newTotalStock,
      });
    } else {
      addProduct({
        name: newName,
        barcode: newBarcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        categoryId: newCatId,
        costPrice: parseFloat(newCost) || 0,
        sellingPrice: parseFloat(newSelling) || 0,
        totalStock: parseInt(newStock) || 0,
        reorderLevel: parseInt(newReorder) || 10,
        taxRateCode: newTaxCode,
        branchStock: { [activeBranch.id]: parseInt(newStock) || 0 },
      });
    }

    setShowAddProductModal(false);
    setEditingProduct(null);
  };

  const handleExportCatalogCsv = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Product Name',
      'Category',
      'Tax Band',
      'Cost Price (KES)',
      'Retail Price (KES)',
      'CBD Stock',
      'Westlands Stock',
      'Ind Area Stock',
      'Total Stock',
    ];
    const rows = filteredProducts.map((p) => [
      p.sku,
      p.barcode,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.categoryName}"`,
      p.taxRateCode,
      p.costPrice,
      p.sellingPrice,
      p.branchStock['br_cbd'] || 0,
      p.branchStock['br_westlands'] || 0,
      p.branchStock['br_ind_area'] || 0,
      p.totalStock,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LipaTim_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('success', 'Catalog Exported', `Exported ${filteredProducts.length} items to CSV.`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Smart Inventory &amp; Stock</h1>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
              {branches.length} Branches Linked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Goods Received Notes (GRN), inter-branch replenishment, batch expiry tracking, and KRA tax bands.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCatalogCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            title="Export Inventory Catalog to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {lowStockCount > 0 && (
            <button
              onClick={() => setShowRestockDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-2xs transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Restock Order ({lowStockCount})</span>
            </button>
          )}

          {permissions.canPerformStockTransfer && (
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
              <span>Inter-Branch Transfer</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setCategoryModalInitialId(null);
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            title="Manage goods categories"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Categories</span>
          </button>

          {permissions.canManageInventory && (
            <>
              <button
                onClick={() => setShowAdjustmentModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-2xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Write-Off</span>
              </button>

              <button
                onClick={() => setShowGrnModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Receive Stock (GRN)</span>
              </button>

              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl max-w-full overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'catalog'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Catalog &amp; Multi-Branch Stock ({products.length})
        </button>
        <button
          onClick={() => setActiveSubTab('grn')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'grn'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Goods Received (GRN Logs) ({grns.length})
        </button>
        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'transfers'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Branch Transfers ({stockTransfers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('expiry')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'expiry'
              ? 'bg-white text-rose-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Perishables &amp; Expiry Audit
        </button>
      </div>

      {/* Tab 1: Catalog & Multi-Branch Stock */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product name, barcode, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>All Products</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    selectedCategory === 'all'
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.id).length;
                const isSelected = selectedCategory === c.id;

                return (
                  <div key={c.id} className="relative group shrink-0 flex items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs pr-7'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 group-hover:pr-7'
                      }`}
                      title={c.description || c.name}
                    >
                      <span>{c.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                          isSelected
                            ? 'bg-slate-800 text-slate-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>

                    {/* Quick Edit/Manage button on pill */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryModalInitialId(c.id);
                        setShowCategoryModal(true);
                      }}
                      className={`absolute right-1.5 p-1 rounded-md transition-all ${
                        isSelected
                          ? 'text-slate-300 hover:text-white hover:bg-slate-800 opacity-100'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100'
                      }`}
                      title={`Edit or delete "${c.name}"`}
                      aria-label={`Edit ${c.name}`}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Add New Category Pill Button */}
              <button
                type="button"
                onClick={() => {
                  setCategoryModalInitialId(null);
                  setShowCategoryModal(true);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                title="Create a new inventory category"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>

              {/* Manage All Categories Pill Button */}
              <button
                type="button"
                onClick={() => {
                  setCategoryModalInitialId(null);
                  setShowCategoryModal(true);
                }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200"
                title="Manage all categories (rename, edit descriptions, delete)"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Manage Categories</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Item &amp; Barcode</th>
                    <th className="py-3 px-3">Tax Band</th>
                    {permissions.canViewCostPrices && (
                      <th className="py-3 px-3 text-right">Cost (KES)</th>
                    )}
                    <th className="py-3 px-3 text-right">Retail (KES)</th>
                    <th className="py-3 px-3 text-center">CBD Main</th>
                    <th className="py-3 px-3 text-center">Westlands</th>
                    <th className="py-3 px-3 text-center">Ind. Area</th>
                    <th className="py-3 px-4 text-right">Total Network</th>
                    {permissions.canManageInventory && (
                      <th className="py-3 px-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLow = p.totalStock <= p.reorderLevel;
                    const taxInfo = KRA_TAX_CLASSIFICATIONS[p.taxRateCode];

                    const stockCbd = p.branchStock['br_cbd'] || 0;
                    const stockWest = p.branchStock['br_westlands'] || 0;
                    const stockInd = p.branchStock['br_ind_area'] || 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Barcode: {p.barcode} · SKU: {p.sku}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span title={taxInfo?.description}>
                            Band {p.taxRateCode} ({taxInfo?.ratePercent}%)
                          </span>
                        </td>
                        {permissions.canViewCostPrices && (
                          <td className="py-3 px-3 text-right font-mono-numbers text-slate-500">
                            {formatKES(p.costPrice)}
                          </td>
                        )}
                        <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-slate-900">
                          {formatKES(p.sellingPrice)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono-numbers">
                          <span className={stockCbd === 0 ? 'text-slate-300' : 'text-slate-800'}>
                            {stockCbd}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono-numbers">
                          <span className={stockWest === 0 ? 'text-slate-300' : 'text-slate-800'}>
                            {stockWest}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono-numbers">
                          <span className={stockInd === 0 ? 'text-slate-300' : 'text-slate-800'}>
                            {stockInd}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono-numbers">
                          <div className={`font-semibold ${isLow ? 'text-amber-700' : 'text-slate-900'}`}>
                            {p.totalStock} {p.unit}
                          </div>
                          {isLow && (
                            <div className="text-[10px] text-amber-600 flex items-center justify-end gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Reorder &le; {p.reorderLevel}</span>
                            </div>
                          )}
                        </td>
                        {permissions.canManageInventory && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Edit Product Pricing & Stock"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${p.name}" from inventory catalog?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Goods Received (GRN Logs) */}
      {activeSubTab === 'grn' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Goods Received Note (GRN) Ledger</h2>
              <div className="text-[11px] text-slate-500">
                Official stock-in records from wholesalers with purchase cost verification
              </div>
            </div>
            {permissions.canManageInventory && (
              <button
                onClick={() => setShowGrnModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                + Create GRN
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">GRN #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Item Received</th>
                  <th className="py-3 px-3">Wholesaler</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3 text-right">Units</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grns.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{g.grnNumber}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {new Date(g.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{g.productName}</td>
                    <td className="py-3 px-3 text-slate-600">{g.supplierName}</td>
                    <td className="py-3 px-3 text-slate-600">{g.branchName}</td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      +{g.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                      {formatKES(g.unitCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-emerald-800">
                      {formatKES(g.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Branch Transfers */}
      {activeSubTab === 'transfers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inter-Branch Stock Movement Log</h2>
              <div className="text-[11px] text-slate-500">
                Audited transfers between Depot and retail store counters
              </div>
            </div>
            {permissions.canPerformStockTransfer && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                + New Transfer
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Transfer #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-3">Source (From)</th>
                  <th className="py-3 px-3">Destination (To)</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.transferNumber}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {new Date(t.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{t.productName}</td>
                    <td className="py-3 px-3 text-slate-600">{t.sourceBranchName}</td>
                    <td className="py-3 px-3 text-slate-600">{t.destinationBranchName}</td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      {t.quantity}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-mono bg-emerald-50 text-emerald-800 font-semibold">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Expiry Audit Table */}
      {activeSubTab === 'expiry' && <ExpiryAuditTable />}

      {/* Modals */}
      {showGrnModal && <GoodsReceivedModal onClose={() => setShowGrnModal(false)} />}
      {showTransferModal && <StockTransferModal onClose={() => setShowTransferModal(false)} />}
      {showAdjustmentModal && <StockAdjustmentModal onClose={() => setShowAdjustmentModal(false)} />}
      {showRestockDrawer && <SupplierRestockDrawer onClose={() => setShowRestockDrawer(false)} />}

      {/* Add / Edit Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add Inventory Item'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddProductModal(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unga Jogoo 2kg"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Barcode (EAN-13)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryModalInitialId(newCatId || null);
                      setShowCategoryModal(true);
                    }}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Manage Categories</span>
                  </button>
                </div>
                <select
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">KRA Tax Band</label>
                <select
                  value={newTaxCode}
                  onChange={(e) => setNewTaxCode(e.target.value as 'A' | 'B' | 'C' | 'D' | 'E')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                >
                  <option value="A">Band A - 16% Standard VAT</option>
                  <option value="B">Band B - 0% Zero-Rated (Pharma/Flour)</option>
                  <option value="C">Band C - Exempt (Fresh Produce/Milk)</option>
                  <option value="D">Band D - Non-VATable</option>
                  <option value="E">Band E - 8% Fuel &amp; Special</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Wholesale Cost (KES)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="150"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Retail Selling Price (KES)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  placeholder="200"
                  value={newSelling}
                  onChange={(e) => setNewSelling(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-emerald-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {editingProduct ? `${activeBranch.name} Stock` : 'Initial Stock Units'}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="50"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Reorder Alert Level</label>
                <input
                  type="number"
                  min="0"
                  value={newReorder}
                  onChange={(e) => setNewReorder(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddProductModal(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {editingProduct ? 'Save Changes' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goods & Inventory Category Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setCategoryModalInitialId(null);
        }}
        initialEditingId={categoryModalInitialId}
        onSelectCategory={(newCat) => {
          setSelectedCategory(newCat);
          setNewCatId(newCat);
        }}
      />
    </div>
  );
};
