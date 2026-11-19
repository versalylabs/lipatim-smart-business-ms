import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditCategory, AuditLevel } from '../../types/audit';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
  User,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, clearAuditLogs, currentUser, currentRole, businessProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<AuditLevel | 'ALL'>('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) return false;
      if (selectedLevel !== 'ALL' && log.level !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesUser = log.userName.toLowerCase().includes(q);
        const matchesRole = log.userRole.toLowerCase().includes(q);
        if (!matchesAction && !matchesDetails && !matchesUser && !matchesRole) return false;
      }
      return true;
    });
  }, [auditLogs, selectedCategory, selectedLevel, searchQuery]);

  // Statistics
  const totalCount = auditLogs.length;
  const salesCount = auditLogs.filter((l) => l.category === 'SALES').length;
  const inventoryCount = auditLogs.filter((l) => l.category === 'INVENTORY').length;
  const securityCount = auditLogs.filter((l) => l.category === 'SECURITY' || l.category === 'AUTH').length;

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Category', 'Action', 'Severity', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.category}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.level}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LipaTim_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadgeClass = (category: AuditCategory) => {
    switch (category) {
      case 'SALES':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'INVENTORY':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'FINANCE':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'SECURITY':
      case 'AUTH':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'SYSTEM':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getLevelIcon = (level: AuditLevel) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-2xs">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Activity log
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Sales, stock changes and staff activity recorded in this business.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={clearAuditLogs}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Events</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-numbers">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Recorded audit trail entries</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Sales &amp; Invoices</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono-numbers">{salesCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">eTIMS fiscal checkouts &amp; refunds</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Inventory Operations</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono-numbers">{inventoryCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">GRNs, stock transfers &amp; write-offs</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Security &amp; RBAC</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 font-mono-numbers">{securityCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Role persona switches &amp; logins</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, details, staff member..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <span className="text-slate-500 font-medium">Severity:</span>
            {(['ALL', 'info', 'warning', 'error'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-colors ${
                  selectedLevel === lvl
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          {(['ALL', 'SALES', 'INVENTORY', 'FINANCE', 'SECURITY', 'SYSTEM'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-semibold shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Logs' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-3">Actor / Staff</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">Action Summary</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <ScrollText className="w-8 h-8 text-slate-300" />
                      <div className="font-semibold text-slate-600 text-sm">No audit records match your filters</div>
                      <div className="text-xs">Adjust your search terms or category selection to view more logs.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const date = new Date(log.timestamp);
                  const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const dateFormatted = date.toLocaleDateString();

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        <div className="font-semibold text-slate-900">{timeFormatted}</div>
                        <div className="text-[10px] text-slate-400">{dateFormatted}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                            {log.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">{log.userName}</div>
                            <div className="text-[10px] font-mono uppercase text-slate-400">{log.userRole}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getCategoryBadgeClass(log.category)}`}>
                          {log.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getLevelIcon(log.level)}
                          <span className="font-semibold text-slate-900">{log.action}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="py-2.5 px-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {filteredLogs.length} of {totalCount} events</span>
          <span className="font-mono text-[11px]">Workspace: {businessProfile.name}</span>
        </div>
      </div>
    </div>
  );
};
