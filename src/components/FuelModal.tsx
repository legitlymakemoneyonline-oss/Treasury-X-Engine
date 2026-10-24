import React, { useState } from 'react';
import { X, Flame, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TreasuryBalances, AssetPrice } from '../types/treasury';

interface FuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: TreasuryBalances;
  prices: Record<string, AssetPrice>;
  onConfirmFuel: (polAmount: number) => void;
}

export const FuelModal: React.FC<FuelModalProps> = ({
  isOpen,
  onClose,
  balances,
  prices,
  onConfirmFuel,
}) => {
  const [polAmount, setPolAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const polPrice = prices.POL?.usdPrice || 0.485;
  const usdValue = polAmount * polPrice;
  const availableSafePol = balances.polTreasury;
  const isOverBalance = polAmount > availableSafePol;

  const handleExecute = () => {
    if (polAmount <= 0 || isOverBalance) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmFuel(polAmount);
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0D121F] border border-slate-700/80 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090D17]">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Fuel Quest Engine Payout Pool
              </h3>
              <p className="text-[11px] text-slate-400">
                Transfer verified POL from Treasury Safe to Quest Payout Pool
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

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-slate-400">
              <span>AVAILABLE SAFE RESERVE:</span>
              <span className="text-purple-400 font-bold text-sm tabular-nums">
                {availableSafePol.toLocaleString()} POL
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">POL FUEL AMOUNT:</label>
              <input
                type="number"
                max={availableSafePol}
                min={0}
                value={polAmount || ''}
                onChange={(e) => setPolAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
                className={`w-full px-3 py-2 bg-slate-900 border rounded text-slate-100 font-bold focus:outline-none ${
                  isOverBalance
                    ? 'border-rose-500 focus:border-rose-400 text-rose-300'
                    : 'border-slate-700 focus:border-purple-400'
                }`}
              />
              <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                <span>≈ ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD</span>
                <button
                  type="button"
                  onClick={() => setPolAmount(Math.floor(availableSafePol * 1000) / 1000)}
                  className="text-purple-400 hover:text-purple-300 underline font-bold"
                >
                  Max Available ({availableSafePol.toFixed(2)} POL)
                </button>
              </div>
            </div>

            {/* Strict Truth Solvency Alert */}
            {isOverBalance && (
              <div className="p-2.5 rounded bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Solvency Limit Enforced:</strong> You cannot inject {polAmount} POL. Treasury Safe only holds {availableSafePol.toLocaleString()} POL. Synthetic funds are prohibited by Strict Truth Protocol.
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1 text-slate-400 text-[11px]">
            <div className="flex justify-between">
              <span>Current Quest Pool:</span>
              <span className="text-amber-400 font-bold">{balances.polQuestLiquidity.toLocaleString()} POL</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining in Safe:</span>
              <span className={isOverBalance ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {Math.max(0, availableSafePol - polAmount).toFixed(3)} POL
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/80">
              <span>New Quest Pool Total:</span>
              <span className="text-purple-300 font-bold">
                {isOverBalance ? 'BLOCKED' : `${(balances.polQuestLiquidity + polAmount).toLocaleString()} POL`}
              </span>
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
            disabled={isSubmitting || polAmount <= 0 || isOverBalance}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:opacity-40 disabled:text-slate-500 text-white font-bold rounded transition-all cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? 'Allocating...'
                : isOverBalance
                ? 'Insufficient Balance'
                : `Transfer ${polAmount > 0 ? polAmount : ''} POL to Pool`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
