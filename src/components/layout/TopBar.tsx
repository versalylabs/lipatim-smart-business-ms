import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types/user';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { BranchManagerModal } from '../branch/BranchManagerModal';
import {
  Building2,
  Wifi,
  WifiOff,
  RefreshCw,
  ShoppingCart,
  UserCheck,
  ChevronDown,
  RotateCcw,
  Bluetooth,
  Menu,
  LogOut,
  Plus,
} from 'lucide-react';

interface TopBarProps {
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleMobileMenu }) => {
  const {
    session,
    logout,
    branches,
    activeBranchId,
    setActiveBranchId,
    currentRole,
    setCurrentRole,
    currentUser,
    isOnline,
    toggleSimulatedOffline,
    pendingSyncCount,
    syncOfflineQueue,
    setActiveTab,
    resetToDemoData,
    printerDevice,
    connectBluetoothPrinter,
  } = useApp();

  const [branchOpen, setBranchOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchModalMode, setBranchModalMode] = useState<'list' | 'add'>('list');
  const navRef = useRef<HTMLDivElement>(null);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setBranchOpen(false);
        setRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-3 sm:px-4 lg:px-6 flex items-center justify-between shrink-0 z-30 select-none gap-2">
      {/* Zone 1: Mobile Hamburger + Wordmark */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 hover:text-emerald-700 transition-colors flex items-center gap-2 shrink-0"
        >
          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            LT
          </span>
          <span>LipaTim</span>
        </a>

        {/* Compact Mobile Online/Offline Pill */}
        <button
          type="button"
          onClick={toggleSimulatedOffline}
          className={`md:hidden flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
            isOnline
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          <span>{isOnline ? 'LIVE' : 'OFFLINE'}</span>
        </button>
      </div>

      {/* Zone 2: Navigation controls & Contextual Switchers (Tablet & Desktop) */}
      <div ref={navRef} className="hidden md:flex items-center gap-2 lg:gap-2.5 text-xs">
        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setBranchOpen(!branchOpen);
              setRoleOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 font-medium transition-colors"
            title="Switch Active Branch Counter"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="max-w-[115px] lg:max-w-[140px] truncate">{activeBranch.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {branchOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 z-40">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Active Branch
              </div>
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setActiveBranchId(b.id);
                    setBranchOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    b.id === activeBranchId ? 'font-semibold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div>{b.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{b.address}</div>
                  </div>
                  {b.isMainWarehouse && (
                    <span className="text-[10px] text-slate-400 uppercase font-mono ml-2">HQ</span>
                  )}
                </button>
              ))}

              <div className="pt-1.5 pb-1 border-t border-slate-100 bg-slate-50/70 flex flex-col gap-0.5 px-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setBranchOpen(false);
                    setBranchModalMode('add');
                    setBranchModalOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Add New Outlet Branch</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBranchOpen(false);
                    setBranchModalMode('list');
                    setBranchModalOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-between"
                >
                  <span>Manage All Outlets</span>
                  <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                    {branches.length}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher (Cashier / Manager / Admin) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setRoleOpen(!roleOpen);
              setBranchOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 font-medium transition-colors"
            title="Switch Testing Persona / Permissions"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span className="capitalize">{currentRole === 'admin' ? 'Owner' : currentRole}</span>
            <span className="hidden lg:inline text-slate-400">({currentUser.name.split(' ')[0]})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleOpen && (
            <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 z-40">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role Persona
              </div>
              {(['cashier', 'manager', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setCurrentRole(r);
                    setRoleOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    r === currentRole ? 'font-semibold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                  }`}
                >
                  <span className="capitalize">{r === 'admin' ? 'Owner / Admin' : r}</span>
                  <span className="text-[10px] text-slate-400">
                    {r === 'cashier' ? 'POS Only' : r === 'manager' ? 'Stock & Approvals' : 'Full Access'}
                  </span>
                </button>
              ))}

              <div className="pt-1.5 pb-1 border-t border-slate-100 bg-slate-50/70 flex flex-col gap-0.5 px-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setBranchOpen(false);
                    setBranchModalMode('add');
                    setBranchModalOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Add New Outlet Branch</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBranchOpen(false);
                    setBranchModalMode('list');
                    setBranchModalOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-between"
                >
                  <span>Manage All Outlets</span>
                  <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                    {branches.length}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bluetooth Thermal Printer Indicator */}
        <button
          type="button"
          onClick={() => {
            if (printerDevice?.connected) {
              setActiveTab('settings');
            } else {
              connectBluetoothPrinter();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium transition-colors ${
            printerDevice?.connected
              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
          title={
            printerDevice?.connected
              ? `Paired: ${printerDevice.name} (${printerDevice.paperWidth})`
              : 'Click to pair Web Bluetooth ESC/POS thermal printer'
          }
        >
          <Bluetooth className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">
            {printerDevice?.connected ? `${printerDevice.paperWidth} Printer` : 'Pair Printer'}
          </span>
        </button>

        {/* Network & eTIMS Online/Offline Status */}
        <button
          type="button"
          onClick={toggleSimulatedOffline}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium transition-colors ${
            isOnline
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
          title="Click to toggle offline mode simulation"
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>eTIMS Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline DB</span>
            </>
          )}
        </button>

        {/* Pending Sync Queue Button (if any) */}
        {pendingSyncCount > 0 && (
          <button
            type="button"
            onClick={syncOfflineQueue}
            disabled={!isOnline}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium disabled:opacity-50"
            title="Sync queued invoices with KRA"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{pendingSyncCount} Queued</span>
          </button>
        )}
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <PWAInstallButton />

        <button
          type="button"
          onClick={resetToDemoData}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          title="Reset to fresh demo sample data"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span className="hidden lg:inline">Reset Demo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
        >
          <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Open POS Counter</span>
          <span className="sm:hidden">POS</span>
        </button>

        {session && (
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
            title={`Sign Out (${session.user.email})`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        )}
      </div>

      {/* Multi-Branch Management Modal */}
      <BranchManagerModal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        initialMode={branchModalMode}
      />
    </header>
  );
};
