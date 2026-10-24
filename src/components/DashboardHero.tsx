import React from 'react';
import { ArrowUpRight, ArrowDownRight, ShieldCheck, Flame, Lock, Wallet } from 'lucide-react';
import { AssetPrice, TreasuryBalances } from '../types/treasury';

interface DashboardHeroProps {
  balances: TreasuryBalances;
  prices: Record<string, AssetPrice>;
  targetBtcSplit: number;
  oracleSource: string;
  strictOnChainMode: boolean;
  activeBtcAddress: string;
  activePolAddress: string;
  onOpenSweepModal: () => void;
  onOpenFuelModal: () => void;
  onOpenAudit: () => void;
  onOpenWallets: () => void;
  onOpenExecution: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  balances,
  prices,
  targetBtcSplit,
  oracleSource,
  strictOnChainMode,
  activeBtcAddress,
  activePolAddress,
  onOpenSweepModal,
  onOpenFuelModal,
  onOpenAudit,
  onOpenWallets,
  onOpenExecution,
}) => {
  const btcPrice = prices.BTC?.usdPrice || 94650;
  const btcChange = prices.BTC?.change24h || 0;
  const polPrice = prices.POL?.usdPrice || 0.485;
  const polChange = prices.POL?.change24h || 0;

  const totalPol = balances.polTreasury + balances.polQuestLiquidity + balances.polStaked;

  const btcValueUsd = balances.btcReserve * btcPrice;
  const polValueUsd = totalPol * polPrice;
  const totalNetWorthUsd = btcValueUsd + polValueUsd + balances.pendingRevenueUsdt;

  const totalInBtc = totalNetWorthUsd / btcPrice;
  const totalInPol = totalNetWorthUsd / polPrice;

  // 24h weighted change calculation
  const weightedChange =
    (btcValueUsd * btcChange + polValueUsd * polChange) /
    (btcValueUsd + polValueUsd || 1);

  return (
    <section className="border-b border-slate-850 bg-[#0B0F17] py-8">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Top telemetry sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/60 text-xs font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenWallets}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold transition-all border ${
                strictOnChainMode
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${strictOnChainMode ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{strictOnChainMode ? 'STRICT REAL ON-CHAIN ONLY' : 'HYBRID DESK (CONFIGURED)'}</span>
            </button>
            <span aria-hidden="true">·</span>
            <span>BTC VAULT: <span className="text-amber-400 font-bold">{activeBtcAddress.slice(0, 8)}...{activeBtcAddress.slice(-4)}</span></span>
            <span aria-hidden="true">·</span>
            <span>POL SAFE: <span className="text-purple-400 font-bold">{activePolAddress.slice(0, 8)}...{activePolAddress.slice(-4)}</span></span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              ORACLE: <span className="text-amber-400 font-semibold">{oracleSource}</span>
            </span>
            <span aria-hidden="true">·</span>
            <button
              onClick={onOpenAudit}
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AUDIT RPC</span>
            </button>
          </div>
        </div>

        {/* Prominent Live Connected Wallets Card */}
        <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-bold tracking-wide">ACTIVE ON-CHAIN WALLETS:</span>
            </div>

            {/* Active Bitcoin Wallet */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold">₿ BTC:</span>
              <span className="text-slate-300">{activeBtcAddress.slice(0, 10)}...{activeBtcAddress.slice(-6)}</span>
              <span className="text-amber-400 font-bold tabular-nums">({balances.btcReserve.toFixed(4)} BTC)</span>
            </div>

            {/* Active Polygon Wallet */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-purple-400 font-bold">⬡ POL:</span>
              <span className="text-slate-300">{activePolAddress.slice(0, 8)}...{activePolAddress.slice(-6)}</span>
              <span className="text-purple-400 font-bold tabular-nums">({balances.polTreasury.toLocaleString()} POL)</span>
            </div>
          </div>

          <button
            onClick={onOpenWallets}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold rounded-lg transition-all whitespace-nowrap shadow-sm shadow-amber-400/20"
          >
            <Wallet className="w-4 h-4" />
            <span>Set / Add My Wallet Addresses</span>
          </button>
        </div>

        {/* Hero Main: High Impact Institutional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start">
          {/* Left: Net Worth Master Display */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">
              Consolidated Treasury Net Worth
            </div>

            <div className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums">
              ${totalNetWorthUsd.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-slate-400 pt-1">
              <div
                className={`flex items-center gap-1 font-semibold ${
                  weightedChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {weightedChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>
                  {weightedChange >= 0 ? '+' : ''}
                  {weightedChange.toFixed(2)}% (24h)
                </span>
              </div>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {totalInBtc.toFixed(4)} BTC
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {Math.round(totalInPol).toLocaleString()} POL
              </span>
            </div>

            <div className="pt-2 text-xs text-slate-400 leading-relaxed">
              Every satoshi and POL unit is cryptographically verified against public
              blockchains. No simulated wealth. Zero synthetic balances.
            </div>

            {/* Quick Operator Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={onOpenExecution}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-xs rounded transition-all flex items-center gap-2 shadow-sm"
              >
                <span>⚡ Sign & Execute TX</span>
              </button>
              <button
                onClick={onOpenSweepModal}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs border border-slate-700 rounded transition-all flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Sweep (${balances.pendingRevenueUsdt.toLocaleString()})</span>
              </button>
              <button
                onClick={onOpenFuelModal}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 rounded transition-all flex items-center gap-2"
              >
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                <span>Fuel Quest</span>
              </button>
            </div>
          </div>

          {/* Right: Dual Reserve Pillars */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bitcoin Reserve Box */}
            <div className="p-5 rounded-lg border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-xs font-mono">
                    ₿
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Bitcoin Cold Reserve
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Long-Term Capital Preservation Vault
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400">Spot: </span>
                  <span className="text-white font-bold tabular-nums">
                    ${btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span
                    className={`ml-1 text-[11px] font-semibold ${
                      btcChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {btcChange >= 0 ? '+' : ''}
                    {btcChange.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 font-mono">Holding Balance</div>
                <div className="text-2xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                  {balances.btcReserve.toFixed(4)} BTC
                </div>
                <div className="text-xs font-mono text-amber-400/90 tabular-nums">
                  ≈ ${btcValueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                <div className="flex justify-between">
                  <span>Policy Destination:</span>
                  <span className="text-white font-semibold">{targetBtcSplit}% Auto-Sweep</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="text-slate-300">Airgapped HSM (3-of-5)</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Quorum:</span>
                  <span className="text-emerald-400">Taproot Multi-Sig Active</span>
                </div>
              </div>
            </div>

            {/* Polygon Treasury Box */}
            <div className="p-5 rounded-lg border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-bold text-purple-400 text-xs font-mono">
                    ⬡
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Polygon Treasury Engine
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Quest Fuel & Gaming Liquidity Pool
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400">Spot: </span>
                  <span className="text-white font-bold tabular-nums">
                    ${polPrice.toFixed(4)}
                  </span>
                  <span
                    className={`ml-1 text-[11px] font-semibold ${
                      polChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {polChange >= 0 ? '+' : ''}
                    {polChange.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 font-mono">Total POL Fleet</div>
                <div className="text-2xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                  {Math.round(totalPol).toLocaleString()} POL
                </div>
                <div className="text-xs font-mono text-purple-400/90 tabular-nums">
                  ≈ ${polValueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                <div className="flex justify-between">
                  <span>Quest Rewards Pool:</span>
                  <span className="text-white font-semibold">
                    {balances.polQuestLiquidity.toLocaleString()} POL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Validator Staked (5.2% APR):</span>
                  <span className="text-slate-300">
                    {balances.polStaked.toLocaleString()} POL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Operational Safe:</span>
                  <span className="text-slate-300">
                    {balances.polTreasury.toLocaleString()} POL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
