/**
 * KRA eTIMS Tax Classifications & Data Models
 * Aligned with KRA VSCU / OSCU technical specifications
 */

export type TaxRateCode = 'A' | 'B' | 'C' | 'D' | 'E';

export interface TaxClassification {
  code: TaxRateCode;
  label: string;
  ratePercent: number;
  description: string;
  isVatable: boolean;
}

export const KRA_TAX_CLASSIFICATIONS: Record<TaxRateCode, TaxClassification> = {
  A: {
    code: 'A',
    label: 'Standard Rate (16%)',
    ratePercent: 16.0,
    description: 'Standard taxable goods & services under the Kenyan VAT Act',
    isVatable: true,
  },
  B: {
    code: 'B',
    label: 'Zero Rated (0%)',
    ratePercent: 0.0,
    description: 'Exported goods, pharmaceutical supplies, and specific essential food items',
    isVatable: true,
  },
  C: {
    code: 'C',
    label: 'Exempt',
    ratePercent: 0.0,
    description: 'Financial services, unprocessed agricultural produce, specialized medical care',
    isVatable: false,
  },
  D: {
    code: 'D',
    label: 'Non-VATable',
    ratePercent: 0.0,
    description: 'Government duties, statutory levies, and stamp duty',
    isVatable: false,
  },
  E: {
    code: 'E',
    label: 'Fuel & Petroleum (8%)',
    ratePercent: 8.0,
    description: 'Petroleum products subject to preferential VAT rate',
    isVatable: true,
  },
};

export interface EtimsTransmissionPayload {
  trdInvcNo: string; // Trader Invoice Number
  invcNo: number; // KRA Invoice Sequential Number
  orgInvcNo?: number; // Original Invoice Number (for Credit Notes)
  custTin?: string; // Customer KRA PIN
  custNm?: string; // Customer Name
  rcptTyCd: 'S' | 'C' | 'D'; // Sale (S), Credit Note (C), Debit Note (D)
  pmtTyCd: '01' | '02' | '03' | '04' | '05'; // Cash (01), Credit (02), Cash/Cheque (03), Bank/M-Pesa (04), Split (05)
  salesSttsCd: '02' | '03'; // Approved (02), Cancelled (03)
  cfmDt: string; // Confirmation Date & Time (YYYYMMDDHHmmss)
  salesDt: string; // Sales Date (YYYYMMDD)
  stockRlsDt?: string; // Stock Release Date
  cnclReqDt?: string; // Cancel Request Date
  totItemCnt: number; // Total Item Count
  taxblAmtA: number; // 16% Taxable base
  taxblAmtB: number; // 0% Taxable base
  taxblAmtC: number; // Exempt base
  taxblAmtD: number; // Non-VATable base
  taxblAmtE: number; // 8% Taxable base
  taxAmtA: number; // 16% VAT Amount
  taxAmtB: number; // 0.00
  taxAmtC: number; // 0.00
  taxAmtD: number; // 0.00
  taxAmtE: number; // 8% VAT Amount
  totTaxAmt: number; // Total VAT
  totTaxblAmt: number; // Total Taxable Amount
  totAmt: number; // Grand Total
  prchrAcptcYn: 'Y' | 'N'; // Purchaser acceptance
  remark?: string;
  regrNm: string; // Cashier / Registrar Name
  modrNm: string;
}

export interface EtimsValidationResult {
  status: 'PENDING' | 'TRANSMITTED' | 'FAILED' | 'OFFLINE_QUEUED';
  cuSerialNumber: string; // Control Unit Serial Number: e.g., KRA-VSCU-20260401-08421
  scuSignature: string; // Cryptographic verification signature
  qrCodeUrl: string; // Official KRA verification URL
  internalHash: string;
  transmittedAt?: string;
  errorMessage?: string;
}
