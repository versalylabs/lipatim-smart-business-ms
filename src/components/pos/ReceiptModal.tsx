import React, { useState, useEffect } from 'react';
import { Invoice } from '../../types/sales';
import { useApp } from '../../context/AppContext';
import { formatKES } from '../../utils/kenya';
import { generateQrCodeDataUrl } from '../../utils/qrCode';
import {
  Printer,
  Share2,
  Copy,
  CheckCircle2,
  X,
  Bluetooth,
  Mail,
} from 'lucide-react';

interface ReceiptModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, onClose }) => {
  const { printerDevice, printerPaperSize, printThermalReceipt } = useApp();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(printerPaperSize);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (invoice.etimsValidation.qrCodeUrl) {
      generateQrCodeDataUrl(invoice.etimsValidation.qrCodeUrl).then((url) => {
        setQrCodeDataUrl(url);
      });
    }
  }, [invoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleBluetoothEscPosPrint = () => {
    printThermalReceipt(invoice);
  };

  const getReceiptShareLines = () => [
    `*LIPATIM eTIMS TAX INVOICE*`,
    `Invoice: ${invoice.invoiceNumber}`,
    `Date: ${new Date(invoice.createdAt).toLocaleString()}`,
    `Branch: ${invoice.branchName}`,
    `Cashier: ${invoice.cashierName}`,
    `-----------------------------`,
    ...invoice.items.map(
      (i) => `${i.name} x ${i.quantity} = ${formatKES(i.totalGross)} (${i.taxRateCode})`
    ),
    `-----------------------------`,
    `*TOTAL: ${formatKES(invoice.grandTotal)}*`,
    `VAT (16%): ${formatKES(invoice.totalTax)}`,
    `Payment: ${invoice.payments[0]?.method} ${
      invoice.payments[0]?.mpesaReceiptNumber ? `(Ref: ${invoice.payments[0].mpesaReceiptNumber})` : ''
    }`,
    `-----------------------------`,
    `KRA CU Serial: ${invoice.etimsValidation.cuSerialNumber}`,
    `Verify Tax Invoice on KRA Portal:`,
    invoice.etimsValidation.qrCodeUrl,
  ];

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(getReceiptShareLines().join('\n'));
    const phone = invoice.customer?.phone?.replace(/[^0-9]/g, '') || '';
    const waUrl = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`KRA eTIMS Tax Invoice ${invoice.invoiceNumber} - LipaTim Retail Ltd`);
    const body = encodeURIComponent(getReceiptShareLines().join('\n').replace(/\*/g, ''));
    const email = invoice.customer?.email || '';
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyRawText = () => {
    const raw = [
      '================================',
      '      LIPATIM RETAIL LTD        ',
      '   PIN: P051239841K (KRA eTIMS) ',
      `    ${invoice.branchName.toUpperCase()}    `,
      '   TEL: +254 722 100 200        ',
      '================================',
      `INVOICE: ${invoice.invoiceNumber}`,
      `DATE: ${new Date(invoice.createdAt).toLocaleString()}`,
      `CASHIER: ${invoice.cashierName}`,
      `CUSTOMER: ${invoice.customer?.name || 'Walk-in Cash Customer'}`,
      invoice.customer?.kraPin ? `BUYER PIN: ${invoice.customer.kraPin}` : '',
      '--------------------------------',
      'ITEMS             QTY     AMOUNT',
      '--------------------------------',
      ...invoice.items.map((i) => {
        const nameTrunc = i.name.slice(0, 16).padEnd(16, ' ');
        const qtyStr = `${i.quantity}`.padStart(3, ' ');
        const amtStr = `${i.totalGross.toFixed(0)}`.padStart(8, ' ');
        return `${nameTrunc} ${qtyStr} ${amtStr}`;
      }),
      '--------------------------------',
      `NET TOTAL:        KES ${invoice.subtotal - invoice.totalTax}`,
      `TOTAL 16% VAT:    KES ${invoice.totalTax}`,
      `GRAND TOTAL:      KES ${invoice.grandTotal}`,
      '--------------------------------',
      `TENDER: ${invoice.payments[0]?.method} ${invoice.payments[0]?.mpesaReceiptNumber || ''}`,
      '================================',
      '   KRA CONTROL UNIT VERIFIED    ',
      `CU SERIAL: ${invoice.etimsValidation.cuSerialNumber}`,
      `HASH: ${invoice.etimsValidation.internalHash}`,
      'VERIFY: itax.kra.go.ke/KRA-Portal',
      '   ASANTE KWA BIASHARA YAKO!    ',
      '================================',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(raw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Toolbar */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="truncate">
              <h3 className="text-sm font-bold truncate">KRA Fiscal eTIMS Receipt</h3>
              <div className="text-[11px] text-slate-300 font-mono">{invoice.invoiceNumber}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Paper Width Selector */}
            <div className="flex bg-slate-800 p-0.5 rounded text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  paperWidth === '58mm' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  paperWidth === '80mm' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                80mm
              </button>
            </div>

            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/70 flex justify-center">
          <div
            id="printable-receipt"
            className={`bg-white p-4 sm:p-5 shadow-sm border border-slate-200 text-slate-900 font-mono text-xs transition-all w-full ${
              paperWidth === '58mm' ? 'max-w-[280px]' : 'max-w-[360px]'
            }`}
          >
            {/* Trader Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-0.5">
              <div className="font-bold text-sm text-slate-950 tracking-wider">
                LIPATIM RETAIL LTD
              </div>
              <div className="text-[11px] text-slate-700 font-semibold">{invoice.branchName}</div>
              <div className="text-[10px] text-slate-500">Biashara Street, Nairobi, Kenya</div>
              <div className="text-[10px] text-slate-700 font-bold">
                KRA PIN: P051239841K · VAT NO: 021984
              </div>
              <div className="text-[10px] text-slate-500">TEL: +254 722 100 200 / +254 733 400 500</div>
            </div>

            {/* Invoice Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">INVOICE NO:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DATE &amp; TIME:</span>
                <span>{new Date(invoice.createdAt).toLocaleString('en-KE')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CASHIER:</span>
                <span>{invoice.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CUSTOMER:</span>
                <span className="truncate max-w-[170px]">{invoice.customer?.name || 'Walk-in Cash Customer'}</span>
              </div>
              {invoice.customer?.kraPin && (
                <div className="flex justify-between">
                  <span className="text-slate-500">BUYER PIN:</span>
                  <span className="font-bold">{invoice.customer.kraPin}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between font-bold pb-1 text-[10px] text-slate-500 border-b border-slate-200">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span className="text-right">TOTAL</span>
              </div>

              <div className="pt-1.5 space-y-1.5">
                {invoice.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>
                        {item.quantity} x {formatKES(item.unitPrice, false)} ({item.taxRateCode})
                      </span>
                      <span className="font-bold text-slate-900 font-mono-numbers">
                        {formatKES(item.totalGross)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grand Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>SUBTOTAL (NET):</span>
                <span className="font-mono-numbers">{formatKES(invoice.subtotal - invoice.totalTax)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TOTAL 16% VAT:</span>
                <span className="font-mono-numbers">{formatKES(invoice.totalTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 text-slate-950">
                <span>TOTAL PAYABLE:</span>
                <span className="font-mono-numbers text-emerald-800">{formatKES(invoice.grandTotal)}</span>
              </div>
            </div>

            {/* KRA Tax Analysis Breakdown */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-1">
              <div className="font-bold text-slate-700 text-center uppercase tracking-wider text-[9px]">
                KRA VAT RATE BREAKDOWN
              </div>
              <div className="flex justify-between text-slate-500 font-semibold border-b border-slate-200 pb-0.5">
                <span>BAND</span>
                <span>RATE</span>
                <span className="text-right">NET</span>
                <span className="text-right">VAT</span>
              </div>
              <div className="flex justify-between">
                <span>A - STANDARD</span>
                <span>16%</span>
                <span className="font-mono-numbers">{formatKES(invoice.taxableAmounts.A, false)}</span>
                <span className="font-mono-numbers">{formatKES(invoice.taxAmounts.A, false)}</span>
              </div>
              {invoice.taxableAmounts.B > 0 && (
                <div className="flex justify-between">
                  <span>B - ZERO RATED</span>
                  <span>0%</span>
                  <span className="font-mono-numbers">{formatKES(invoice.taxableAmounts.B, false)}</span>
                  <span className="font-mono-numbers">0.00</span>
                </div>
              )}
              {invoice.taxableAmounts.C > 0 && (
                <div className="flex justify-between">
                  <span>C - EXEMPT</span>
                  <span>0%</span>
                  <span className="font-mono-numbers">{formatKES(invoice.taxableAmounts.C, false)}</span>
                  <span className="font-mono-numbers">0.00</span>
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>PAID VIA:</span>
                <span className="font-bold">{invoice.payments[0]?.method}</span>
              </div>
              {invoice.payments[0]?.mpesaReceiptNumber && (
                <div className="flex justify-between">
                  <span>M-PESA REF:</span>
                  <span className="font-bold font-mono text-emerald-800">
                    {invoice.payments[0].mpesaReceiptNumber}
                  </span>
                </div>
              )}
              {invoice.changeGiven > 0 && (
                <div className="flex justify-between font-bold">
                  <span>CHANGE RETURNED:</span>
                  <span className="font-mono-numbers">{formatKES(invoice.changeGiven)}</span>
                </div>
              )}
            </div>

            {/* KRA eTIMS Verification & QR Code */}
            <div className="pt-3 text-center space-y-2 text-[10px]">
              <div className="font-bold text-slate-900 tracking-wider">
                KRA eTIMS CONTROL UNIT
              </div>
              <div className="font-mono text-[9px] text-slate-700">
                CU SERIAL: {invoice.etimsValidation.cuSerialNumber}
              </div>
              <div className="font-mono text-[8px] text-slate-400 break-all leading-tight">
                SIG: {invoice.etimsValidation.scuSignature}
              </div>

              {/* Scannable QR Code */}
              {qrCodeDataUrl && (
                <div className="py-1 flex justify-center">
                  <img
                    src={qrCodeDataUrl}
                    alt="KRA eTIMS QR Verification Code"
                    className="w-28 h-28 border border-slate-300 p-1 rounded bg-white shadow-2xs"
                  />
                </div>
              )}

              <div className="text-[9px] text-slate-500 italic">
                Scan QR or visit itax.kra.go.ke to confirm fiscal validity.
              </div>
              <div className="font-bold text-slate-800 pt-1 border-t border-slate-200">
                ASANTE KWA BIASHARA YAKO!
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBluetoothEscPosPrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
              title="Send raw ESC/POS bytes to paired Bluetooth thermal printer + kick cash drawer"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>{printerDevice ? `ESC/POS (${printerDevice.paperWidth})` : 'ESC/POS Print'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Browser Print</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleShareEmail}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              title="Email KRA eTIMS Tax Invoice"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>

            <button
              onClick={handleCopyRawText}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            Start Next Sale
          </button>
        </div>
      </div>
    </div>
  );
};

