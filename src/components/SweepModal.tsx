import React, { useState } from 'react';
import { X, Zap, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { TreasuryBalances, AssetPrice } from '../types/treasury';

interface SweepModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: TreasuryBalances;
  prices: Record<string, AssetPrice>;
  targetBtcSplit: number;
  onConfirmSweep: (amountUsd: number) => void;
}

export const SweepModal: React.FC<SweepModalProps> = ({
  isOpen,
  onClose,
  balances,
  prices,
  targetBtcSplit,
  onConfirmSweep,
}) => {
  const [sweepAmount, setSweepAmount] = useState<number>(balances.pendingRevenueUsdt);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const btcPrice = prices.BTC?.usdPrice || 94650;
  const polPrice = prices.POL?.usdPrice || 0.485;

  const btcAllocationUsd = (sweepAmount * targetBtcSplit) / 100;
  const polAllocationUsd = sweepAmount - btcAllocationUsd;

  const btcPurchased = btcAllocationUsd / btcPrice;
  const polRetained = polAllocationUsd / polPrice;

  const handleExecute = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmSweep(sweepAmount);
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0D121F] border border-slate-700/80 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090D17]">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Execute Auto BTC Accumulation Sweep
              </h3>
              <p className="text-[11px] text-slate-400">
                Treasury Allocation Engine · Dispatches Pending Yield to Vault Policy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Custody Notice */}
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-6 py-2.5 flex items-center gap-2 text-amber-300 text-[10px]">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Non-Custodial Notice:</strong> This operation executes an internal treasury cashflow sweep and calculates ledger rebalancing. It <strong>never</strong> touches or exports your private keys.
          </span>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-slate-400">
              <span>AVAILABLE PENDING CASHFLOW:</span>
              <span className="text-emerald-400 font-bold text-sm tabular-nums">
                ${balances.pendingRevenueUsdt.toLocaleString()} USDT
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">SWEEP AMOUNT (USDT):</label>
              <input
                type="number"
                max={balances.pendingRevenueUsdt}
                min={100}
                value={sweepAmount}
                onChange={(e) => setSweepAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Allocation Breakdown Preview */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              SWEEP ALLOCATION DISPATCH:
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              {/* To BTC */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    ₿
                  </div>
                  <div>
                    <div className="text-white font-bold">
                      {targetBtcSplit}% to Bitcoin Cold Vault
                    </div>
                    <div className="text-[10px] text-slate-500">
                      bc1qa9...llu46l (Active Verified Bitcoin Vault)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold text-sm tabular-nums">
                    +{btcPurchased.toFixed(4)} BTC
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ≈ ${Math.round(btcAllocationUsd).toLocaleString()} USD
                  </div>
                </div>
              </div>

              {/* To POL */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    ⬡
                  </div>
                  <div>
                    <div className="text-white font-bold">
                      {100 - targetBtcSplit}% to POL Quest Engine Pool
                    </div>
                    <div className="text-[10px] text-slate-500">
                      0x85109D...C955 (Active Polygon Smart Contract)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-bold text-sm tabular-nums">
                    +{Math.round(polRetained).toLocaleString()} POL
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ≈ ${Math.round(polAllocationUsd).toLocaleString()} USD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#090D17] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={isSubmitting || sweepAmount <= 0}
            className="flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded transition-all disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Transmitting to Vault...' : 'Confirm & Execute Sweep'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
