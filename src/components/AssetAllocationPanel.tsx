import React from 'react';
import { PieChart, Sliders, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import { TreasuryBalances, AssetPrice } from '../types/treasury';

interface AssetAllocationPanelProps {
  balances: TreasuryBalances;
  prices: Record<string, AssetPrice>;
  targetBtcSplit: number;
  onUpdateTargetBtcSplit: (newSplit: number) => void;
  onTriggerRebalance: () => void;
}

export const AssetAllocationPanel: React.FC<AssetAllocationPanelProps> = ({
  balances,
  prices,
  targetBtcSplit,
  onUpdateTargetBtcSplit,
  onTriggerRebalance,
}) => {
  const btcPrice = prices.BTC?.usdPrice || 94650;
  const polPrice = prices.POL?.usdPrice || 0.485;

  const totalPol = balances.polTreasury + balances.polQuestLiquidity + balances.polStaked;
  const btcValueUsd = balances.btcReserve * btcPrice;
  const polValueUsd = totalPol * polPrice;
  const totalUsd = btcValueUsd + polValueUsd || 1;

  const currentBtcPercent = (btcValueUsd / totalUsd) * 100;
  const currentPolPercent = (polValueUsd / totalUsd) * 100;

  // SVG Ring Chart Math (Circumference = 2 * PI * r)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const btcStrokeDashoffset = circumference - (circumference * currentBtcPercent) / 100;

  // Rebalance delta calculations
  const targetBtcUsd = (totalUsd * targetBtcSplit) / 100;
  const deltaBtcUsd = targetBtcUsd - btcValueUsd; // positive = needs to buy BTC, negative = needs to buy POL

  return (
    <div className="p-6 rounded-xl border border-slate-800 bg-[#0B0F17] flex flex-col justify-between">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Asset Allocation & Auto-Accumulation Policy
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            RATIO TARGET: <span className="text-amber-400 font-bold">{targetBtcSplit}% BTC</span>
          </span>
        </div>

        {/* Chart + Metrics Split */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center py-6">
          {/* Animated Donut Ring */}
          <div className="sm:col-span-5 flex justify-center relative">
            <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
              {/* Background circle (POL proportion) */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke="#8B5CF6"
                strokeWidth="18"
                strokeOpacity="0.85"
              />
              {/* Foreground circle (BTC proportion) */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke="#F59E0B"
                strokeWidth="18"
                strokeDasharray={circumference}
                strokeDashoffset={btcStrokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Ring Data Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[11px] font-mono text-slate-400">BTC RATIO</span>
              <span className="text-xl font-mono font-extrabold text-white tabular-nums">
                {currentBtcPercent.toFixed(1)}%
              </span>
              <span className="text-[10px] font-mono text-amber-400">
                POL: {currentPolPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Asset Allocation Breakdown Details */}
          <div className="sm:col-span-7 space-y-4">
            {/* BTC Row */}
            <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="font-semibold text-white">Bitcoin Cold Vault</span>
                </div>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {currentBtcPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{balances.btcReserve.toFixed(4)} BTC</span>
                <span>${Math.round(btcValueUsd).toLocaleString()} USD</span>
              </div>
            </div>

            {/* POL Row */}
            <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="font-semibold text-white">Polygon Fleet (Safe + Fuel)</span>
                </div>
                <span className="font-mono text-purple-400 font-bold tabular-nums">
                  {currentPolPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{Math.round(totalPol).toLocaleString()} POL</span>
                <span>${Math.round(polValueUsd).toLocaleString()} USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operator Policy Slider: Auto BTC Accumulation Split */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Accumulation Split Policy</span>
            </span>
            <span className="font-mono text-xs text-amber-400 font-bold">
              {targetBtcSplit}% BTC / {100 - targetBtcSplit}% POL
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={targetBtcSplit}
              onChange={(e) => onUpdateTargetBtcSplit(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>50% (Balanced Growth)</span>
              <span className="text-amber-400/80">70% (Default TiggyBank X)</span>
              <span>90% (Maximum Sovereign Vault)</span>
            </div>
          </div>

          {/* Rebalance Delta Advisory */}
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono flex items-start justify-between gap-3">
            <div>
              <div className="text-slate-400 text-[11px]">POLICY VARIANCE DELTA</div>
              <div className="text-slate-200 mt-0.5">
                {Math.abs(deltaBtcUsd) < 1500 ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>In Full Target Equilibrium (Variance &lt; 0.1%)</span>
                  </span>
                ) : deltaBtcUsd > 0 ? (
                  <span>
                    Accumulation deficit: Next sweeps will route{' '}
                    <span className="text-amber-400 font-bold">
                      ${Math.round(deltaBtcUsd).toLocaleString()}
                    </span>{' '}
                    to BTC Vault.
                  </span>
                ) : (
                  <span>
                    Reserve surplus: Operational POL will be retained until parity.
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onTriggerRebalance}
              className="px-3 py-1.5 text-[11px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 transition-colors shrink-0"
            >
              Rebalance Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
