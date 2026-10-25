import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { posSound } from '../../utils/sound';
import { ScanBarcode, Volume2, VolumeX, Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '../../types/inventory';

interface BarcodeScannerBarProps {
  onScanItem: (product: Product) => void;
}

export const BarcodeScannerBar: React.FC<BarcodeScannerBarProps> = ({ onScanItem }) => {
  const { products, activeBranch, notify } = useApp();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(posSound.enabled);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleSound = () => {
    posSound.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === query ||
        p.sku.toLowerCase() === query ||
        p.name.toLowerCase().includes(query)
    );

    if (found) {
      posSound.playScannerBeep();
      onScanItem(found);
      setBarcodeInput('');
    } else {
      posSound.playWarningBuzz();
      notify('warning', 'Barcode Not Found', `No item registered for barcode or code "${barcodeInput}".`);
    }
  };

  // Keyboard shortcut: F2 focuses scanner input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const demoScans = [
    { label: 'Jogoo 2kg', barcode: '616110001001' },
    { label: 'Panadol 10s', barcode: '500034706012' },
    { label: 'Brookside Milk', barcode: '616110022031' },
    { label: 'Amoxicillin 500mg', barcode: '616400030045' },
    { label: 'Simba Cement', barcode: '616220055019' },
  ];

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 space-y-2">
      <form onSubmit={handleScanSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan barcode or enter SKU... (Press F2 to focus)"
            className="w-full pl-9 pr-20 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Add</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleSound}
          className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs ${
            soundEnabled
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-400'
          }`}
          title={soundEnabled ? 'Scanner Audio Enabled' : 'Scanner Audio Muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline font-mono text-[10px]">{soundEnabled ? 'Beep ON' : 'Mute'}</span>
        </button>
      </form>

      {/* Quick Scan Test Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1">
        <span className="text-slate-400 shrink-0 font-medium">Quick Scan:</span>
        {demoScans.map((d) => (
          <button
            key={d.barcode}
            type="button"
            onClick={() => {
              const product = products.find((p) => p.barcode === d.barcode);
              if (product) {
                posSound.playScannerBeep();
                onScanItem(product);
              }
            }}
            className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 shrink-0 font-mono text-[10px] transition-colors"
          >
            + {d.label}
          </button>
        ))}
      </div>
    </div>
  );
};
