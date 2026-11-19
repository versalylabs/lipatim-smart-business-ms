import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Branch,
  Product,
  ProductCategory,
  StockMovement,
  StockTransferRecord,
  GoodsReceivedNote,
  MovementType,
  StockBatch,
} from '../types/inventory';
import {
  Customer,
  Invoice,
  DebtRecord,
  PaymentMethod,
  CartItem,
  MpesaTransaction,
  DarajaConfig,
  MpesaChannel,
} from '../types/sales';
import { Expense, Supplier, SupplierPaymentRecord } from '../types/expense';
import {
  User,
  UserRole,
  ROLE_PERMISSIONS,
  UserPermissions,
} from '../types/user';
import {
  AuthSession,
  Tenant,
  AuthAccount,
  RegisterTenantData,
  DEMO_TENANT_ID,
  DEMO_TENANT,
  DEMO_ACCOUNT,
} from '../types/auth';
import {
  AuditLogEntry,
  AuditCategory,
  AuditLevel,
  INITIAL_DEMO_AUDIT_LOGS,
} from '../types/audit';
import {
  INITIAL_BRANCHES,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_EXPENSES,
  INITIAL_USERS,
  INITIAL_DEBTS,
  INITIAL_INVOICES,
  INITIAL_MPESA_TRANSACTIONS,
  DEFAULT_DARAJA_CONFIG,
} from '../data/seedData';
import { generateMpesaReceiptCode, formatKES } from '../utils/kenya';
import {
  saveInvoiceToIndexedDB,
  syncAllInvoicesToIndexedDB,
  syncCatalogToIndexedDB,
  clearOfflineQueueInIndexedDB,
} from '../utils/offlineDb';
import {
  ThermalPrinterDevice,
  pairWebBluetoothPrinter,
  buildEscPosReceiptBytes,
  transmitEscPosBytes,
} from '../utils/escposPrinter';

export interface HeldOrder {
  id: string;
  cart: CartItem[];
  customerId?: string;
  customerName?: string;
  note?: string;
  timestamp: string;
  branchId: string;
  subtotal: number;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'etims'
  | 'mpesa'
  | 'madeni'
  | 'expenses'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'platform';

interface AppContextType {
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Authentication & Multi-Tenancy
  session: AuthSession | null;
  currentTenant: Tenant | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterTenantData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Branch & Multi-Location
  branches: Branch[];
  activeBranchId: string;
  activeBranch: Branch;
  setActiveBranchId: (id: string) => void;
  addBranch: (data: Omit<Branch, 'id'>) => Branch;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => { success: boolean; error?: string };

  // User & RBAC
  users: User[];
  currentUser: User;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  permissions: UserPermissions;
  addStaffUser: (u: Partial<User>) => void;
  toggleStaffActive: (userId: string) => void;

  // Business Profile
  businessProfile: { name: string; kraPin: string; phone: string };
  updateBusinessProfile: (updates: Partial<{ name: string; kraPin: string; phone: string }>) => void;

  // Domain Entities
  products: Product[];
  categories: ProductCategory[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  debts: DebtRecord[];
  invoices: Invoice[];
  stockMovements: StockMovement[];
  stockTransfers: StockTransferRecord[];
  grns: GoodsReceivedNote[];
  supplierPayments: SupplierPaymentRecord[];
  heldOrders: HeldOrder[];
  mpesaTransactions: MpesaTransaction[];
  darajaConfig: DarajaConfig;

  // Mutations
  addCategory: (category: Omit<ProductCategory, 'id' | 'slug'> & { id?: string; slug?: string }) => ProductCategory;
  updateCategory: (id: string, updates: Partial<ProductCategory>) => void;
  deleteCategory: (id: string, reassignToCategoryId?: string) => { success: boolean; error?: string };
  addProduct: (product: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: Partial<Customer>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  toggleCustomerCreditBlock: (customerId: string) => void;
  setCustomerCreditLimit: (customerId: string, newLimit: number) => void;
  addExpense: (expense: Partial<Expense>) => Expense;
  addSupplier: (supplier: Partial<Supplier>) => Supplier;
  paySupplier: (supplierId: string, amount: number, method: 'BANK' | 'MPESA' | 'CASH', referenceNo: string, notes?: string) => void;
  addInvoice: (invoice: Invoice) => void;
  voidInvoice: (invoiceId: string, reason: string) => void;
  settleDebt: (debtId: string, amount: number, paymentMethod: PaymentMethod) => void;
  recordStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => void;

  // Phase 4 Smart Inventory & Transfers
  createGoodsReceivedNote: (grn: Omit<GoodsReceivedNote, 'id' | 'grnNumber' | 'timestamp'>) => GoodsReceivedNote;
  performStockTransfer: (transfer: Omit<StockTransferRecord, 'id' | 'transferNumber' | 'timestamp'>) => boolean;
  recordStockAdjustment: (productId: string, branchId: string, quantity: number, type: MovementType, reason: string, batchId?: string) => void;

  // M-Pesa & Daraja
  updateDarajaConfig: (config: Partial<DarajaConfig>) => void;
  addMpesaTransaction: (tx: Partial<MpesaTransaction>) => MpesaTransaction;
  reconcileMpesaTransaction: (txId: string, invoiceNumber: string) => void;
  simulateIncomingMpesaPayment: (amount: number, customerName: string, phone: string, channel: MpesaChannel) => MpesaTransaction;
  checkDuplicateMpesaCode: (code: string) => boolean;

  // POS Held Orders
  holdCurrentCart: (cart: CartItem[], customerId?: string, customerName?: string, note?: string) => void;
  recallHeldOrder: (id: string) => HeldOrder | undefined;
  deleteHeldOrder: (id: string) => void;

  // Offline & Connectivity (Phase 7)
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  pendingSyncCount: number;
  syncOfflineQueue: () => void;
  lastSyncedAt: string;

  // Audit Trail & Activity Log
  auditLogs: AuditLogEntry[];
  logAudit: (
    action: string,
    category: AuditCategory,
    details: string,
    level?: AuditLevel
  ) => void;
  clearAuditLogs: () => void;

  // Hardware & ESC/POS Thermal Printer (Phase 7)
  printerDevice: ThermalPrinterDevice | null;
  printerPaperSize: '58mm' | '80mm';
  setPrinterPaperSize: (size: '58mm' | '80mm') => void;
  connectBluetoothPrinter: () => Promise<void>;
  connectSimulatedPrinter: () => void;
  disconnectPrinter: () => void;
  printThermalReceipt: (invoice: Invoice) => Promise<void>;
  testThermalPrinter: () => Promise<void>;

  // Notification System
  notifications: AppNotification[];
  notify: (type: AppNotification['type'], title: string, message: string) => void;
  dismissNotification: (id: string) => void;

  // Utilities
  resetToDemoData: () => void;
}

const INITIAL_STOCK_TRANSFERS: StockTransferRecord[] = [
  {
    id: 'trn_seed_01',
    transferNumber: 'TRN-2026-0001',
    sourceBranchId: 'br_ind_area',
    sourceBranchName: 'Industrial Area Depot',
    destinationBranchId: 'br_cbd',
    destinationBranchName: 'Nairobi CBD Main Store',
    productId: 'prod_unga_jogoo',
    productName: 'Jogoo Maize Meal 2kg',
    quantity: 30,
    status: 'COMPLETED',
    dispatchedBy: 'Brian Kiprop',
    receivedBy: 'Mercy Wanjiku',
    notes: 'Routine morning replenishment',
    timestamp: '2026-10-02T08:30:00Z',
  },
];

const INITIAL_GRNS: GoodsReceivedNote[] = [
  {
    id: 'grn_seed_01',
    grnNumber: 'GRN-2026-0014',
    supplierId: 'sup_unga_group',
    supplierName: 'Unga Farm Care / Unga Group Ltd',
    branchId: 'br_cbd',
    branchName: 'Nairobi CBD Main Store',
    productId: 'prod_unga_jogoo',
    productName: 'Jogoo Maize Meal 2kg',
    batchNumber: 'BCH-2026-JOG-01',
    expiryDate: '2026-08-10',
    quantity: 80,
    unitCost: 175,
    totalCost: 14000,
    retailPrice: 215,
    supplierInvoiceRef: 'INV-UNG-88192',
    receivedBy: 'David Omondi',
    timestamp: '2026-10-01T09:00:00Z',
  },
  {
    id: 'grn_seed_02',
    grnNumber: 'GRN-2026-0015',
    supplierId: 'sup_bamburi',
    supplierName: 'Bamburi Special Products Ltd',
    branchId: 'br_ind_area',
    branchName: 'Industrial Area Depot',
    productId: 'prod_simba_cement',
    productName: 'Simba Power 32.5R Cement 50kg',
    batchNumber: 'BMB-2026-B32',
    quantity: 50,
    unitCost: 690,
    totalCost: 34500,
    retailPrice: 780,
    supplierInvoiceRef: 'INV-BMB-44019',
    receivedBy: 'Brian Kiprop',
    timestamp: '2026-10-02T14:15:00Z',
  },
];

const INITIAL_SUPPLIER_PAYMENTS: SupplierPaymentRecord[] = [
  {
    id: 'sp_01',
    supplierId: 'sup_unga_group',
    supplierName: 'Unga Farm Care / Unga Group Ltd',
    amount: 50000,
    paymentMethod: 'BANK',
    referenceNo: 'EFT-NCBA-99120',
    paidBy: 'David Omondi',
    notes: 'Partial settlement against August grain flour delivery',
    timestamp: '2026-09-25T11:00:00Z',
  },
];

const STORAGE_KEYS = {
  THEME: 'lipatim_theme_v1',
  PRINTER: 'lipatim_printer_v1',
};

const getTenantKey = (tenantId: string, slice: string) => `lipatim_${tenantId}_${slice}`;

const getInitialBranches = (tenant: Tenant | null): Branch[] => {
  if (!tenant || tenant.id === DEMO_TENANT_ID) {
    return INITIAL_BRANCHES;
  }
  return [
    {
      id: `br_${tenant.id}_1`,
      name: `${tenant.name} Main Branch`,
      code: 'MAIN',
      address: 'Main Commercial Center',
      county: 'Nairobi',
      phone: tenant.phone || '+254 700 000 000',
      isMainWarehouse: true,
      active: true,
    },
  ];
};

const getInitialUsers = (tenant: Tenant | null, account?: { id: string; name: string; email: string } | null): User[] => {
  if (!tenant || tenant.id === DEMO_TENANT_ID) {
    return INITIAL_USERS;
  }
  return [
    {
      id: account?.id || `usr_${tenant.id}_owner`,
      name: account?.name || 'Business Owner',
      username: (account?.email || tenant.ownerEmail).split('@')[0],
      role: 'admin',
      phone: tenant.phone || '+254 700 000 000',
      email: account?.email || tenant.ownerEmail,
      assignedBranchId: `br_${tenant.id}_1`,
      active: true,
    },
  ];
};

const getInitialProfile = (tenant: Tenant | null) => {
  if (!tenant || tenant.id === DEMO_TENANT_ID) {
    return {
      name: 'LipaTim Supermarket & Pharmacy Ltd',
      kraPin: 'P051239841K',
      phone: '+254 722 100 200',
    };
  }
  return {
    name: tenant.name,
    kraPin: tenant.kraPin || '',
    phone: tenant.phone || '',
  };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

const VALID_TABS: ActiveTab[] = [
  'dashboard',
  'pos',
  'inventory',
  'etims',
  'mpesa',
  'madeni',
  'expenses',
  'reports',
  'audit',
  'settings',
  'platform',
];

function getInitialActiveTab(): ActiveTab {
  try {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase() as ActiveTab;
      if (VALID_TABS.includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('lipatim_active_tab') as ActiveTab;
      if (VALID_TABS.includes(saved)) {
        return saved;
      }
    }
  } catch {
    // fallback
  }
  return 'dashboard';
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialActiveTab);

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('lipatim_active_tab', tab);
      if (window.location.hash.replace(/^#\/?/, '').trim().toLowerCase() !== tab) {
        window.history.replaceState(null, '', `#${tab}`);
      }
    } catch {
      // ignore
    }
  };

  // Sync activeTab with URL hash and listen for back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase() as ActiveTab;
        if (VALID_TABS.includes(hash)) {
          setActiveTabState(hash);
          localStorage.setItem('lipatim_active_tab', hash);
        }
      } catch {
        // ignore
      }
    };

    try {
      if (
        !window.location.hash ||
        !VALID_TABS.includes(window.location.hash.replace(/^#\/?/, '').trim().toLowerCase() as ActiveTab)
      ) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
      localStorage.setItem('lipatim_active_tab', activeTab);
    } catch {
      // ignore
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auth Session & Tenant
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadFromStorage<AuthSession | null>('lipatim_active_session', null)
  );

  const activeTenant = session?.tenant || null;
  const activeTenantId = activeTenant?.id || DEMO_TENANT_ID;
  const isDemo = !activeTenant || activeTenantId === DEMO_TENANT_ID;

  const [branches, setBranches] = useState<Branch[]>(() => {
    const loaded = loadFromStorage<Branch[]>(
      getTenantKey(activeTenantId, 'branches'),
      getInitialBranches(activeTenant)
    );
    return (Array.isArray(loaded) ? loaded : []).map((b, idx) => ({
      ...b,
      code: b.code || `BR-${idx + 1}`,
      county: b.county || 'Nairobi',
      address: b.address || 'Commercial Center',
      phone: b.phone || '+254 700 000 000',
      active: b.active ?? true,
      isMainWarehouse: b.isMainWarehouse ?? (idx === 0),
    }));
  });
  const [activeBranchId, setActiveBranchIdState] = useState<string>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'active_branch'), branches[0]?.id || 'br_cbd')
  );

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() =>
    loadFromStorage<UserRole>(getTenantKey(activeTenantId, 'role'), 'admin')
  );
  const [users, setUsers] = useState<User[]>(() =>
    loadFromStorage<User[]>(getTenantKey(activeTenantId, 'users'), getInitialUsers(activeTenant, session?.user))
  );

  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'products'), isDemo ? INITIAL_PRODUCTS : [])
  );
  const [categories, setCategories] = useState<ProductCategory[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'categories'), INITIAL_CATEGORIES)
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'customers'), isDemo ? INITIAL_CUSTOMERS : [])
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'suppliers'), isDemo ? INITIAL_SUPPLIERS : [])
  );
  const [supplierPayments, setSupplierPayments] = useState<SupplierPaymentRecord[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'supplier_pmts'), isDemo ? INITIAL_SUPPLIER_PAYMENTS : [])
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'expenses'), isDemo ? INITIAL_EXPENSES : [])
  );
  const [debts, setDebts] = useState<DebtRecord[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'debts'), isDemo ? INITIAL_DEBTS : [])
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'invoices'), isDemo ? INITIAL_INVOICES : [])
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'movements'), [])
  );
  const [stockTransfers, setStockTransfers] = useState<StockTransferRecord[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'transfers'), isDemo ? INITIAL_STOCK_TRANSFERS : [])
  );
  const [grns, setGrns] = useState<GoodsReceivedNote[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'grns'), isDemo ? INITIAL_GRNS : [])
  );
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'held_orders'), [])
  );
  const [mpesaTransactions, setMpesaTransactions] = useState<MpesaTransaction[]>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'mpesa_txs'), isDemo ? INITIAL_MPESA_TRANSACTIONS : [])
  );
  const [darajaConfig, setDarajaConfig] = useState<DarajaConfig>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'daraja_config'), DEFAULT_DARAJA_CONFIG)
  );

  const [businessProfile, setBusinessProfile] = useState<{
    name: string;
    kraPin: string;
    phone: string;
  }>(() =>
    loadFromStorage(getTenantKey(activeTenantId, 'profile'), getInitialProfile(activeTenant))
  );

  // Network & Sync State
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toLocaleTimeString());

  // Permanent Light Mode Enforcement (Purges dark mode across all pages & storage)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    try {
      localStorage.removeItem('lipatim_theme_v1');
    } catch {
      // quota or private mode
    }
  }, []);

  // System Audit Trail & Activity Log
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    loadFromStorage<AuditLogEntry[]>(
      getTenantKey(activeTenantId, 'audit_logs'),
      isDemo ? INITIAL_DEMO_AUDIT_LOGS : []
    )
  );

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'audit_logs'), auditLogs);
  }, [auditLogs, activeTenantId]);

  const logAudit = (
    action: string,
    category: AuditCategory,
    details: string,
    level: AuditLevel = 'info'
  ) => {
    const entry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'usr_system',
      userName: currentUser?.name || 'Active Operator',
      userRole: currentRole || 'admin',
      action,
      category,
      details,
      level,
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 499)]);
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    saveToStorage(getTenantKey(activeTenantId, 'audit_logs'), []);
    notify('info', 'Audit Log Cleared', 'System activity log was cleared by administrator.');
  };

  // Phase 7: Hardware ESC/POS Thermal Printer State
  const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm'>('80mm');
  const [printerDevice, setPrinterDevice] = useState<ThermalPrinterDevice | null>(() =>
    loadFromStorage<ThermalPrinterDevice | null>(STORAGE_KEYS.PRINTER, null)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PRINTER, printerDevice);
  }, [printerDevice]);

  const connectBluetoothPrinter = async () => {
    try {
      const dev = await pairWebBluetoothPrinter(printerPaperSize);
      setPrinterDevice(dev);
      notify(
        'success',
        'Bluetooth Printer Paired',
        `Connected to ${dev.name} (${dev.paperWidth} ESC/POS Ready).`
      );
    } catch {
      // Fallback to simulated pairing if user cancels or browser lacks Web Bluetooth
      const fallback: ThermalPrinterDevice = {
        id: `bt_sim_${Date.now().toString().slice(-4)}`,
        name: `Xprinter XP-${printerPaperSize === '58mm' ? 'P300' : 'Q80I'} Bluetooth`,
        connectionType: 'BLUETOOTH',
        paperWidth: printerPaperSize,
        autoCut: true,
        kickCashDrawer: true,
        connected: true,
        lastPrintedAt: new Date().toLocaleTimeString(),
      };
      setPrinterDevice(fallback);
      notify(
        'success',
        'ESC/POS Thermal Printer Paired',
        `Paired with ${fallback.name} (${printerPaperSize} Direct Thermal).`
      );
    }
  };

  const connectSimulatedPrinter = () => {
    const sim: ThermalPrinterDevice = {
      id: `bt_sim_${Date.now().toString().slice(-4)}`,
      name: `Sunmi V2 Pro / Xprinter (${printerPaperSize})`,
      connectionType: 'SIMULATED',
      paperWidth: printerPaperSize,
      autoCut: true,
      kickCashDrawer: true,
      connected: true,
      lastPrintedAt: new Date().toLocaleTimeString(),
    };
    setPrinterDevice(sim);
    notify('success', 'POS Printer Connected', `Active hardware profile: ${sim.name}`);
  };

  const disconnectPrinter = () => {
    setPrinterDevice(null);
    notify('info', 'Printer Disconnected', 'Bluetooth ESC/POS thermal printer unpaired.');
  };

  const printThermalReceipt = async (invoice: Invoice) => {
    const bytes = buildEscPosReceiptBytes(
      invoice,
      printerDevice?.paperWidth || printerPaperSize,
      printerDevice?.kickCashDrawer ?? true,
      printerDevice?.autoCut ?? true
    );
    await transmitEscPosBytes(bytes);
    if (printerDevice) {
      setPrinterDevice({ ...printerDevice, lastPrintedAt: new Date().toLocaleTimeString() });
    }
    notify(
      'success',
      'ESC/POS Receipt Printed',
      `Transmitted ${bytes.length} bytes to ${printerDevice?.name || 'Thermal Printer'} + Cash Drawer Kick.`
    );
  };

  const testThermalPrinter = async () => {
    if (invoices.length > 0) {
      await printThermalReceipt(invoices[0]);
    } else {
      notify('success', 'Self-Test Page Printed', 'ESC/POS 80mm alignment & KRA QR test pattern printed.');
    }
  };

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Persist state updates to localStorage & IndexedDB partitioned by active tenant
  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'products'), products);
    syncCatalogToIndexedDB(products);
  }, [products, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'categories'), categories);
  }, [categories, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'customers'), customers);
  }, [customers, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'suppliers'), suppliers);
  }, [suppliers, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'supplier_pmts'), supplierPayments);
  }, [supplierPayments, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'expenses'), expenses);
  }, [expenses, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'debts'), debts);
  }, [debts, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'invoices'), invoices);
    syncAllInvoicesToIndexedDB(invoices);
  }, [invoices, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'movements'), stockMovements);
  }, [stockMovements, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'transfers'), stockTransfers);
  }, [stockTransfers, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'grns'), grns);
  }, [grns, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'held_orders'), heldOrders);
  }, [heldOrders, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'mpesa_txs'), mpesaTransactions);
  }, [mpesaTransactions, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'daraja_config'), darajaConfig);
  }, [darajaConfig, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'profile'), businessProfile);
  }, [businessProfile, activeTenantId]);

  useEffect(() => {
    saveToStorage(getTenantKey(activeTenantId, 'branches'), branches);
  }, [branches, activeTenantId]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isOnline = browserOnline && !isSimulatedOffline;

  const pendingSyncCount = invoices.filter(
    (i) => i.offlineQueued || i.etimsValidation.status === 'OFFLINE_QUEUED'
  ).length;

  const syncOfflineQueue = () => {
    if (!isOnline) {
      notify('error', 'Cannot Sync', 'Network is offline. Reconnect before flushing queued invoices.');
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.offlineQueued || inv.etimsValidation.status === 'OFFLINE_QUEUED') {
          return {
            ...inv,
            offlineQueued: false,
            etimsValidation: {
              ...inv.etimsValidation,
              status: 'TRANSMITTED',
              transmittedAt: new Date().toISOString(),
            },
          };
        }
        return inv;
      })
    );

    clearOfflineQueueInIndexedDB();
    setLastSyncedAt(new Date().toLocaleTimeString());
    notify('success', 'eTIMS Synchronized', 'All pending offline transactions validated with KRA VSCU.');
  };

  // Automatic background sync when connection is restored
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      const timer = setTimeout(() => {
        syncOfflineQueue();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      notify(
        next ? 'warning' : 'success',
        next ? 'Offline Mode Active (IndexedDB)' : 'Online Mode Restored',
        next
          ? 'Network disconnected. POS sales will queue in IndexedDB until reconnected.'
          : 'Reconnected to KRA VSCU & Daraja M-Pesa servers. Auto-syncing queue...'
      );
      return next;
    });
  };

  const notify = (type: AppNotification['type'], title: string, message: string) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setNotifications((prev) => [{ id, type, title, message, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 1)]);
    setTimeout(() => {
      dismissNotification(id);
    }, 3800);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    saveToStorage(getTenantKey(activeTenantId, 'active_branch'), id);
    const branch = branches.find((b) => b.id === id);
    logAudit('Counter Branch Switched', 'SYSTEM', `Active terminal counter set to: ${branch?.name || id}`, 'info');
  };

  const addBranch = (data: Omit<Branch, 'id'>): Branch => {
    const newId = `br_${Date.now()}`;
    const newBranch: Branch = {
      ...data,
      id: newId,
      name: (data.name || '').trim(),
      code: (data.code || `BR-${Date.now().toString().slice(-4)}`).trim().toUpperCase(),
      address: (data.address || 'Commercial Center').trim(),
      county: (data.county || 'Nairobi').trim(),
      phone: (data.phone || '+254 700 000000').trim(),
      active: data.active ?? true,
      isMainWarehouse: data.isMainWarehouse ?? false,
    };

    setBranches((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      let updated = safePrev;
      if (newBranch.isMainWarehouse) {
        updated = safePrev.map((b) => ({ ...b, isMainWarehouse: false }));
      }
      const nextBranches = [...updated, newBranch];
      saveToStorage(getTenantKey(activeTenantId, 'branches'), nextBranches);
      return nextBranches;
    });

    // Initialize branchStock on all existing products for the new branch
    setProducts((prev) => {
      const safeProds = Array.isArray(prev) ? prev : [];
      const updatedProds = safeProds.map((p) => ({
        ...p,
        branchStock: {
          ...(p.branchStock || {}),
          [newId]: 0,
        },
      }));
      saveToStorage(getTenantKey(activeTenantId, 'products'), updatedProds);
      return updatedProds;
    });

    try {
      logAudit('Outlet Branch Added', 'INVENTORY', `Registered new branch: ${newBranch.name} (${newBranch.code}) in ${newBranch.county}`, 'info');
    } catch (e) {
      console.warn('Audit logging failed:', e);
    }

    try {
      notify('success', 'Branch Added', `${newBranch.name} (${newBranch.code}) has been registered.`);
    } catch (e) {
      console.warn('Notification failed:', e);
    }

    return newBranch;
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    setBranches((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const nextBranches = safePrev.map((b) => {
        if (b.id !== id) {
          if (updates.isMainWarehouse) {
            return { ...b, isMainWarehouse: false };
          }
          return b;
        }
        return {
          ...b,
          ...updates,
          name: updates.name !== undefined ? updates.name.trim() : b.name,
          code: updates.code !== undefined ? updates.code.trim().toUpperCase() : b.code,
        };
      });
      saveToStorage(getTenantKey(activeTenantId, 'branches'), nextBranches);
      return nextBranches;
    });

    try {
      logAudit('Outlet Branch Updated', 'INVENTORY', `Updated outlet profile details for branch ID: ${id}`, 'info');
      notify('success', 'Branch Updated', 'Branch details updated successfully.');
    } catch (e) {
      console.warn(e);
    }
  };

  const deleteBranch = (id: string): { success: boolean; error?: string } => {
    if (branches.length <= 1) {
      try {
        notify('error', 'Cannot Delete Branch', 'At least one operating branch outlet must remain registered.');
      } catch (e) {}
      return { success: false, error: 'Cannot delete the only remaining branch outlet.' };
    }

    const branchToDelete = branches.find((b) => b.id === id);
    const remaining = branches.filter((b) => b.id !== id);

    setBranches(remaining);
    saveToStorage(getTenantKey(activeTenantId, 'branches'), remaining);

    // If active branch was deleted, switch to the first remaining branch
    if (activeBranchId === id) {
      const nextActiveId = remaining[0]?.id || '';
      setActiveBranchIdState(nextActiveId);
      saveToStorage(getTenantKey(activeTenantId, 'active_branch'), nextActiveId);
    }

    try {
      logAudit('Outlet Branch Removed', 'INVENTORY', `Decommissioned outlet branch: ${branchToDelete?.name || id}`, 'warning');
      notify('success', 'Branch Removed', `${branchToDelete?.name || 'Branch'} was removed.`);
    } catch (e) {}

    return { success: true };
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    saveToStorage(getTenantKey(activeTenantId, 'role'), role);
    logAudit('Role Persona Switched', 'SECURITY', `Current user level switched to ${role.toUpperCase()}`, 'info');
  };

  const currentUser = users.find((u) => u.role === currentRole) || users[0] || INITIAL_USERS[0];
  const permissions = ROLE_PERMISSIONS[currentRole];

  // Tenant state loader
  const loadTenantState = (tenant: Tenant, account?: { id: string; name: string; email: string }) => {
    const tId = tenant.id;
    const isDemoTenant = tId === DEMO_TENANT_ID;

    const tBranches = loadFromStorage<Branch[]>(
      getTenantKey(tId, 'branches'),
      getInitialBranches(tenant)
    );
    setBranches(tBranches);
    setActiveBranchIdState(tBranches[0]?.id || 'br_cbd');

    const tUsers = loadFromStorage<User[]>(
      getTenantKey(tId, 'users'),
      getInitialUsers(tenant, account)
    );
    setUsers(tUsers);
    setCurrentRoleState('admin');

    const tProfile = loadFromStorage(
      getTenantKey(tId, 'profile'),
      getInitialProfile(tenant)
    );
    setBusinessProfile(tProfile);

    setProducts(loadFromStorage(getTenantKey(tId, 'products'), isDemoTenant ? INITIAL_PRODUCTS : []));
    setCategories(loadFromStorage(getTenantKey(tId, 'categories'), INITIAL_CATEGORIES));
    setCustomers(loadFromStorage(getTenantKey(tId, 'customers'), isDemoTenant ? INITIAL_CUSTOMERS : []));
    setSuppliers(loadFromStorage(getTenantKey(tId, 'suppliers'), isDemoTenant ? INITIAL_SUPPLIERS : []));
    setSupplierPayments(loadFromStorage(getTenantKey(tId, 'supplier_pmts'), isDemoTenant ? INITIAL_SUPPLIER_PAYMENTS : []));
    setExpenses(loadFromStorage(getTenantKey(tId, 'expenses'), isDemoTenant ? INITIAL_EXPENSES : []));
    setDebts(loadFromStorage(getTenantKey(tId, 'debts'), isDemoTenant ? INITIAL_DEBTS : []));
    setInvoices(loadFromStorage(getTenantKey(tId, 'invoices'), isDemoTenant ? INITIAL_INVOICES : []));
    setStockMovements(loadFromStorage(getTenantKey(tId, 'movements'), []));
    setStockTransfers(loadFromStorage(getTenantKey(tId, 'transfers'), isDemoTenant ? INITIAL_STOCK_TRANSFERS : []));
    setGrns(loadFromStorage(getTenantKey(tId, 'grns'), isDemoTenant ? INITIAL_GRNS : []));
    setHeldOrders(loadFromStorage(getTenantKey(tId, 'held_orders'), []));
    setMpesaTransactions(loadFromStorage(getTenantKey(tId, 'mpesa_txs'), isDemoTenant ? INITIAL_MPESA_TRANSACTIONS : []));
    setDarajaConfig(loadFromStorage(getTenantKey(tId, 'daraja_config'), DEFAULT_DARAJA_CONFIG));
    setAuditLogs(loadFromStorage(getTenantKey(tId, 'audit_logs'), isDemoTenant ? INITIAL_DEMO_AUDIT_LOGS : []));
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normEmail = email.trim().toLowerCase();

    // Check demo credentials
    if (
      (normEmail === DEMO_ACCOUNT.email.toLowerCase() || normEmail === 'versalylabs@gmail.com') &&
      password === DEMO_ACCOUNT.password
    ) {
      const demoSession: AuthSession = {
        user: {
          id: DEMO_ACCOUNT.id,
          email: DEMO_ACCOUNT.email,
          name: DEMO_ACCOUNT.name,
          role: DEMO_ACCOUNT.role,
          tenantId: DEMO_TENANT_ID,
        },
        tenant: DEMO_TENANT,
      };
      setSession(demoSession);
      saveToStorage('lipatim_active_session', demoSession);
      loadTenantState(DEMO_TENANT, DEMO_ACCOUNT);
      notify('success', 'Welcome Back', `Logged in as ${DEMO_ACCOUNT.name} (Retail Demo System)`);
      return { success: true };
    }

    // Check registered tenant accounts
    const accounts = loadFromStorage<AuthAccount[]>('lipatim_auth_accounts_registry', []);
    const match = accounts.find((a) => a.email.toLowerCase() === normEmail && a.password === password);
    if (match) {
      const tenants = loadFromStorage<Tenant[]>('lipatim_tenants_registry', []);
      const tenant = tenants.find((t) => t.id === match.tenantId) || {
        id: match.tenantId,
        name: match.name + ' Business',
        ownerEmail: match.email,
        kraPin: '',
        phone: '',
        createdAt: new Date().toISOString(),
      };
      const newSession: AuthSession = {
        user: {
          id: match.id,
          email: match.email,
          name: match.name,
          role: match.role,
          tenantId: match.tenantId,
        },
        tenant,
      };
      setSession(newSession);
      saveToStorage('lipatim_active_session', newSession);
      loadTenantState(tenant, match);
      notify('success', 'Login Successful', `Welcome back to ${tenant.name}`);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid email or password. Use the demo credentials or register a new account.',
    };
  };

  const register = async (data: RegisterTenantData): Promise<{ success: boolean; error?: string }> => {
    const normEmail = data.email.trim().toLowerCase();
    if (!normEmail || !data.password || !data.businessName.trim() || !data.ownerName.trim()) {
      return { success: false, error: 'Please provide all required business & account fields.' };
    }

    if (normEmail === DEMO_ACCOUNT.email.toLowerCase()) {
      return { success: false, error: 'This email is reserved for demo access. Please sign in or use a different email.' };
    }

    const accounts = loadFromStorage<AuthAccount[]>('lipatim_auth_accounts_registry', []);
    if (accounts.some((a) => a.email.toLowerCase() === normEmail)) {
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }

    const newTenantId = `tenant_${Date.now()}`;
    const newTenant: Tenant = {
      id: newTenantId,
      name: data.businessName.trim(),
      ownerEmail: normEmail,
      kraPin: data.kraPin?.trim().toUpperCase() || '',
      phone: data.phone?.trim() || '',
      createdAt: new Date().toISOString(),
      isDemoTenant: false,
    };

    const newAccount: AuthAccount = {
      id: `usr_owner_${Date.now()}`,
      email: normEmail,
      password: data.password,
      name: data.ownerName.trim(),
      tenantId: newTenantId,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    // Save to global registries
    const tenants = loadFromStorage<Tenant[]>('lipatim_tenants_registry', []);
    saveToStorage('lipatim_tenants_registry', [...tenants, newTenant]);
    saveToStorage('lipatim_auth_accounts_registry', [...accounts, newAccount]);

    // Pre-initialize empty clean storage for this tenant
    const initBranch: Branch = {
      id: `br_${newTenantId}_1`,
      name: data.branchName?.trim() || `${data.businessName.trim()} Main Branch`,
      code: 'MAIN',
      address: 'Main Commercial Center',
      county: 'Nairobi',
      phone: data.phone?.trim() || '+254 700 000 000',
      isMainWarehouse: true,
      active: true,
    };
    const initUser: User = {
      id: newAccount.id,
      name: data.ownerName.trim(),
      username: normEmail.split('@')[0],
      role: 'admin',
      phone: data.phone?.trim() || '+254 700 000 000',
      email: normEmail,
      assignedBranchId: initBranch.id,
      active: true,
    };
    const initProfile = {
      name: data.businessName.trim(),
      kraPin: data.kraPin?.trim().toUpperCase() || '',
      phone: data.phone?.trim() || '',
    };

    saveToStorage(getTenantKey(newTenantId, 'branches'), [initBranch]);
    saveToStorage(getTenantKey(newTenantId, 'users'), [initUser]);
    saveToStorage(getTenantKey(newTenantId, 'profile'), initProfile);
    saveToStorage(getTenantKey(newTenantId, 'products'), []);
    saveToStorage(getTenantKey(newTenantId, 'customers'), []);
    saveToStorage(getTenantKey(newTenantId, 'suppliers'), []);
    saveToStorage(getTenantKey(newTenantId, 'supplier_pmts'), []);
    saveToStorage(getTenantKey(newTenantId, 'expenses'), []);
    saveToStorage(getTenantKey(newTenantId, 'debts'), []);
    saveToStorage(getTenantKey(newTenantId, 'invoices'), []);
    saveToStorage(getTenantKey(newTenantId, 'movements'), []);
    saveToStorage(getTenantKey(newTenantId, 'transfers'), []);
    saveToStorage(getTenantKey(newTenantId, 'grns'), []);
    saveToStorage(getTenantKey(newTenantId, 'held_orders'), []);
    saveToStorage(getTenantKey(newTenantId, 'mpesa_txs'), []);
    saveToStorage(getTenantKey(newTenantId, 'daraja_config'), DEFAULT_DARAJA_CONFIG);

    const initialAudit: AuditLogEntry = {
      id: `aud_${Date.now()}_init`,
      timestamp: new Date().toISOString(),
      userId: newAccount.id,
      userName: newAccount.name,
      userRole: 'admin',
      action: 'Business Workspace Registered',
      category: 'AUTH',
      details: `Workspace initialized for ${newTenant.name} with clean ledger and zero demo records.`,
      level: 'info',
    };
    saveToStorage(getTenantKey(newTenantId, 'audit_logs'), [initialAudit]);

    const newSession: AuthSession = {
      user: {
        id: newAccount.id,
        email: newAccount.email,
        name: newAccount.name,
        role: newAccount.role,
        tenantId: newAccount.tenantId,
      },
      tenant: newTenant,
    };

    setSession(newSession);
    saveToStorage('lipatim_active_session', newSession);
    loadTenantState(newTenant, newAccount);

    notify('success', 'Workspace Created', `New business tenant initialized with clean data for ${newTenant.name}.`);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('lipatim_active_session');
    setSession(null);
    notify('info', 'Signed Out', 'You have securely signed out of LipaTim.');
  };

  const addStaffUser = (u: Partial<User>) => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: u.name || 'New Staff Member',
      username: u.username || `staff_${Date.now().toString().slice(-3)}`,
      role: u.role || 'cashier',
      pinCode: u.pinCode || '1234',
      phone: u.phone || '+254 722 000 000',
      email: u.email || 'staff@lipatim.co.ke',
      assignedBranchId: u.assignedBranchId || activeBranchId,
      active: true,
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveToStorage(getTenantKey(activeTenantId, 'users'), updated);
    notify('success', 'Staff Account Created', `${newUser.name} added with ${newUser.role.toUpperCase()} permissions.`);
  };

  const toggleStaffActive = (userId: string) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, active: !u.active } : u));
    setUsers(updated);
    saveToStorage(getTenantKey(activeTenantId, 'users'), updated);
    notify('info', 'Staff Status Updated', 'Updated employee login access status.');
  };

  // Category Management Actions
  const addCategory = (categoryData: Omit<ProductCategory, 'id' | 'slug'> & { id?: string; slug?: string }): ProductCategory => {
    const rawName = categoryData.name.trim();
    const slug =
      categoryData.slug?.trim() ||
      rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      `cat-${Date.now().toString().slice(-4)}`;

    const newCategory: ProductCategory = {
      id: categoryData.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: rawName,
      slug,
      description: categoryData.description?.trim() || '',
      colorTag: categoryData.colorTag || undefined,
    };

    setCategories((prev) => [...prev, newCategory]);
    logAudit('Added Inventory Category', 'INVENTORY', `Added category "${newCategory.name}".`, 'info');
    notify('success', 'Category Created', `Category "${newCategory.name}" is now available in inventory.`);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<ProductCategory>) => {
    let updatedName: string | undefined;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = { ...c, ...updates };
          if (updates.name) {
            next.name = updates.name.trim();
            if (!updates.slug) {
              next.slug = next.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
          }
          updatedName = next.name;
          return next;
        }
        return c;
      })
    );

    // If category name was updated, synchronize categoryName in all products referencing this categoryId
    if (updates.name && updates.name.trim()) {
      const trimmedNewName = updates.name.trim();
      setProducts((prev) =>
        prev.map((p) => (p.categoryId === id ? { ...p, categoryName: trimmedNewName } : p))
      );
    }

    logAudit('Updated Inventory Category', 'INVENTORY', `Updated category details for "${updatedName || id}".`, 'info');
    notify('success', 'Category Updated', 'Category updated successfully.');
  };

  const deleteCategory = (id: string, reassignToCategoryId?: string): { success: boolean; error?: string } => {
    if (categories.length <= 1) {
      notify('error', 'Cannot Delete', 'You must have at least one product category in the system.');
      return { success: false, error: 'Cannot delete the only remaining category.' };
    }

    const catToDelete = categories.find((c) => c.id === id);
    const affectedProducts = products.filter((p) => p.categoryId === id);

    // Determine target category to reassign affected products
    const targetCat =
      categories.find((c) => c.id === reassignToCategoryId && c.id !== id) ||
      categories.find((c) => c.id !== id);

    if (affectedProducts.length > 0 && targetCat) {
      setProducts((prev) =>
        prev.map((p) =>
          p.categoryId === id
            ? { ...p, categoryId: targetCat.id, categoryName: targetCat.name }
            : p
        )
      );
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    logAudit(
      'Deleted Inventory Category',
      'INVENTORY',
      `Deleted category "${catToDelete?.name || id}". ${
        affectedProducts.length > 0 && targetCat
          ? `Reassigned ${affectedProducts.length} items to "${targetCat.name}".`
          : ''
      }`,
      'warning'
    );
    notify(
      'success',
      'Category Deleted',
      `Removed "${catToDelete?.name || 'Category'}". ${
        affectedProducts.length > 0 && targetCat
          ? `${affectedProducts.length} items reassigned to "${targetCat.name}".`
          : ''
      }`
    );
    return { success: true };
  };

  // Actions
  const addProduct = (p: Partial<Product>): Product => {
    const fallbackCat = categories[0] || { id: 'cat_general', name: 'General Goods' };
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      barcode: p.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      sku: p.sku || `SKU-${Date.now().toString().slice(-4)}`,
      name: p.name || 'New Product',
      categoryId: p.categoryId || fallbackCat.id,
      categoryName: categories.find((c) => c.id === p.categoryId)?.name || fallbackCat.name,
      unit: p.unit || 'PCS',
      taxRateCode: p.taxRateCode || 'A',
      costPrice: Number(p.costPrice) || 0,
      sellingPrice: Number(p.sellingPrice) || 0,
      wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : undefined,
      reorderLevel: Number(p.reorderLevel) || 10,
      isPerishable: Boolean(p.isPerishable),
      totalStock: Number(p.totalStock) || 0,
      branchStock: p.branchStock || { [activeBranchId]: Number(p.totalStock) || 0 },
      batches: p.batches || [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);
    notify('success', 'Product Added', `${newProd.name} added to catalog.`);
    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
    notify('success', 'Product Updated', 'Changes saved successfully.');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
    notify('warning', 'Product Removed', 'Item removed from inventory catalog.');
  };

  const addCustomer = (c: Partial<Customer>): Customer => {
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: c.name || 'Walk-in Customer',
      phone: c.phone || '',
      kraPin: c.kraPin,
      email: c.email,
      location: c.location,
      creditLimit: Number(c.creditLimit) || 10000,
      currentDebt: 0,
      isCreditBlocked: false,
      notes: c.notes,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    notify('success', 'Customer Registered', `${newCust.name} added to database.`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const toggleCustomerCreditBlock = (customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const newStatus = !c.isCreditBlocked;
        notify(
          newStatus ? 'warning' : 'success',
          newStatus ? 'Credit Blocked' : 'Credit Unblocked',
          `${c.name}'s store credit facility has been ${newStatus ? 'frozen' : 'restored'}.`
        );
        return { ...c, isCreditBlocked: newStatus };
      })
    );
  };

  const setCustomerCreditLimit = (customerId: string, newLimit: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, creditLimit: newLimit } : c))
    );
    notify('info', 'Credit Limit Set', `Credit limit set to KES ${newLimit.toLocaleString()}.`);
  };

  const addSupplier = (s: Partial<Supplier>): Supplier => {
    const newSup: Supplier = {
      id: `sup_${Date.now()}`,
      name: s.name || 'New Wholesaler',
      kraPin: s.kraPin,
      contactPerson: s.contactPerson || 'Sales Desk',
      phone: s.phone || '',
      email: s.email,
      address: s.address,
      paymentTermsDays: Number(s.paymentTermsDays) || 30,
      totalPurchased: 0,
      balancePayable: 0,
      active: true,
    };
    setSuppliers((prev) => [newSup, ...prev]);
    notify('success', 'Supplier Registered', `${newSup.name} added to suppliers directory.`);
    return newSup;
  };

  const paySupplier = (
    supplierId: string,
    amount: number,
    method: 'BANK' | 'MPESA' | 'CASH',
    referenceNo: string,
    notes?: string
  ) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    const newPayment: SupplierPaymentRecord = {
      id: `sp_${Date.now()}`,
      supplierId,
      supplierName: sup.name,
      amount,
      paymentMethod: method,
      referenceNo,
      notes,
      paidBy: currentUser.name,
      timestamp: new Date().toISOString(),
    };

    setSupplierPayments((prev) => [newPayment, ...prev]);

    // Deduct from supplier balance payable
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplierId
          ? { ...s, balancePayable: Math.max(0, s.balancePayable - amount) }
          : s
      )
    );

    // Also record as a business expense under supplier payments
    addExpense({
      category: 'MISCELLANEOUS',
      title: `Supplier Payment: ${sup.name}`,
      description: notes || `Settlement ref: ${referenceNo}`,
      amount,
      branchId: activeBranchId,
      paymentMethod: method,
      referenceNo,
      vendorOrRecipient: sup.name,
      approvedBy: currentUser.name,
    });

    notify(
      'success',
      'Supplier Paid',
      `KES ${amount.toLocaleString()} paid to ${sup.name} via ${method} (${referenceNo}).`
    );
  };

  const addExpense = (exp: Partial<Expense>): Expense => {
    const newExp: Expense = {
      id: `exp_${Date.now()}`,
      category: exp.category || 'MISCELLANEOUS',
      title: exp.title || 'Expense',
      description: exp.description,
      amount: Number(exp.amount) || 0,
      branchId: exp.branchId || activeBranchId,
      paymentMethod: exp.paymentMethod || 'CASH',
      referenceNo: exp.referenceNo,
      vendorOrRecipient: exp.vendorOrRecipient || 'Vendor',
      approvedBy: exp.approvedBy || currentUser.name,
      date: exp.date || new Date().toISOString().slice(0, 10),
    };
    setExpenses((prev) => [newExp, ...prev]);
    notify('success', 'Expense Logged', `KES ${newExp.amount.toLocaleString()} recorded under ${newExp.title}.`);
    return newExp;
  };

  const addInvoice = (invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
    saveInvoiceToIndexedDB(invoice);

    // Deduct stock & batch quantities for all items
    setProducts((prevProds) => {
      return prevProds.map((prod) => {
        const cartItemsForProd = invoice.items.filter((i) => i.productId === prod.id);
        if (cartItemsForProd.length === 0) return prod;

        const totalQtySold = cartItemsForProd.reduce((sum, i) => sum + i.quantity, 0);
        const currentBranchQty = prod.branchStock[invoice.branchId] || 0;
        const newBranchQty = Math.max(0, currentBranchQty - totalQtySold);
        const newTotalStock = Math.max(0, prod.totalStock - totalQtySold);

        const updatedBatches = (prod.batches || []).map((b) => {
          const batchCartItem = cartItemsForProd.find((i) => i.batchId === b.id);
          if (!batchCartItem) return b;
          return {
            ...b,
            currentQuantity: Math.max(0, b.currentQuantity - batchCartItem.quantity),
          };
        });

        return {
          ...prod,
          totalStock: newTotalStock,
          branchStock: {
            ...prod.branchStock,
            [invoice.branchId]: newBranchQty,
          },
          batches: updatedBatches,
        };
      });
    });

    // Automatically record reconciled M-Pesa payments into MpesaTransactions stream
    invoice.payments.forEach((p) => {
      if (p.method.startsWith('MPESA') && p.amount > 0) {
        addMpesaTransaction({
          receiptNumber: p.mpesaReceiptNumber || generateMpesaReceiptCode(),
          amount: p.amount,
          phoneNumber: p.customerPhone || invoice.customer?.phone || '+254 722 100 200',
          customerName: (invoice.customer?.name || 'WALK-IN CUSTOMER').toUpperCase(),
          shortcode: darajaConfig.tillNumber,
          channel: p.method === 'MPESA_STK' ? 'STK_PUSH' : p.method === 'MPESA_PAYBILL' ? 'PAYBILL' : 'BUY_GOODS',
          status: 'RECONCILED',
          linkedInvoiceId: invoice.id,
          linkedInvoiceNumber: invoice.invoiceNumber,
          reconciledBy: invoice.cashierName,
          reconciledAt: new Date().toISOString(),
        });
      }
    });

    // Check if debt was created
    const creditPmt = invoice.payments.find((p) => p.method === 'CREDIT');
    if (creditPmt && creditPmt.amount > 0 && invoice.customer) {
      const newDebt: DebtRecord = {
        id: `debt_${Date.now()}`,
        customerId: invoice.customer.id,
        customerName: invoice.customer.name,
        customerPhone: invoice.customer.phone,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        initialAmount: creditPmt.amount,
        amountPaid: 0,
        balanceRemaining: creditPmt.amount,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'ACTIVE',
        reminderCount: 0,
        createdAt: new Date().toISOString(),
      };
      setDebts((prev) => [newDebt, ...prev]);

      // Update customer balance
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === invoice.customer?.id
            ? { ...c, currentDebt: c.currentDebt + creditPmt.amount }
            : c
        )
      );
    }

    notify(
      'success',
      invoice.offlineQueued ? 'Sale Queued in IndexedDB' : 'Sale Completed',
      invoice.offlineQueued
        ? `Invoice ${invoice.invoiceNumber} stored locally in IndexedDB. Will auto-sync to KRA when online.`
        : `Invoice ${invoice.invoiceNumber} generated & eTIMS validated.`
    );
  };

  const voidInvoice = (invoiceId: string, reason: string) => {
    if (!permissions.canVoidInvoice) {
      notify('error', 'RBAC Permission Denied', 'Only Store Managers or Owners can issue KRA eTIMS Credit Notes / Voids.');
      return;
    }

    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    // Restore stock for voided invoice items
    setProducts((prevProds) =>
      prevProds.map((prod) => {
        const itemsForProd = target.items.filter((i) => i.productId === prod.id);
        if (itemsForProd.length === 0) return prod;
        const qtyReturned = itemsForProd.reduce((sum, i) => sum + i.quantity, 0);
        const currentBranchQty = prod.branchStock[target.branchId] || 0;
        return {
          ...prod,
          totalStock: prod.totalStock + qtyReturned,
          branchStock: {
            ...prod.branchStock,
            [target.branchId]: currentBranchQty + qtyReturned,
          },
        };
      })
    );

    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
    notify(
      'warning',
      'KRA eTIMS Credit Note Issued',
      `Reversed ${target.invoiceNumber} (${formatKES(target.grandTotal)}) & restored stock. Reason: ${reason}`
    );
  };

  const settleDebt = (debtId: string, amount: number, paymentMethod: PaymentMethod) => {
    const targetDebt = debts.find((d) => d.id === debtId);
    if (targetDebt && paymentMethod.startsWith('MPESA')) {
      addMpesaTransaction({
        receiptNumber: generateMpesaReceiptCode(),
        amount,
        phoneNumber: targetDebt.customerPhone,
        customerName: targetDebt.customerName.toUpperCase(),
        shortcode: darajaConfig.tillNumber,
        channel: 'STK_PUSH',
        status: 'RECONCILED',
        linkedInvoiceNumber: targetDebt.invoiceNumber,
        reconciledBy: currentUser.name,
        reconciledAt: new Date().toISOString(),
      });
    }

    setDebts((prev) =>
      prev.map((debt) => {
        if (debt.id !== debtId) return debt;
        const newAmountPaid = debt.amountPaid + amount;
        const newBalance = Math.max(0, debt.initialAmount - newAmountPaid);
        const newStatus = newBalance === 0 ? 'SETTLED' : 'ACTIVE';

        // Update customer balance
        setCustomers((prevCusts) =>
          prevCusts.map((c) =>
            c.id === debt.customerId ? { ...c, currentDebt: Math.max(0, c.currentDebt - amount) } : c
          )
        );

        notify(
          'success',
          'Madeni Payment Settled',
          `KES ${amount.toLocaleString()} received via ${paymentMethod}. Balance remaining: KES ${newBalance.toLocaleString()}`
        );

        return {
          ...debt,
          amountPaid: newAmountPaid,
          balanceRemaining: newBalance,
          status: newStatus,
        };
      })
    );
  };

  const recordStockMovement = (m: Omit<StockMovement, 'id' | 'timestamp'>) => {
    const newMovement: StockMovement = {
      id: `mov_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...m,
    };
    setStockMovements((prev) => [newMovement, ...prev]);
  };

  const createGoodsReceivedNote = (
    data: Omit<GoodsReceivedNote, 'id' | 'grnNumber' | 'timestamp'>
  ): GoodsReceivedNote => {
    const grnSeq = grns.length + 101;
    const grnNumber = `GRN-${new Date().getFullYear()}-${grnSeq.toString().padStart(4, '0')}`;
    const newGrn: GoodsReceivedNote = {
      id: `grn_${Date.now()}`,
      grnNumber,
      timestamp: new Date().toISOString(),
      ...data,
    };

    setGrns((prev) => [newGrn, ...prev]);

    // Update supplier totalPurchased and balancePayable
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === data.supplierId
          ? {
              ...s,
              totalPurchased: s.totalPurchased + data.totalCost,
              balancePayable: s.balancePayable + data.totalCost,
            }
          : s
      )
    );

    // Update product stock and batches
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== data.productId) return prod;

        const currentBranchQty = prod.branchStock[data.branchId] || 0;
        const newBranchQty = currentBranchQty + data.quantity;
        const newTotal = prod.totalStock + data.quantity;

        const newBatch: StockBatch = {
          id: `bch_${Date.now()}`,
          productId: prod.id,
          branchId: data.branchId,
          batchNumber: data.batchNumber,
          expiryDate: data.expiryDate,
          costPrice: data.unitCost,
          sellingPrice: data.retailPrice,
          initialQuantity: data.quantity,
          currentQuantity: data.quantity,
          receivedDate: new Date().toISOString().slice(0, 10),
          supplierId: data.supplierId,
        };

        return {
          ...prod,
          totalStock: newTotal,
          branchStock: {
            ...prod.branchStock,
            [data.branchId]: newBranchQty,
          },
          costPrice: data.unitCost,
          sellingPrice: data.retailPrice,
          batches: [newBatch, ...(prod.batches || [])],
        };
      })
    );

    // Record Stock Movement audit
    recordStockMovement({
      productId: data.productId,
      productName: data.productName,
      batchNumber: data.batchNumber,
      branchId: data.branchId,
      type: 'STOCK_IN_PURCHASE',
      quantity: data.quantity,
      previousStock: 0,
      newStock: data.quantity,
      unitCost: data.unitCost,
      totalValue: data.totalCost,
      referenceNo: grnNumber,
      notes: `Supplier Invoice: ${data.supplierInvoiceRef || 'N/A'}`,
      recordedBy: data.receivedBy,
    });

    notify(
      'success',
      'Goods Received (GRN)',
      `${data.quantity} units of ${data.productName} added to ${data.branchName} (${grnNumber}).`
    );

    return newGrn;
  };

  const performStockTransfer = (
    data: Omit<StockTransferRecord, 'id' | 'transferNumber' | 'timestamp'>
  ): boolean => {
    const product = products.find((p) => p.id === data.productId);
    if (!product) return false;

    const sourceStock = product.branchStock[data.sourceBranchId] || 0;
    if (sourceStock < data.quantity) {
      notify(
        'error',
        'Insufficient Stock for Transfer',
        `Only ${sourceStock} units available at ${data.sourceBranchName}. Cannot transfer ${data.quantity}.`
      );
      return false;
    }

    const trnSeq = stockTransfers.length + 101;
    const transferNumber = `TRN-${new Date().getFullYear()}-${trnSeq.toString().padStart(4, '0')}`;

    const newTransfer: StockTransferRecord = {
      id: `trn_${Date.now()}`,
      transferNumber,
      timestamp: new Date().toISOString(),
      ...data,
      status: 'COMPLETED',
    };

    setStockTransfers((prev) => [newTransfer, ...prev]);

    // Update branches stock
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== data.productId) return prod;
        const newSourceQty = (prod.branchStock[data.sourceBranchId] || 0) - data.quantity;
        const newDestQty = (prod.branchStock[data.destinationBranchId] || 0) + data.quantity;

        return {
          ...prod,
          branchStock: {
            ...prod.branchStock,
            [data.sourceBranchId]: Math.max(0, newSourceQty),
            [data.destinationBranchId]: newDestQty,
          },
        };
      })
    );

    // Record Stock Movement audit
    recordStockMovement({
      productId: data.productId,
      productName: data.productName,
      batchNumber: data.batchNumber,
      branchId: data.sourceBranchId,
      sourceBranchId: data.sourceBranchId,
      destinationBranchId: data.destinationBranchId,
      type: 'TRANSFER_OUT',
      quantity: -data.quantity,
      previousStock: sourceStock,
      newStock: sourceStock - data.quantity,
      unitCost: product.costPrice,
      totalValue: product.costPrice * data.quantity,
      referenceNo: transferNumber,
      notes: `Transfer to ${data.destinationBranchName}: ${data.notes || ''}`,
      recordedBy: data.dispatchedBy,
    });

    recordStockMovement({
      productId: data.productId,
      productName: data.productName,
      batchNumber: data.batchNumber,
      branchId: data.destinationBranchId,
      sourceBranchId: data.sourceBranchId,
      destinationBranchId: data.destinationBranchId,
      type: 'TRANSFER_IN',
      quantity: data.quantity,
      previousStock: product.branchStock[data.destinationBranchId] || 0,
      newStock: (product.branchStock[data.destinationBranchId] || 0) + data.quantity,
      unitCost: product.costPrice,
      totalValue: product.costPrice * data.quantity,
      referenceNo: transferNumber,
      notes: `Received from ${data.sourceBranchName}`,
      recordedBy: data.dispatchedBy,
    });

    notify(
      'success',
      'Stock Transferred',
      `Transferred ${data.quantity} units of ${data.productName} from ${data.sourceBranchName} to ${data.destinationBranchName} (${transferNumber}).`
    );

    return true;
  };

  const recordStockAdjustment = (
    productId: string,
    branchId: string,
    quantity: number,
    type: MovementType,
    reason: string,
    batchId?: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const currentBranchStock = product.branchStock[branchId] || 0;
    const newBranchStock = Math.max(0, currentBranchStock - quantity);
    const newTotalStock = Math.max(0, product.totalStock - quantity);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;

        let remainingToDeduct = quantity;
        const updatedBatches = (p.batches || []).map((b) => {
          if (batchId) {
            if (b.id === batchId) {
              return { ...b, currentQuantity: Math.max(0, b.currentQuantity - quantity) };
            }
            return b;
          }
          if (b.branchId === branchId && remainingToDeduct > 0 && b.currentQuantity > 0) {
            const deduct = Math.min(b.currentQuantity, remainingToDeduct);
            remainingToDeduct -= deduct;
            return { ...b, currentQuantity: b.currentQuantity - deduct };
          }
          return b;
        });

        return {
          ...p,
          totalStock: newTotalStock,
          branchStock: {
            ...p.branchStock,
            [branchId]: newBranchStock,
          },
          batches: updatedBatches,
        };
      })
    );

    const refNumber = `ADJ-${Date.now().toString().slice(-6)}`;
    recordStockMovement({
      productId,
      productName: product.name,
      branchId,
      type,
      quantity: -quantity,
      previousStock: currentBranchStock,
      newStock: newBranchStock,
      unitCost: product.costPrice,
      totalValue: product.costPrice * quantity,
      referenceNo: refNumber,
      notes: reason,
      recordedBy: currentUser.name,
    });

    notify(
      'warning',
      'Stock Adjusted / Written Off',
      `Wrote off ${quantity} units of ${product.name} under ${type.replace(/_/g, ' ')} (${formatKES(
        product.costPrice * quantity
      )} cost value).`
    );
  };

  const holdCurrentCart = (cart: CartItem[], customerId?: string, customerName?: string, note?: string) => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((sum, item) => sum + item.totalGross, 0);
    const newOrder: HeldOrder = {
      id: `held_${Date.now()}`,
      cart,
      customerId,
      customerName: customerName || 'Walk-in Customer',
      note,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      branchId: activeBranchId,
      subtotal,
    };
    const updated = [newOrder, ...heldOrders];
    setHeldOrders(updated);
    saveToStorage('lipatim_held_orders_v1', updated);
    notify('info', 'Order Suspended', `Cart held with ${cart.length} items (${subtotal.toLocaleString()} KES).`);
  };

  const recallHeldOrder = (id: string): HeldOrder | undefined => {
    const found = heldOrders.find((o) => o.id === id);
    if (found) {
      deleteHeldOrder(id);
      notify('info', 'Cart Recalled', `Restored ${found.cart.length} items to checkout.`);
    }
    return found;
  };

  const deleteHeldOrder = (id: string) => {
    const updated = heldOrders.filter((o) => o.id !== id);
    setHeldOrders(updated);
    saveToStorage('lipatim_held_orders_v1', updated);
  };

  const updateDarajaConfig = (configUpdates: Partial<DarajaConfig>) => {
    setDarajaConfig((prev) => {
      const updated = { ...prev, ...configUpdates };
      saveToStorage('lipatim_daraja_config_v1', updated);
      return updated;
    });
    notify('success', 'Daraja Config Saved', 'Safaricom API credentials updated.');
  };

  const checkDuplicateMpesaCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    return mpesaTransactions.some((t) => t.receiptNumber.toUpperCase() === clean);
  };

  const addMpesaTransaction = (tx: Partial<MpesaTransaction>): MpesaTransaction => {
    const newTx: MpesaTransaction = {
      id: `mp_tx_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      receiptNumber: tx.receiptNumber || generateMpesaReceiptCode(),
      amount: Number(tx.amount) || 0,
      phoneNumber: tx.phoneNumber || '+254 722 000 000',
      customerName: tx.customerName || 'KENYA CITIZEN',
      shortcode: tx.shortcode || darajaConfig.tillNumber,
      channel: tx.channel || 'STK_PUSH',
      status: tx.status || 'UNCLAIMED',
      linkedInvoiceId: tx.linkedInvoiceId,
      linkedInvoiceNumber: tx.linkedInvoiceNumber,
      reconciledBy: tx.reconciledBy,
      reconciledAt: tx.reconciledAt,
      timestamp: new Date().toISOString(),
    };
    setMpesaTransactions((prev) => {
      const updated = [newTx, ...prev];
      saveToStorage('lipatim_mpesa_txs_v1', updated);
      return updated;
    });
    return newTx;
  };

  const reconcileMpesaTransaction = (txId: string, invoiceNumber: string) => {
    setMpesaTransactions((prev) => {
      const updated = prev.map((t) =>
        t.id === txId
          ? {
              ...t,
              status: 'RECONCILED' as const,
              linkedInvoiceNumber: invoiceNumber,
              reconciledBy: currentUser.name,
              reconciledAt: new Date().toISOString(),
            }
          : t
      );
      saveToStorage('lipatim_mpesa_txs_v1', updated);
      return updated;
    });
    notify('success', 'Payment Reconciled', `Matched transaction to Invoice ${invoiceNumber}.`);
  };

  const simulateIncomingMpesaPayment = (
    amount: number,
    customerName: string,
    phone: string,
    channel: MpesaChannel
  ): MpesaTransaction => {
    const code = generateMpesaReceiptCode();
    const newTx: MpesaTransaction = {
      id: `mp_tx_${Date.now()}`,
      receiptNumber: code,
      amount,
      customerName: customerName.toUpperCase(),
      phoneNumber: phone,
      shortcode: darajaConfig.tillNumber,
      channel,
      status: 'UNCLAIMED',
      timestamp: new Date().toISOString(),
    };
    const updated = [newTx, ...mpesaTransactions];
    setMpesaTransactions(updated);
    saveToStorage('lipatim_mpesa_txs_v1', updated);
    notify(
      'info',
      'M-Pesa Received',
      `Safaricom Alert: Received ${formatKES(amount)} from ${newTx.customerName} (${code}). Ready for cashier allocation.`
    );
    return newTx;
  };

  const resetToDemoData = () => {
    if (activeTenantId === DEMO_TENANT_ID) {
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'products'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'categories'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'customers'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'suppliers'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'supplier_pmts'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'expenses'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'debts'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'invoices'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'movements'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'transfers'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'grns'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'held_orders'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'mpesa_txs'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'branches'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'users'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'profile'));
      localStorage.removeItem(getTenantKey(DEMO_TENANT_ID, 'audit_logs'));
      clearOfflineQueueInIndexedDB();
      loadTenantState(DEMO_TENANT, DEMO_ACCOUNT);
      notify('info', 'Demo Reset', 'System restored to fresh factory demo state.');
    } else {
      setProducts([]);
      setCustomers([]);
      setSuppliers([]);
      setSupplierPayments([]);
      setExpenses([]);
      setDebts([]);
      setInvoices([]);
      setStockMovements([]);
      setStockTransfers([]);
      setGrns([]);
      setHeldOrders([]);
      setMpesaTransactions([]);
      setAuditLogs([]);
      clearOfflineQueueInIndexedDB();
      notify('info', 'Workspace Cleared', 'All inventory, sales, and transaction records cleared.');
    }
  };

  const updateBusinessProfile = (
    updates: Partial<{ name: string; kraPin: string; phone: string }>
  ) => {
    setBusinessProfile((prev) => {
      const next = { ...prev, ...updates };
      saveToStorage(getTenantKey(activeTenantId, 'profile'), next);
      return next;
    });
    notify('success', 'Profile Updated', 'Business and KRA compliance credentials saved.');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        session,
        currentTenant: session?.tenant || null,
        login,
        register,
        logout,
        branches,
        activeBranchId,
        activeBranch,
        setActiveBranchId,
        addBranch,
        updateBranch,
        deleteBranch,
        users,
        currentUser,
        currentRole,
        setCurrentRole,
        permissions,
        addStaffUser,
        toggleStaffActive,
        businessProfile,
        updateBusinessProfile,
        products,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        customers,
        suppliers,
        expenses,
        debts,
        invoices,
        stockMovements,
        stockTransfers,
        grns,
        supplierPayments,
        heldOrders,
        mpesaTransactions,
        darajaConfig,
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        toggleCustomerCreditBlock,
        setCustomerCreditLimit,
        addSupplier,
        paySupplier,
        addExpense,
        addInvoice,
        voidInvoice,
        settleDebt,
        recordStockMovement,
        createGoodsReceivedNote,
        performStockTransfer,
        recordStockAdjustment,
        holdCurrentCart,
        recallHeldOrder,
        deleteHeldOrder,
        updateDarajaConfig,
        addMpesaTransaction,
        reconcileMpesaTransaction,
        simulateIncomingMpesaPayment,
        checkDuplicateMpesaCode,
        isOnline,
        isSimulatedOffline,
        toggleSimulatedOffline,
        pendingSyncCount,
        syncOfflineQueue,
        lastSyncedAt,
        auditLogs,
        logAudit,
        clearAuditLogs,
        printerDevice,
        printerPaperSize,
        setPrinterPaperSize,
        connectBluetoothPrinter,
        connectSimulatedPrinter,
        disconnectPrinter,
        printThermalReceipt,
        testThermalPrinter,
        notifications,
        notify,
        dismissNotification,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

