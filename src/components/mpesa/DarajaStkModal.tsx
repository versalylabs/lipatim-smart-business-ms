import React, { useState, useEffect } from 'react';
import { formatKES, generateMpesaReceiptCode, normalizeKenyanPhone } from '../../utils/kenya';
import { posSound } from '../../utils/sound';
import { Smartphone, RefreshCw, CheckCircle2, XCircle, Clock, ShieldCheck, X } from 'lucide-react';

interface DarajaStkModalProps {
  amount: number;
  phone: string;
  onSuccess: (mpesaCode: string, phone: string) => void;
  onCancel: () => void;
}

export const DarajaStkModal: React.FC<DarajaStkModalProps> = ({
  amount,
  phone,
  onSuccess,
  onCancel,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [stkState, setStkState] = useState<'PROMPTED' | 'SUCCESS' | 'CANCELLED' | 'INSUFFICIENT'>(
    'PROMPTED'
  );
  const [receiptCode, setReceiptCode] = useState('');

  const normalized = normalizeKenyanPhone(phone);

  useEffect(() => {
    if (stkState !== 'PROMPTED') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStkState('CANCELLED');
          posSound.playWarningBuzz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stkState]);

  const handleSimulatePinEntered = () => {
    const code = generateMpesaReceiptCode();
    setReceiptCode(code);
    setStkState('SUCCESS');
    posSound.playSuccessChime();
    setTimeout(() => {
      onSuccess(code, normalized.formatted || phone);
    }, 1200);
  };

  const handleSimulateCancel = () => {
    setStkState('CANCELLED');
    posSound.playWarningBuzz();
  };

  const handleSimulateInsufficient = () => {
    setStkState('INSUFFICIENT');
    posSound.playWarningBuzz();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Safaricom Daraja STK Push</h3>
              <div className="text-[10px] text-slate-400 font-mono">Buy Goods Till: 8841920</div>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic Phone Prompt Graphic */}
        <div className="p-4 bg-emerald-950 text-emerald-100 rounded-xl font-mono text-xs shadow-inner space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] opacity-80 border-b border-emerald-800/80 pb-1.5">
            <span>SAFARICOM M-PESA</span>
            <span className="flex items-center gap-1 font-mono-numbers">
              <Clock className="w-3 h-3 text-emerald-400 animate-spin" />
              <span>{secondsRemaining}s</span>
            </span>
          </div>

          <div className="space-y-1.5 text-center py-1">
            <div className="text-xs text-emerald-300">Lipa na M-Pesa Prompt Dispatched to:</div>
            <div className="font-bold text-sm text-white font-mono-numbers">
              {normalized.formatted || phone}
            </div>
            <div className="text-[11px] text-emerald-200 mt-2 bg-emerald-900/80 p-2 rounded border border-emerald-700/50">
              Do you want to pay <span className="font-bold text-white">{formatKES(amount)}</span> to LipaTim
              Retail? Enter M-Pesa PIN:
            </div>
          </div>
        </div>

        {/* Status Feedback */}
        {stkState === 'PROMPTED' && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-center gap-2 text-slate-500 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Waiting for customer to enter PIN...</span>
            </div>

            {/* Test Simulation Controls */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center">
                Simulation Triggers (Dev / Sandbox)
              </div>
              <button
                type="button"
                onClick={handleSimulatePinEntered}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulate Customer Entered Correct PIN</span>
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleSimulateCancel}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                >
                  Customer Cancelled
                </button>
                <button
                  type="button"
                  onClick={handleSimulateInsufficient}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                >
                  Insufficient Balance
                </button>
              </div>
            </div>
          </div>
        )}

        {stkState === 'SUCCESS' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <div className="font-bold text-emerald-950">Payment Confirmed by Safaricom</div>
            <div className="font-mono text-emerald-800 text-[11px]">Ref: {receiptCode}</div>
          </div>
        )}

        {stkState === 'CANCELLED' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2 text-xs">
            <XCircle className="w-6 h-6 text-rose-600 mx-auto" />
            <div className="font-bold text-rose-950">Request Cancelled or Timed Out</div>
            <div className="text-[11px] text-rose-700">
              Customer dismissed the prompt or did not enter PIN within 30 seconds.
            </div>
            <button
              onClick={() => {
                setStkState('PROMPTED');
                setSecondsRemaining(30);
              }}
              className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold"
            >
              Retry STK Push
            </button>
          </div>
        )}

        {stkState === 'INSUFFICIENT' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2 text-xs">
            <XCircle className="w-6 h-6 text-amber-600 mx-auto" />
            <div className="font-bold text-amber-950">Insufficient M-Pesa Balance</div>
            <div className="text-[11px] text-amber-800">
              Customer has insufficient funds in their M-Pesa wallet. Offer Cash or Split tender.
            </div>
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-slate-800 text-white rounded text-xs font-semibold"
            >
              Switch to Cash / Split
            </button>
          </div>
        )}

        <div className="pt-2 text-center text-[10px] text-slate-400">
          Direct Safaricom Daraja v2.0 Gateway · Certified for VSCU eTIMS
        </div>
      </div>
    </div>
  );
};
