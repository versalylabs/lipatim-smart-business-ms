export type UserRole = 'cashier' | 'manager' | 'admin';

export interface UserPermissions {
  canProcessSale: boolean;
  canApplyCustomDiscount: boolean;
  canVoidInvoice: boolean;
  canManageInventory: boolean;
  canPerformStockTransfer: boolean;
  canViewCostPrices: boolean;
  canViewProfitMargins: boolean;
  canManageExpenses: boolean;
  canAccessZReports: boolean;
  canExportKRAFilings: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  cashier: {
    canProcessSale: true,
    canApplyCustomDiscount: false, // Prevents unauthorized price cuts
    canVoidInvoice: false, // Requires manager override
    canManageInventory: false,
    canPerformStockTransfer: false,
    canViewCostPrices: false,
    canViewProfitMargins: false,
    canManageExpenses: false,
    canAccessZReports: true, // Can print own shift summary
    canExportKRAFilings: false,
    canManageSettings: false,
    canManageUsers: false,
  },
  manager: {
    canProcessSale: true,
    canApplyCustomDiscount: true,
    canVoidInvoice: true,
    canManageInventory: true,
    canPerformStockTransfer: true,
    canViewCostPrices: true,
    canViewProfitMargins: true,
    canManageExpenses: true,
    canAccessZReports: true,
    canExportKRAFilings: true,
    canManageSettings: false,
    canManageUsers: false,
  },
  admin: {
    canProcessSale: true,
    canApplyCustomDiscount: true,
    canVoidInvoice: true,
    canManageInventory: true,
    canPerformStockTransfer: true,
    canViewCostPrices: true,
    canViewProfitMargins: true,
    canManageExpenses: true,
    canAccessZReports: true,
    canExportKRAFilings: true,
    canManageSettings: true,
    canManageUsers: true,
  },
};

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  pinCode?: string;
  phone: string;
  email: string;
  assignedBranchId: string;
  avatarUrl?: string;
  active: boolean;
}

