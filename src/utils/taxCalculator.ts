import { CartItem } from '../types/sales';
import { TaxRateCode, KRA_TAX_CLASSIFICATIONS, EtimsTransmissionPayload } from '../types/tax';

export interface CalculatedItemTax {
  effectiveUnitPrice: number;
  netUnitAmount: number;
  vatPerUnit: number;
  totalNet: number;
  totalVat: number;
  totalGross: number;
}

/**
 * Calculates VAT amounts for an item where retail selling price is VAT-inclusive
 * (standard retail convention in Kenya).
 */
export function calculateItemTax(
  unitPrice: number,
  quantity: number,
  discountPerUnit: number = 0,
  taxCode: TaxRateCode
): CalculatedItemTax {
  const effectiveUnitPrice = Math.max(0, unitPrice - discountPerUnit);
  const totalGross = Number((effectiveUnitPrice * quantity).toFixed(2));
  const ratePercent = KRA_TAX_CLASSIFICATIONS[taxCode]?.ratePercent || 0;

  if (ratePercent <= 0) {
    return {
      effectiveUnitPrice,
      netUnitAmount: effectiveUnitPrice,
      vatPerUnit: 0,
      totalNet: totalGross,
      totalVat: 0,
      totalGross,
    };
  }

  // Tax inclusive formula: Net = Gross / (1 + rate / 100)
  const totalNet = Number((totalGross / (1 + ratePercent / 100)).toFixed(2));
  const totalVat = Number((totalGross - totalNet).toFixed(2));
  const netUnitAmount = Number((totalNet / quantity).toFixed(2));
  const vatPerUnit = Number((totalVat / quantity).toFixed(2));

  return {
    effectiveUnitPrice,
    netUnitAmount,
    vatPerUnit,
    totalNet,
    totalVat,
    totalGross,
  };
}

export interface InvoiceTaxSummary {
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  taxableAmounts: Record<TaxRateCode, number>;
  taxAmounts: Record<TaxRateCode, number>;
  totalTax: number;
  totalNetTaxable: number;
}

export function calculateInvoiceTaxSummary(items: CartItem[]): InvoiceTaxSummary {
  const taxableAmounts: Record<TaxRateCode, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  };

  const taxAmounts: Record<TaxRateCode, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  };

  let subtotal = 0;
  let totalDiscount = 0;
  let grandTotal = 0;

  for (const item of items) {
    subtotal += item.originalPrice * item.quantity;
    totalDiscount += item.discountPerUnit * item.quantity;
    grandTotal += item.totalGross;

    const code = item.taxRateCode;
    taxableAmounts[code] = Number(((taxableAmounts[code] || 0) + item.totalNet).toFixed(2));
    taxAmounts[code] = Number(((taxAmounts[code] || 0) + item.totalVat).toFixed(2));
  }

  const totalTax = Number(
    Object.values(taxAmounts)
      .reduce((sum, val) => sum + val, 0)
      .toFixed(2)
  );

  const totalNetTaxable = Number(
    Object.values(taxableAmounts)
      .reduce((sum, val) => sum + val, 0)
      .toFixed(2)
  );

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
    taxableAmounts,
    taxAmounts,
    totalTax,
    totalNetTaxable,
  };
}

/**
 * Builds the official KRA VSCU transmission payload structure
 */
export function buildEtimsPayload(
  invoiceNumber: string,
  seqNumber: number,
  items: CartItem[],
  taxSummary: InvoiceTaxSummary,
  cashierName: string,
  customerPin?: string,
  customerName?: string,
  paymentMethodCode: '01' | '02' | '03' | '04' | '05' = '01'
): EtimsTransmissionPayload {
  const now = new Date();
  const cfmDt = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHmmss
  const salesDt = cfmDt.slice(0, 8); // YYYYMMDD

  return {
    trdInvcNo: invoiceNumber,
    invcNo: seqNumber,
    custTin: customerPin,
    custNm: customerName,
    rcptTyCd: 'S',
    pmtTyCd: paymentMethodCode,
    salesSttsCd: '02',
    cfmDt,
    salesDt,
    stockRlsDt: cfmDt,
    totItemCnt: items.reduce((sum, i) => sum + i.quantity, 0),
    taxblAmtA: taxSummary.taxableAmounts.A,
    taxblAmtB: taxSummary.taxableAmounts.B,
    taxblAmtC: taxSummary.taxableAmounts.C,
    taxblAmtD: taxSummary.taxableAmounts.D,
    taxblAmtE: taxSummary.taxableAmounts.E,
    taxAmtA: taxSummary.taxAmounts.A,
    taxAmtB: taxSummary.taxAmounts.B,
    taxAmtC: taxSummary.taxAmounts.C,
    taxAmtD: taxSummary.taxAmounts.D,
    taxAmtE: taxSummary.taxAmounts.E,
    totTaxblAmt: taxSummary.totalNetTaxable,
    totTaxAmt: taxSummary.totalTax,
    totAmt: taxSummary.grandTotal,
    prchrAcptcYn: 'N',
    regrNm: cashierName,
    modrNm: cashierName,
  };
}
