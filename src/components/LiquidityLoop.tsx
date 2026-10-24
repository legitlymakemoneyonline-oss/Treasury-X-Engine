import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ArrowRight, CheckCircle2, Info, Sparkles, RefreshCw } from 'lucide-react';
import { TreasuryBalances, AssetPrice } from '../types/treasury';

interface LiquidityLoopProps {
  balances: TreasuryBalances;
  prices: Record<string, AssetPrice>;
  targetBtcSplit: number;
  onSimulateRevenueCycle: () => void;
}

export const LiquidityLoop: React.FC<LiquidityLoopProps> = ({
  balances,
  prices,
  targetBtcSplit,
  onSimulateRevenueCycle,
}) => {
  const [selectedNode, setSelectedNode] = useState<string>('auto-accumulation');
  const [isLoopAnimating, setIsLoopAnimating] = useState<boolean>(false);

  const btcPrice = prices.BTC?.usdPrice || 94650;
  const polPrice = prices.POL?.usdPrice || 0.485;

  const nodes = [
    {
      id: 'quest-engine',
      title: 'Quest & Game Engine',
      subtitle: 'Polygon Platform Engine',
      type: 'REVENUE_SOURCE',
      metric: 'Verifiable On-Chain Events',
      detail: 'Direct interactions with user Polygon contract. Zero synthetic volumes or simulated users.',
      address: '0x85109D...C955',
      x: '10%',
      y: '50%',
      color: 'purple',
    },
    {
      id: 'revenue-collection',
      title: 'Protocol Cashflow Pool',
      subtitle: 'Net Yield Aggregation',
      type: 'AGGREGATOR',
      metric: `$${balances.pendingRevenueUsdt.toLocaleString()} USDT Pending`,
      detail: 'Aggregated verified protocol cut. $0.00 until genuine on-chain cashflow is confirmed.',
      address: '0x85109D...C955',
      x: '35%',
      y: '22%',
      color: 'emerald',
    },
    {
      id: 'auto-accumulation',
      title: 'Auto-Accumulation Engine',
      subtitle: `${targetBtcSplit}% BTC / ${100 - targetBtcSplit}% POL Split`,
      type: 'DISPATCHER',
      metric: `Target Policy: ${targetBtcSplit}% to Vault`,
      detail: 'Mathematical split engine that executes auto-sweeps into Bitcoin Reserve.',
      address: 'Strict On-Chain v2.4',
      x: '62%',
      y: '22%',
      color: 'amber',
    },
    {
      id: 'btc-cold-vault',
      title: 'Bitcoin Cold Vault',
      subtitle: 'Primary Reserve Backing',
      type: 'RESERVE_STORAGE',
      metric: `${balances.btcReserve.toFixed(8)} BTC ($${(balances.btcReserve * btcPrice).toFixed(2)})`,
      detail: 'User Bitcoin SegWit reserve holding sovereign backing. No synthetic assets.',
      address: 'bc1qa9...llu46l',
      x: '88%',
      y: '50%',
      color: 'amber',
    },
    {
      id: 'pol-fuel-pool',
      title: 'POL Quest Fuel Pool',
      subtitle: 'Operational Liquidity',
      type: 'FUEL_RECYCLE',
      metric: `${balances.polQuestLiquidity.toLocaleString()} POL ($${(balances.polQuestLiquidity * polPrice).toFixed(2)})`,
      detail: 'Operational liquidity pool. Strictly reflects verified on-chain deposits.',
      address: '0x85109D...C955',
      x: '50%',
      y: '78%',
      color: 'purple',
    },
  ];

  const handleTriggerCycle = () => {
    setIsLoopAnimating(true);
    onSimulateRevenueCycle();
    setTimeout(() => {
      setIsLoopAnimating(false);
    }, 4000);
  };

  const activeNodeData = nodes.find((n) => n.id === selectedNode) || nodes[2];

  return (
    <section className="py-10 border-b border-slate-800 bg-[#0B0F17]">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              Visual Centrepiece · Perpetual Capital Architecture
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              TiggyBank Liquidity Loop
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Closed-circuit treasury flywheel: Real gaming activity on Polygon generates cashflow,
              which auto-accumulates immutable Bitcoin reserves while continuously fueling quest payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerCycle}
              disabled={isLoopAnimating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded transition-all shadow-sm shadow-amber-500/10 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoopAnimating ? 'Executing Cycle...' : 'Trigger Real Revenue Cycle'}</span>
            </button>
          </div>
        </div>

        {/* Visual Interactive Loop Canvas */}
        <div className="relative w-full rounded-xl border border-slate-800 bg-[#070A0F] overflow-hidden p-6 sm:p-8">
          {/* Subtle grid background pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Animated Flow Path Connections */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 1000 600"
          >
            <defs>
              <linearGradient id="gradAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
              </linearGradient>

              <linearGradient id="gradReturn" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Path 1: Quest Engine to Revenue Collection */}
            <path
              d="M 160 300 C 160 160, 280 132, 350 132"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Path 2: Revenue Collection to Auto Accumulation */}
            <path
              d="M 350 132 L 620 132"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Path 3: Auto Accumulation to BTC Vault */}
            <path
              d="M 620 132 C 750 132, 880 180, 880 300"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Path 4: Auto Accumulation down to POL Fuel Pool */}
            <path
              d="M 620 132 C 620 300, 500 400, 500 468"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Path 5: POL Fuel Pool back to Quest Engine (Closed Loop) */}
            <path
              d="M 500 468 C 300 468, 160 420, 160 300"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Dynamic Active Glowing Pulse Lines */}
            <path
              d="M 160 300 C 160 160, 280 132, 350 132 L 620 132 C 750 132, 880 180, 880 300"
              fill="none"
              stroke="url(#gradAmber)"
              strokeWidth="2.5"
              className={isLoopAnimating ? 'opacity-100' : 'opacity-40'}
            />
            <path
              d="M 620 132 C 620 300, 500 400, 500 468 C 300 468, 160 420, 160 300"
              fill="none"
              stroke="url(#gradReturn)"
              strokeWidth="2"
              className={isLoopAnimating ? 'opacity-100' : 'opacity-40'}
            />

            {/* Animated Flow Particles */}
            <motion.circle
              r="4"
              fill="#F59E0B"
              animate={{
                cx: [160, 250, 350, 620, 880],
                cy: [300, 160, 132, 132, 300],
                opacity: [0.2, 1, 1, 1, 0.4],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              r="3.5"
              fill="#8B5CF6"
              animate={{
                cx: [620, 580, 500, 300, 160],
                cy: [132, 300, 468, 468, 300],
                opacity: [0.2, 1, 1, 1, 0.4],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1.5,
              }}
            />
          </svg>

          {/* Interactive Flow Nodes */}
          <div className="relative min-h-[380px] sm:min-h-[460px] w-full flex flex-col justify-between">
            {/* Top row nodes */}
            <div className="flex justify-around items-start pt-4 relative z-10">
              {/* Node 2: Revenue Collection */}
              <button
                onClick={() => setSelectedNode('revenue-collection')}
                className={`group flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all max-w-[220px] text-center ${
                  selectedNode === 'revenue-collection'
                    ? 'bg-slate-900 border-2 border-emerald-400/80 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="relative mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
                    $
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-lg bg-emerald-400/20 pointer-events-none"
                  />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">
                  Revenue Collection
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold mt-0.5">
                  ${balances.pendingRevenueUsdt.toLocaleString()} USDT
                </span>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  Gaming Fees & Spreads
                </span>
              </button>

              {/* Node 3: Auto-Accumulation Engine */}
              <button
                onClick={() => setSelectedNode('auto-accumulation')}
                className={`group flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all max-w-[240px] text-center ${
                  selectedNode === 'auto-accumulation'
                    ? 'bg-slate-900 border-2 border-amber-400/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="relative mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
                    ⇄
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="absolute inset-0 rounded-lg bg-amber-400/30 pointer-events-none"
                  />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">
                  Auto BTC Accumulation
                </span>
                <span className="text-[11px] font-mono text-amber-400 font-semibold mt-0.5">
                  {targetBtcSplit}% BTC / {100 - targetBtcSplit}% POL
                </span>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  Mathematical Split Policy
                </span>
              </button>
            </div>

            {/* Middle row: Left (Quest Engine) and Right (BTC Cold Vault) */}
            <div className="flex justify-between items-center px-2 sm:px-6 relative z-10 my-4">
              {/* Node 1: Quest & Game Engine */}
              <button
                onClick={() => setSelectedNode('quest-engine')}
                className={`group flex flex-col items-start p-3 sm:p-4 rounded-xl transition-all max-w-[210px] text-left ${
                  selectedNode === 'quest-engine'
                    ? 'bg-slate-900 border-2 border-purple-400/80 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="relative mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-mono font-bold text-purple-400 text-sm">
                    ⬡
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    className="absolute inset-0 rounded-lg bg-purple-400/20 pointer-events-none"
                  />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">
                  Quest Engine
                </span>
                <span className="text-[11px] font-mono text-purple-400 font-semibold mt-0.5">
                  Polygon PoS
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Gaming Volume & Quests
                </span>
              </button>

              {/* Node 4: Bitcoin Cold Vault */}
              <button
                onClick={() => setSelectedNode('btc-cold-vault')}
                className={`group flex flex-col items-end p-3 sm:p-4 rounded-xl transition-all max-w-[210px] text-right ${
                  selectedNode === 'btc-cold-vault'
                    ? 'bg-slate-900 border-2 border-amber-400/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="relative mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
                    ₿
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-lg bg-amber-400/25 pointer-events-none"
                  />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">
                  Bitcoin Cold Vault
                </span>
                <span className="text-[11px] font-mono text-amber-400 font-semibold mt-0.5">
                  {balances.btcReserve.toFixed(4)} BTC
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Airgapped Sovereign Vault
                </span>
              </button>
            </div>

            {/* Bottom row: POL Quest Fuel Pool */}
            <div className="flex justify-center items-end pb-4 relative z-10">
              {/* Node 5: POL Quest Fuel Pool */}
              <button
                onClick={() => setSelectedNode('pol-fuel-pool')}
                className={`group flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all max-w-[240px] text-center ${
                  selectedNode === 'pol-fuel-pool'
                    ? 'bg-slate-900 border-2 border-purple-400/80 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="relative mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-mono font-bold text-purple-400 text-sm">
                    ⚡
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.1, repeat: Infinity }}
                    className="absolute inset-0 rounded-lg bg-purple-400/20 pointer-events-none"
                  />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">
                  POL Fuel & Payout Pool
                </span>
                <span className="text-[11px] font-mono text-purple-400 font-semibold mt-0.5">
                  {balances.polQuestLiquidity.toLocaleString()} POL
                </span>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  Recycled Gaming Liquidity
                </span>
              </button>
            </div>
          </div>

          {/* Node Inspector Footer Drawer */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">INSPECTING NODE:</span>
              <span className="text-white font-bold">{activeNodeData.title}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300">{activeNodeData.detail}</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 shrink-0">
              <span>TARGET ADDRESS:</span>
              <span className="text-amber-400 font-semibold">{activeNodeData.address}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
