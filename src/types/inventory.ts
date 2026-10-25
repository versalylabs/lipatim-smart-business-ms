import { TaxRateCode } from './tax';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  county: string;
  phone: string;
  isMainWarehouse: boolean;
  active: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  colorTag?: string;
}

export interface StockBatch {
  id: string;
  productId: string;
  branchId: string;
  batchNumber: string; // e.g. "BCH-2026-A12"
  manufacturingDate?: string;
  expiryDate?: string; // Critical for pharmacy/groceries
  costPrice: number; // Wholesaler unit cost in KES
  sellingPrice: number; // Retail unit price in KES
  initialQuantity: number;
  currentQuantity: number;
  receivedDate: string;
  supplierId?: string;
}

export interface Product {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  genericName?: string; // For chemists (e.g. Paracetamol)
  categoryId: string;
  categoryName: string;
  unit: 'PCS' | 'KG' | 'LTR' | 'BOX' | 'PKT' | 'BTL' | 'TIN';
  taxRateCode: TaxRateCode;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  reorderLevel: number; // Low stock threshold
  isPerishable: boolean;
  requiresPrescription?: boolean;
  totalStock: number;
  branchStock: Record<string, number>; // branchId -> quantity
  batches: StockBatch[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | 'STOCK_IN_PURCHASE' // Goods Received Note (GRN)
  | 'STOCK_OUT_SALE' // POS sale deduction
  | 'STOCK_OUT_EXPIRY' // Expired removal
  | 'STOCK_OUT_DAMAGE' // Broken/damaged
  | 'STOCK_OUT_THEFT' // Shrinkage reconciliation
  | 'TRANSFER_OUT' // Transfer to another branch
  | 'TRANSFER_IN' // Transfer from another branch
  | 'MANUAL_ADJUSTMENT';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  branchId: string;
  sourceBranchId?: string;
  destinationBranchId?: string;
  type: MovementType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalValue: number;
  referenceNo?: string; // GRN number, Invoice number, or transfer note
  notes?: string;
  recordedBy: string; // Cashier or Manager name
  timestamp: string;
}

export interface StockTransferRecord {
  id: string;
  transferNumber: string; // e.g. "TRN-2026-0012"
  sourceBranchId: string;
  sourceBranchName: string;
  destinationBranchId: string;
  destinationBranchName: string;
  productId: string;
  productName: string;
  batchNumber?: string;
  quantity: number;
  status: 'COMPLETED' | 'IN_TRANSIT' | 'CANCELLED';
  dispatchedBy: string;
  receivedBy?: string;
  notes?: string;
  timestamp: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string; // e.g. "GRN-2026-0081"
  supplierId: string;
  supplierName: string;
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  retailPrice: number;
  supplierInvoiceRef?: string;
  receivedBy: string;
  timestamp: string;
}

