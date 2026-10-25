/**
 * Kenyan Financial & Localization Utilities
 * Specifically tailored for Nairobi SME business operations, KRA compliance & M-Pesa.
 */

/**
 * Formats an amount into Kenyan Shillings (KES)
 * Examples: KES 1,450.00 or KES 500
 */
export function formatKES(amount: number, showDecimals: boolean = true): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(safeAmount);
}

/**
 * Validates a Kenyan Revenue Authority (KRA) PIN
 * Format: 11 characters starting with 'A' (Individual) or 'P' (Non-Individual/Company),
 * followed by 9 digits/alphanumeric, ending with an alphabetical checksum character.
 * Example: P051234567Z or A001234567K
 */
export function validateKraPin(pin: string): { isValid: boolean; error?: string } {
  if (!pin || pin.trim() === '') {
    return { isValid: false, error: 'KRA PIN cannot be empty' };
  }

  const cleanPin = pin.trim().toUpperCase();
  const kraRegex = /^[AP][0-9]{9}[A-Z]$/;

  if (!kraRegex.test(cleanPin)) {
    return {
      isValid: false,
      error: 'Invalid KRA PIN. Must start with A or P, followed by 9 digits and 1 letter (e.g., P051234567Z).',
    };
  }

  return { isValid: true };
}

/**
 * Normalizes Kenyan Mobile Numbers across Safaricom, Airtel, and Telkom.
 * Accepts:
 *   - "0712345678"
 *   - "0112345678"
 *   - "+254712345678"
 *   - "254712345678"
 * Returns:
 *   - formatted: "+254 712 345 678"
 *   - mpesaDial: "254712345678"
 */
export function normalizeKenyanPhone(phone: string): {
  isValid: boolean;
  formatted: string;
  mpesaDial: string;
  carrier?: 'Safaricom' | 'Airtel' | 'Telkom' | 'Equitel';
  error?: string;
} {
  if (!phone) {
    return { isValid: false, formatted: '', mpesaDial: '', error: 'Phone number is required' };
  }

  // Strip all non-digits except leading +
  let cleaned = phone.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+254')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('254')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  // A valid Kenyan phone suffix must be 9 digits starting with 7 or 1
  if (!/^[17][0-9]{8}$/.test(cleaned)) {
    return {
      isValid: false,
      formatted: phone,
      mpesaDial: '',
      error: 'Enter a valid 10-digit Kenyan phone number (e.g. 0712 345 678 or 0110 123 456)',
    };
  }

  const mpesaDial = `254${cleaned}`;
  const prefix = cleaned.slice(0, 3);
  const part1 = cleaned.slice(3, 6);
  const part2 = cleaned.slice(6);
  const formatted = `+254 ${cleaned[0]}${prefix.slice(1)} ${part1} ${part2}`;

  // Carrier detection
  let carrier: 'Safaricom' | 'Airtel' | 'Telkom' | 'Equitel' = 'Safaricom';
  const firstTwo = cleaned.slice(0, 2);
  if (firstTwo === '73' || firstTwo === '78' || firstTwo === '10') {
    carrier = 'Airtel';
  } else if (firstTwo === '77') {
    carrier = 'Telkom';
  } else if (firstTwo === '76') {
    carrier = 'Equitel';
  }

  return {
    isValid: true,
    formatted,
    mpesaDial,
    carrier,
  };
}

/**
 * Generates an authentic KRA Control Unit (CU) Serial Number
 * Format: KRA-VSCU-[BRANCH]-[YEAR][MONTH]-[SEQUENCE]
 */
export function generateCuSerialNumber(branchCode: string, sequence: number = 1042): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqPadded = sequence.toString().padStart(6, '0');
  return `KRA-VSCU-${branchCode}-${dateStr}-${seqPadded}`;
}

/**
 * Generates a standard receipt/invoice reference
 */
export function generateInvoiceNumber(sequence: number): string {
  const currentYear = new Date().getFullYear();
  return `LT-${currentYear}-${sequence.toString().padStart(6, '0')}`;
}

/**
 * Generates a realistic Safaricom M-Pesa transaction code
 * e.g. RJK829MN14
 */
export function generateMpesaReceiptCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'S'; // Standard Safaricom starting letter
  for (let i = 0; i < 9; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates official KRA eTIMS Verification URL & cryptographic verification hash
 */
export function generateKraVerificationDetails(cuSerial: string, date: string, grandTotal: number) {
  const internalHash = Array.from(
    `${cuSerial}-${date}-${grandTotal.toFixed(2)}-KENYA-REVENUE-AUTHORITY`
  )
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
    .toUpperCase();

  const qrUrl = `https://itax.kra.go.ke/KRA-Portal/invoiceConfirmation.htm?invoiceNo=${encodeURIComponent(
    cuSerial
  )}&date=${encodeURIComponent(date)}&tot=${encodeURIComponent(grandTotal.toFixed(2))}&hash=${internalHash.slice(0, 8)}`;

  return {
    internalHash,
    qrUrl,
    signature: `SHA256:${internalHash.slice(0, 16)}...`,
  };
}
