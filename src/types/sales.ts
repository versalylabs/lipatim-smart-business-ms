import { TaxRateCode, EtimsTransmissionPayload, EtimsValidationResult } from './tax';

export interface Customer {
  id: string;
  name: string;
  phone: string; // Kenyan format +254...
  kraPin?: string; // Optional for B2B or eTIMS registered buyers
  email?: string;
  nationalId?: string;
  location?: string;
  creditLimit: number; // Max allowed debt (madeni)
  currentDebt: number; // Current outstanding balance
  isCreditBlocked: boolean;
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  batchId?: string;
  barcode: string;
  name: string;
  quantity: number;
  availableStock: number;
  unitPrice: number; // Retail price inclusive of VAT
  originalPrice: number;
  discountPerUnit: number;
  taxRateCode: TaxRateCode;
  taxRatePercent: number;
  netUnitAmount: number; // Exclusive of tax
  vatPerUnit: number;
  totalNet: number;
  totalVat: number;
  totalGross: number; // (unitPrice - discount) * quantity
}

export type PaymentMethod =
  | 'CASH'
  | 'MPESA_STK'
  | 'MPESA_TILL'
  | 'MPESA_PAYBILL'
  | 'CREDIT' // Madeni
  | 'BANK_TRANSFER'
  | 'SPLIT';

export interface PaymentRecord {
  id: string;
  method: PaymentMethod;
  amount: number;
  mpesaReceiptNumber?: string; // e.g. "RJK928LM40"
  customerPhone?: string;
  transactionReference?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  timestamp: string;
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'REFUNDED';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "LT-2026-00492"
  branchId: string;
  branchName: string;
  cashierId: string;
  cashierName: string;
  customer?: Customer;
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmounts: Record<TaxRateCode, number>;
  taxAmounts: Record<TaxRateCode, number>;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  changeGiven: number;
  payments: PaymentRecord[];
  paymentStatus: PaymentStatus;
  etimsTransmission: EtimsTransmissionPayload;
  etimsValidation: EtimsValidationResult;
  notes?: string;
  offlineQueued: boolean;
  createdAt: string;
}

export interface DebtRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  invoiceId: string;
  invoiceNumber: string;
  initialAmount: number;
  amountPaid: number;
  balanceRemaining: number;
  dueDate: string;
  status: 'ACTIVE' | 'SETTLED' | 'OVERDUE' | 'BAD_DEBT';
  lastReminderSentAt?: string;
  reminderCount: number;
  createdAt: string;
}

export type MpesaChannel = 'BUY_GOODS' | 'PAYBILL' | 'STK_PUSH';

export interface MpesaTransaction {
  id: string;
  receiptNumber: string; // e.g. "SJA9921KM0"
  amount: number;
  phoneNumber: string; // "+254 722 100 200"
  customerName: string; // e.g. "JOHN KAMAU"
  shortcode: string; // e.g. "8841920" (Till) or "522522" (Paybill)
  channel: MpesaChannel;
  status: 'RECONCILED' | 'UNCLAIMED' | 'DISPUTED';
  linkedInvoiceId?: string;
  linkedInvoiceNumber?: string;
  reconciledBy?: string;
  reconciledAt?: string;
  timestamp: string;
}

export interface DarajaConfig {
  environment: 'sandbox' | 'production';
  businessShortCode: string;
  tillNumber: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  stkCallbackUrl: string;
  autoReconcile: boolean;
}

