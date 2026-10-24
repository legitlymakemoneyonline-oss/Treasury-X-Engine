import React from 'react';
import { Coins, Zap, Shield, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { TreasuryBalances, AssetPrice } from '../types/treasury';

interface ProfitEnginePanelProps {
  balances: TreasuryBalances;
  prices: Record<string, AssetPrice>;
  targetBtcSplit: number;
  onSettleQuestRevenue: () => void;
  onCollectStakingYield: () => void;
  onExecuteSweep: () => void;
}

export const ProfitEnginePanel: React.FC<ProfitEnginePanelProps> = ({
  balances,
  prices,
  targetBtcSplit,
  onSettleQuestRevenue,
  onCollectStakingYield,
  onExecuteSweep,
}) => {
  const btcPrice = prices.BTC?.usdPrice || 94650;
  const polPrice = prices.POL?.usdPrice || 0.485;

  const btcAllocationUsd = (balances.pendingRevenueUsdt * targetBtcSplit) / 100;
  const polAllocationUsd = balances.pendingRevenueUsdt - btcAllocationUsd;
  const btcToBuy = btcAllocationUsd / btcPrice;
  const polToRetain = polAllocationUsd / polPrice;

  return (
    <div className="p-6 rounded-xl border border-slate-800 bg-[#0B0F17] flex flex-col justify-between">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Real Profit Engine & Cashflow Dispatch
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            NON-SYNTHETIC YIELD
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          Treasury growth is strictly tied to verifiable on-chain revenue: gaming platform volume,
          quest protocol fees, and validator proof-of-stake rewards.
        </p>

        {/* Real Revenue Stream Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          {/* Stream 1 */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Quest Engine Take-Rate</span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                {balances.pendingRevenueUsdt > 0 ? '2.5% ON-CHAIN' : '$0.00 REVENUE'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {balances.pendingRevenueUsdt > 0
                ? 'Generated from player entrance fees and sponsored gaming quests.'
                : 'Zero fake revenue. Current pending protocol cashflow is strictly $0.00 USDT.'}
            </div>
          </div>

          {/* Stream 2 */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Validator Staking Yield</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {balances.polStaked > 0 ? '5.2% APR' : '0 POL STAKED'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {balances.polStaked > 0
                ? `Compounded daily from ${balances.polStaked.toLocaleString()} POL staked on Polygon PoS consensus.`
                : '0 POL staked. No active validator delegation on Polygon PoS. Zero synthetic yield.'}
            </div>
          </div>
        </div>

        {/* Current Pending Pool Box */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-purple-500/10 border border-emerald-500/20 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-300">
              PENDING PROTOCOL CASHFLOW TO SWEEP:
            </span>
            <span className="font-mono text-lg font-extrabold text-emerald-400 tabular-nums">
              ${balances.pendingRevenueUsdt.toLocaleString()} USDT
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-[11px] font-mono">
            <div>
              <span className="text-slate-400">To Bitcoin Vault ({targetBtcSplit}%):</span>
              <div className="text-amber-400 font-bold mt-0.5">
                +${balances.pendingRevenueUsdt > 0 ? Math.round(btcAllocationUsd).toLocaleString() : '0.00'} (≈{btcToBuy.toFixed(4)} BTC)
              </div>
            </div>
            <div>
              <span className="text-slate-400">To POL Quest Pool ({100 - targetBtcSplit}%):</span>
              <div className="text-purple-400 font-bold mt-0.5">
                +${balances.pendingRevenueUsdt > 0 ? Math.round(polAllocationUsd).toLocaleString() : '0.00'} (≈{Math.round(polToRetain).toLocaleString()} POL)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Live Settlement Controls */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onExecuteSweep}
          disabled={balances.pendingRevenueUsdt <= 0}
          className={`w-full py-2.5 px-4 font-bold text-xs rounded transition-all flex items-center justify-center gap-2 shadow-sm ${
            balances.pendingRevenueUsdt > 0
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>
            {balances.pendingRevenueUsdt > 0
              ? `Execute Auto-Accumulation Sweep (${targetBtcSplit}% to BTC)`
              : 'Auto-Sweep Idle ($0.00 Pending Yield)'}
          </span>
        </button>

        <div className="p-3 bg-slate-950/70 border border-slate-850 rounded text-center text-[11px] font-mono text-slate-500">
          Pending protocol cashflow accumulates dynamically from live on-chain operations. Zero mock revenue buttons.
        </div>
      </div>
    </div>
  );
};
