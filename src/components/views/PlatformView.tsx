import React, { useMemo, useState } from 'react';
import { Building2, Database, Search, Users } from 'lucide-react';
import { DEMO_ACCOUNT, DEMO_TENANT, Tenant } from '../../types/auth';
import { useApp } from '../../context/AppContext';

interface PlatformTenant extends Tenant {
  ownerName: string;
  ownerEmail: string;
  productCount: number;
  invoiceCount: number;
  staffCount: number;
}

const readLocalStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const readCount = (key: string): number => {
  const value = readLocalStorage<unknown[]>(key, []);
  return Array.isArray(value) ? value.length : 0;
};

export const PlatformView: React.FC = () => {
  const { session } = useApp();
  const [search, setSearch] = useState('');

  const tenants = useMemo(() => {
    const registeredTenants = readLocalStorage<Tenant[]>('lipatim_tenants_registry', []);
    const registeredAccounts = readLocalStorage<Array<{ tenantId: string; name: string; email: string }>>(
      'lipatim_auth_accounts_registry',
      []
    );
    const allTenants = [DEMO_TENANT, ...registeredTenants.filter((tenant) => tenant.id !== DEMO_TENANT.id)];

    return allTenants.map((tenant): PlatformTenant => {
      const owner = tenant.id === DEMO_TENANT.id
        ? DEMO_ACCOUNT
        : registeredAccounts.find((account) => account.tenantId === tenant.id);
      const prefix = `lipatim_${tenant.id}_`;

      return {
        ...tenant,
        ownerName: owner?.name || 'Business owner',
        ownerEmail: owner?.email || tenant.ownerEmail,
        productCount: readCount(`${prefix}products`),
        invoiceCount: readCount(`${prefix}invoices`),
        staffCount: readCount(`${prefix}users`),
      };
    });
  }, []);

  const filteredTenants = tenants.filter((tenant) =>
    `${tenant.name} ${tenant.ownerName} ${tenant.ownerEmail}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const totalProducts = tenants.reduce((total, tenant) => total + tenant.productCount, 0);

  if (session?.user.email.toLowerCase() !== 'versalylabs@gmail.com') return null;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">Versaly Labs</div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">Platform overview</h1>
          <p className="text-sm text-slate-500 mt-1">Business accounts registered in this browser.</p>
        </div>
        <div className="text-xs text-slate-500">Signed in as <span className="font-semibold text-slate-700">{session.user.email}</span></div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Metric icon={<Building2 className="w-4 h-4" />} label="Businesses" value={tenants.length} />
        <Metric icon={<Users className="w-4 h-4" />} label="Staff seats" value={tenants.reduce((n, tenant) => n + tenant.staffCount, 0)} />
        <Metric icon={<Database className="w-4 h-4" />} label="Products" value={totalProducts} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        The demo business is included in this list. Sign in with your account password to reopen its saved data on this browser.
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">Business accounts</h2>
            <p className="text-xs text-slate-500 mt-0.5">{tenants.length} account{tenants.length === 1 ? '' : 's'} found in this browser</p>
          </div>
          <label className="relative block sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search businesses or owners" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
          </label>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTenants.map((tenant) => (
            <article key={tenant.id} className="p-4 md:px-5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm text-slate-900">{tenant.name}</h3>
                  {tenant.id === DEMO_TENANT.id && <span className="text-[10px] uppercase font-bold tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Demo</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1">{tenant.ownerName} · {tenant.ownerEmail}</p>
                <p className="text-[11px] text-slate-400 mt-1">Created {new Date(tenant.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs lg:w-72">
                <Count label="Staff" value={tenant.staffCount} />
                <Count label="Products" value={tenant.productCount} />
                <Count label="Invoices" value={tenant.invoiceCount} />
              </div>
            </article>
          ))}
          {filteredTenants.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No accounts match that search.</div>}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-slate-500 bg-slate-100 rounded-xl p-4">
        This demo stores registrations and business data in browser local storage. This page can only list accounts created in this same browser; it does not show visitors or accounts from other devices. A shared platform directory requires server-side authentication and a shared database.
      </p>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
    <span className="p-2 rounded-lg bg-slate-100 text-slate-600">{icon}</span>
    <div><div className="text-xl font-black text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
  </div>
);

const Count: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div><div className="font-bold text-slate-800">{value}</div><div className="text-[10px] text-slate-500">{label}</div></div>
);
