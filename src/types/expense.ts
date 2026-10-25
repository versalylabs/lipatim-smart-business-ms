export type ExpenseCategory =
  | 'RENT'
  | 'ELECTRICITY_KPLC'
  | 'WATER'
  | 'STAFF_WAGES'
  | 'CASUAL_LABOUR'
  | 'COUNTY_LICENSES'
  | 'TRANSPORT_LOGISTICS'
  | 'INTERNET_AIRTIME'
  | 'PACKAGING_BAGS'
  | 'MAINTENANCE_REPAIRS'
  | 'BANK_MPESA_FEES'
  | 'MISCELLANEOUS';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  title: string;
  description?: string;
  amount: number;
  branchId: string;
  paymentMethod: 'CASH' | 'MPESA' | 'BANK';
  referenceNo?: string; // M-Pesa code, token number, or receipt ref
  vendorOrRecipient: string;
  approvedBy: string;
  receiptAttachmentUrl?: string;
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  kraPin?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  paymentTermsDays: number;
  totalPurchased: number;
  balancePayable: number;
  active: boolean;
}

export interface SupplierPaymentRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: 'BANK' | 'MPESA' | 'CASH';
  referenceNo: string;
  notes?: string;
  paidBy: string;
  timestamp: string;
}

