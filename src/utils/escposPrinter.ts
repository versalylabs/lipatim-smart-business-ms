/**
 * Phase 7: Web Bluetooth & ESC/POS Thermal Printer Hardware Driver
 * Supports direct pairing with 58mm / 80mm Bluetooth POS printers (Xprinter, Sunmi, Rongta, Epson)
 * and generates raw ESC/POS byte streams including Cash Drawer Kick (ESC p) & Paper Cut (GS V).
 */

import { Invoice } from '../types/sales';
import { formatKES } from './kenya';

export interface ThermalPrinterDevice {
  id: string;
  name: string;
  connectionType: 'BLUETOOTH' | 'USB' | 'SIMULATED';
  paperWidth: '58mm' | '80mm';
  autoCut: boolean;
  kickCashDrawer: boolean;
  connected: boolean;
  lastPrintedAt?: string;
}

// Standard ESC/POS GATT service UUIDs used by portable Kenyan thermal printers
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard 16-bit BLE printer service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Xprinter / Rongta BLE service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART
];

let activeCharacteristic: any = null;

/**
 * Generates raw ESC/POS command bytes for a KRA eTIMS Fiscal Receipt
 */
export function buildEscPosReceiptBytes(
  invoice: Invoice,
  paperWidth: '58mm' | '80mm' = '80mm',
  kickDrawer = true,
  autoCut = true
): Uint8Array {
  const encoder = new TextEncoder();
  const cols = paperWidth === '58mm' ? 32 : 48;
  const divider = '-'.repeat(cols) + '\n';
  const doubleDivider = '='.repeat(cols) + '\n';

  const centerText = (text: string) => {
    if (text.length >= cols) return text.slice(0, cols) + '\n';
    const pad = Math.floor((cols - text.length) / 2);
    return ' '.repeat(pad) + text + '\n';
  };

  const leftRight = (left: string, right: string) => {
    const space = Math.max(1, cols - left.length - right.length);
    return left + ' '.repeat(space) + right + '\n';
  };

  let receiptText = '';
  receiptText += centerText('LIPATIM RETAIL KENYA LTD');
  receiptText += centerText(invoice.branchName.toUpperCase());
  receiptText += centerText('PIN: P051239841K | KRA eTIMS');
  receiptText += doubleDivider;
  receiptText += leftRight('INVOICE:', invoice.invoiceNumber);
  receiptText += leftRight('DATE:', new Date(invoice.createdAt).toLocaleString('en-KE'));
  receiptText += leftRight('CASHIER:', invoice.cashierName);
  receiptText += leftRight('BUYER:', (invoice.customer?.name || 'WALK-IN').slice(0, 20));
  if (invoice.customer?.kraPin) {
    receiptText += leftRight('BUYER PIN:', invoice.customer.kraPin);
  }
  receiptText += divider;

  invoice.items.forEach((item) => {
    receiptText += `${item.name.slice(0, cols)}\n`;
    receiptText += leftRight(
      `  ${item.quantity} x ${item.unitPrice.toFixed(0)} (${item.taxRateCode})`,
      formatKES(item.totalGross)
    );
  });

  receiptText += divider;
  receiptText += leftRight('NET SUBTOTAL:', formatKES(invoice.subtotal));
  receiptText += leftRight('OUTPUT VAT (16%):', formatKES(invoice.totalTax));
  receiptText += doubleDivider;
  receiptText += leftRight('GRAND TOTAL:', formatKES(invoice.grandTotal));
  receiptText += divider;
  receiptText += leftRight('TENDER:', invoice.payments.map((p) => p.method).join('+'));
  receiptText += doubleDivider;
  receiptText += centerText('KRA eTIMS CONTROL UNIT VERIFIED');
  receiptText += centerText(`CU: ${invoice.etimsValidation.cuSerialNumber}`);
  receiptText += centerText(`SIG: ${invoice.etimsValidation.internalHash}`);
  receiptText += centerText('ASANTE KWA BIASHARA YAKO!');
  receiptText += '\n\n\n';

  const textBytes = encoder.encode(receiptText);

  // ESC/POS header & footer control sequences
  const initCmd = [0x1b, 0x40]; // ESC @ (Initialize printer)
  const drawerKickCmd = kickDrawer ? [0x1b, 0x70, 0x00, 0x19, 0xfa] : []; // ESC p 0 25 250 (RJ11 Drawer Pulse)
  const cutCmd = autoCut ? [0x1d, 0x56, 0x41, 0x10] : []; // GS V A 16 (Partial cut with feed)

  const combined = new Uint8Array(
    initCmd.length + drawerKickCmd.length + textBytes.length + cutCmd.length
  );
  let offset = 0;
  combined.set(initCmd, offset);
  offset += initCmd.length;
  combined.set(drawerKickCmd, offset);
  offset += drawerKickCmd.length;
  combined.set(textBytes, offset);
  offset += textBytes.length;
  combined.set(cutCmd, offset);

  return combined;
}

/**
 * Initiates Web Bluetooth pairing with a nearby ESC/POS Thermal Printer
 */
export async function pairWebBluetoothPrinter(
  paperWidth: '58mm' | '80mm' = '80mm'
): Promise<ThermalPrinterDevice> {
  const nav = navigator as any;
  if (nav.bluetooth && typeof nav.bluetooth.requestDevice === 'function') {
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS,
    });

    if (device.gatt) {
      try {
        const server = await device.gatt.connect();
        for (const uuid of PRINTER_SERVICE_UUIDS) {
          try {
            const service = await server.getPrimaryService(uuid);
            const characteristics = await service.getCharacteristics();
            const writable = characteristics.find(
              (c: any) => c.properties.write || c.properties.writeWithoutResponse
            );
            if (writable) {
              activeCharacteristic = writable;
              break;
            }
          } catch {
            // Try next UUID
          }
        }
      } catch {
        // Connected device announcement only
      }
    }

    return {
      id: device.id || `bt_${Date.now()}`,
      name: device.name || 'Bluetooth ESC/POS Printer',
      connectionType: 'BLUETOOTH',
      paperWidth,
      autoCut: true,
      kickCashDrawer: true,
      connected: true,
      lastPrintedAt: new Date().toLocaleTimeString(),
    };
  }

  throw new Error('WEB_BLUETOOTH_UNAVAILABLE');
}

/**
 * Sends raw ESC/POS bytes to the paired Bluetooth printer (or simulates transmission)
 */
export async function transmitEscPosBytes(bytes: Uint8Array): Promise<boolean> {
  if (activeCharacteristic) {
    const chunkSize = 100;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      await activeCharacteristic.writeValue(chunk);
    }
    return true;
  }
  // Simulated transmission latency for counter demo
  await new Promise((r) => setTimeout(r, 350));
  return true;
}
