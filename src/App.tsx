/**
 * LipaTim: Smart Business Management. Seamless eTIMS Compliance.
 * Responsive Multi-Device ERP & POS Shell (Mobile, Tablet & Desktop)
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { NotificationToast } from './components/common/NotificationToast';

import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { POSView } from './components/views/POSView';
import { InventoryView } from './components/views/InventoryView';
import { EtimsView } from './components/views/EtimsView';
import { MpesaView } from './components/views/MpesaView';
import { MadeniView } from './components/views/MadeniView';
import { ExpenseView } from './components/views/ExpenseView';
import { ReportsView } from './components/views/ReportsView';
import { AuditLogView } from './components/views/AuditLogView';
import { SettingsView } from './components/views/SettingsView';
import { PlatformView } from './components/views/PlatformView';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  SmartphoneNfc,
  BookOpenCheck,
  Menu,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, session } = useApp();
  const canAccessPlatform = session?.user.email.toLowerCase() === 'versalylabs@gmail.com';

  return (
    <main className="flex-1 h-full overflow-y-auto overscroll-contain bg-slate-50/50 min-w-0 pb-16 md:pb-0">
      {(activeTab === 'dashboard' || (activeTab === 'platform' && !canAccessPlatform)) && <ExecutiveDashboard />}
      {activeTab === 'pos' && <POSView />}
      {activeTab === 'inventory' && <InventoryView />}
      {activeTab === 'etims' && <EtimsView />}
      {activeTab === 'mpesa' && <MpesaView />}
      {activeTab === 'madeni' && <MadeniView />}
      {activeTab === 'expenses' && <ExpenseView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'audit' && <AuditLogView />}
      {activeTab === 'settings' && <SettingsView />}
      {activeTab === 'platform' && canAccessPlatform && <PlatformView />}
    </main>
  );
};

const MobileBottomNav: React.FC<{ onOpenDrawer: () => void }> = ({ onOpenDrawer }) => {
  const { activeTab, setActiveTab, debts, products } = useApp();
  const overdueCount = debts.filter((d) => d.status === 'OVERDUE').length;
  const lowStockCount = products.filter((p) => p.totalStock <= p.reorderLevel).length;

  const quickTabs = [
    { id: 'dashboard' as const, label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'pos' as const, label: 'POS', icon: <ShoppingCart className="w-4 h-4" /> },
    {
      id: 'inventory' as const,
      label: 'Stock',
      icon: <Boxes className="w-4 h-4" />,
      dot: lowStockCount > 0,
    },
    { id: 'mpesa' as const, label: 'M-Pesa', icon: <SmartphoneNfc className="w-4 h-4" /> },
    {
      id: 'madeni' as const,
      label: 'Madeni',
      icon: <BookOpenCheck className="w-4 h-4" />,
      dot: overdueCount > 0,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-14 bg-white border-t border-slate-200 z-30 flex items-center justify-around px-1 select-none shadow-lg">
      {quickTabs.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.dot && (
              <span className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenDrawer}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-semibold transition-colors ${
          ['etims', 'expenses', 'reports', 'audit', 'settings', 'platform'].includes(activeTab)
            ? 'text-emerald-600'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Menu className="w-4 h-4" />
        <span>More</span>
      </button>
    </nav>
  );
};

import { LoginPage } from './components/auth/LoginPage';

const MainLayout: React.FC = () => {
  const { session } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f4f6f4] text-slate-900 font-sans">
        <LoginPage />
        <NotificationToast />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <TopBar onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <MainContent />
      </div>
      <MobileBottomNav onOpenDrawer={() => setMobileMenuOpen(true)} />
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
