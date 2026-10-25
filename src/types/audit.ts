export type AuditCategory =
  | 'AUTH'
  | 'SALES'
  | 'INVENTORY'
  | 'FINANCE'
  | 'SYSTEM'
  | 'SECURITY';

export type AuditLevel = 'info' | 'warning' | 'error';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  category: AuditCategory;
  details: string;
  level: AuditLevel;
}

export const INITIAL_DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_seed_01',
    timestamp: '2026-10-17T08:00:00Z',
    userId: 'usr_demo_admin',
    userName: 'David Omondi',
    userRole: 'admin',
    action: 'Counter Shift Opened',
    category: 'SYSTEM',
    details: 'Opened morning cashier counter for Nairobi CBD Main Store with KES 5,000 float.',
    level: 'info',
  },
  {
    id: 'aud_seed_02',
    timestamp: '2026-10-17T08:15:22Z',
    userId: 'usr_demo_admin',
    userName: 'David Omondi',
    userRole: 'admin',
    action: 'KRA VSCU Handshake Verified',
    category: 'SYSTEM',
    details: 'Cryptographic OSCU/VSCU certificate handshake authenticated successfully with KRA.',
    level: 'info',
  },
  {
    id: 'aud_seed_03',
    timestamp: '2026-10-17T09:20:14Z',
    userId: 'usr_demo_cashier',
    userName: 'Mercy Wanjiku',
    userRole: 'cashier',
    action: 'eTIMS Fiscal Sale Processed',
    category: 'SALES',
    details: 'Finalized Invoice #INV-2026-0001 (Ksh 1,480.00 via M-Pesa STK). KRA QR generated.',
    level: 'info',
  },
  {
    id: 'aud_seed_04',
    timestamp: '2026-10-17T10:05:40Z',
    userId: 'usr_demo_manager',
    userName: 'Brian Kiprop',
    userRole: 'manager',
    action: 'Goods Received Note Confirmed',
    category: 'INVENTORY',
    details: 'Logged GRN-2026-0014: 80 bags Jogoo Maize Meal from Unga Farm Care Ltd.',
    level: 'info',
  },
  {
    id: 'aud_seed_05',
    timestamp: '2026-10-17T11:30:10Z',
    userId: 'usr_demo_admin',
    userName: 'David Omondi',
    userRole: 'admin',
    action: 'Credit Ledger Settlement',
    category: 'FINANCE',
    details: 'Received Ksh 5,000.00 cash settlement from Otieno Peter for outstanding debt.',
    level: 'info',
  },
  {
    id: 'aud_seed_06',
    timestamp: '2026-10-17T13:45:00Z',
    userId: 'usr_demo_admin',
    userName: 'David Omondi',
    userRole: 'admin',
    action: 'Hardware ESC/POS Printer Paired',
    category: 'SYSTEM',
    details: 'Paired Sunmi V2 Pro Bluetooth thermal printer (80mm ESC/POS protocol).',
    level: 'info',
  },
];
