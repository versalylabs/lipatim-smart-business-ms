import React from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { UserRole } from '../../types/user';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  FileCheck2,
  SmartphoneNfc,
  BookOpenCheck,
  Receipt,
  BarChart3,
  Settings,
  ShieldAlert,
  Lock,
  X,
  Building2,
  UserCheck,
  RotateCcw,
  LogOut,
  ScrollText,
  Bluetooth,
  Globe2,
} from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
  restrictedForCashier?: boolean;
  ownerOnly?: boolean;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const {
    session,
    logout,
    businessProfile,
    activeTab,
    setActiveTab,
    currentRole,
    setCurrentRole,
    branches,
    activeBranchId,
    setActiveBranchId,
    pendingSyncCount,
    debts,
    products,
    printerDevice,
    connectBluetoothPrinter,
    resetToDemoData,
  } = useApp();

  const overdueDebtsCount = debts.filter((d) => d.status === 'OVERDUE').length;
  const lowStockCount = products.filter((p) => p.totalStock <= p.reorderLevel).length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      sublabel: 'Executive Cockpit',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'pos',
      label: 'POS Counter',
      sublabel: 'Cashier Checkout',
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      sublabel: 'Batches & Expiry',
      icon: <Boxes className="w-4 h-4" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'etims',
      label: 'eTIMS Invoices',
      sublabel: 'KRA VSCU Logs',
      icon: <FileCheck2 className="w-4 h-4" />,
      badge: pendingSyncCount > 0 ? `${pendingSyncCount} queue` : undefined,
      badgeColor: 'text-blue-700 bg-blue-50',
    },
    {
      id: 'mpesa',
      label: 'M-Pesa & Payments',
      sublabel: 'STK & Reconciliation',
      icon: <SmartphoneNfc className="w-4 h-4" />,
    },
    {
      id: 'madeni',
      label: 'Madeni Ledger',
      sublabel: 'Customer Credit',
      icon: <BookOpenCheck className="w-4 h-4" />,
      badge: overdueDebtsCount > 0 ? `${overdueDebtsCount} overdue` : undefined,
      badgeColor: 'text-rose-700 bg-rose-50',
    },
    {
      id: 'expenses',
      label: 'Expenses & Opex',
      sublabel: 'Rent, Power, Wages',
      icon: <Receipt className="w-4 h-4" />,
      restrictedForCashier: true,
    },
    {
      id: 'reports',
      label: 'Reports & Z-Report',
      sublabel: 'KRA VAT 3 & P&L',
      icon: <BarChart3 className="w-4 h-4" />,
      restrictedForCashier: true,
    },
    {
      id: 'audit',
      label: 'Audit Trail & Logs',
      sublabel: 'Security & Operations',
      icon: <ScrollText className="w-4 h-4" />,
      restrictedForCashier: true,
    },
    {
      id: 'settings',
      label: 'Settings & Security',
      sublabel: 'RBAC, Hardware & Profile',
      icon: <Settings className="w-4 h-4" />,
      ownerOnly: true,
    },
    ...(session?.user.email.toLowerCase() === 'versalylabs@gmail.com'
      ? [{
          id: 'platform' as const,
          label: 'Platform',
          sublabel: 'Accounts & Usage',
          icon: <Globe2 className="w-4 h-4" />,
        }]
      : []),
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    onCloseMobile?.();
  };

  const renderSidebarContent = (isMobileDrawer: boolean) => (
    <>
      {isMobileDrawer && (
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              LT
            </span>
            <span className="font-bold text-sm text-slate-900">LipaTim Navigation</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Section (Scrolls independently from main page) */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overscroll-contain">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Operations
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isLimited =
            (currentRole === 'cashier' && (item.restrictedForCashier || item.ownerOnly)) ||
            (currentRole === 'manager' && item.ownerOnly);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full min-h-12 flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <div className="text-left truncate">
                  <div className="leading-tight flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {isLimited && (
                      <Lock className={`w-3 h-3 ${isActive ? 'text-emerald-200' : 'text-amber-500'}`} />
                    )}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {item.sublabel}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ml-1 ${
                    isActive ? 'bg-emerald-800 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Mobile-Only Quick Context Switchers (Branch, Role, Printer, Demo Reset) */}
        {isMobileDrawer && (
          <div className="pt-4 mt-4 border-t border-slate-200 space-y-3 px-2 text-xs">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Terminal Controls
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 mb-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Active Outlet Branch</span>
              </label>
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
              >
                {(branches || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 mb-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Active RBAC Role Persona</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['cashier', 'manager', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCurrentRole(r)}
                    className={`py-1.5 px-2 rounded-md text-[10px] font-mono uppercase font-bold border transition-colors ${
                      currentRole === r
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {r === 'admin' ? 'Owner' : r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  connectBluetoothPrinter();
                  onCloseMobile?.();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-semibold text-[11px]"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>{printerDevice?.connected ? 'Printer Paired' : 'Pair Printer'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetToDemoData();
                  onCloseMobile?.();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-[11px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cashier Protection Warning / Footer Note */}
      {currentRole === 'cashier' && (
        <div className="p-3 mx-3 mb-3 bg-amber-50/80 border border-amber-200/60 rounded-lg text-[11px] text-amber-900 flex items-start gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Cashier RBAC Guard Active</div>
            <div className="text-[10px] text-amber-700 leading-tight mt-0.5">
              COGS margins, VAT 3 exports, and settings are restricted.
            </div>
          </div>
        </div>
      )}

      {/* User profile / session pill at bottom */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 shrink-0 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <div className="font-semibold text-slate-900 truncate" title={businessProfile?.name || 'LipaTim Business'}>
              {businessProfile?.name || 'LipaTim Business'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {session?.tenant?.isDemoTenant ? 'Demo Retail System' : 'Dedicated Deployment'}
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 shrink-0">
            {currentRole === 'admin' ? 'OWNER' : currentRole}
          </span>
        </div>

        {session && (
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop & Tablet Permanent Left Sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 border-r border-slate-200 bg-white flex-col h-full min-h-0 shrink-0 select-none overflow-hidden">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col z-10 shadow-2xl select-none overflow-hidden">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
