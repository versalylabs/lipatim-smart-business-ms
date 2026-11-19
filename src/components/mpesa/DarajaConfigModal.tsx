import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Key, X } from 'lucide-react';

interface DarajaConfigModalProps {
  onClose: () => void;
}

export const DarajaConfigModal: React.FC<DarajaConfigModalProps> = ({ onClose }) => {
  const { darajaConfig, updateDarajaConfig } = useApp();

  const [env, setEnv] = useState<'sandbox' | 'production'>(darajaConfig.environment);
  const [shortcode, setShortcode] = useState(darajaConfig.businessShortCode);
  const [tillNumber, setTillNumber] = useState(darajaConfig.tillNumber);
  const [autoReconcile, setAutoReconcile] = useState(darajaConfig.autoReconcile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDarajaConfig({
      environment: env,
      businessShortCode: shortcode,
      tillNumber,
      consumerKey: '',
      consumerSecret: '',
      passkey: '',
      autoReconcile,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">M-Pesa payment settings</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Environment */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Gateway Environment</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEnv('sandbox')}
                className={`p-2 rounded-lg border text-xs font-semibold ${
                  env === 'sandbox'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Sandbox
              </button>
              <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs flex items-center justify-center">
                Live payments unavailable
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Buy Goods Till No.</label>
              <input
                type="text"
                value={tillNumber}
                onChange={(e) => setTillNumber(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Paybill Shortcode</label>
              <input
                type="text"
                value={shortcode}
                onChange={(e) => setShortcode(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            Live M-Pesa keys are not collected or stored in this browser. A secure server connection is required before live payments can be enabled.
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">Auto-Reconcile Matching Tills</div>
              <div className="text-[11px] text-slate-500">Automatically match incoming payments to open cart</div>
            </div>
            <input
              type="checkbox"
              checked={autoReconcile}
              onChange={(e) => setAutoReconcile(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
