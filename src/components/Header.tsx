import React from 'react';
import { ShieldCheck, RefreshCw, Terminal, Sliders, Wallet } from 'lucide-react';

interface HeaderProps {
  onOpenAudit: () => void;
  onOpenPlisio: () => void;
  onOpenWallets: () => void;
  onOpenExecution: () => void;
  onRefreshPrices: () => void;
  isRefreshing: boolean;
  strictOnChainMode: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAudit,
  onOpenPlisio,
  onOpenWallets,
  onOpenExecution,
  onRefreshPrices,
  isRefreshing,
  strictOnChainMode,
  activeSection,
  setActiveSection,
}) => {
  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500/20 to-purple-600/30 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
            TX
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            TiggyBank Treasury X
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => handleNavClick('overview')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'overview'
                ? 'text-white border-b border-amber-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Overview & Reserves
          </button>
          <button
            onClick={() => handleNavClick('liquidity-loop')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'liquidity-loop'
                ? 'text-white border-b border-amber-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Liquidity Loop
          </button>
          <button
            onClick={() => handleNavClick('gaming')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'gaming'
                ? 'text-white border-b border-amber-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Gaming Floor
          </button>
          <button
            onClick={() => handleNavClick('accounting')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'accounting'
                ? 'text-white border-b border-amber-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Audited Ledger
          </button>
          <button
            onClick={() => handleNavClick('forecast')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'forecast'
                ? 'text-white border-b border-amber-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Forecast Engine
          </button>
        </nav>

        {/* Zone 3: Primary action group */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenWallets}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 border border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold hover:bg-amber-500/20"
            title="Configure Real On-Chain Wallets (Zero Fake Balances)"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <span>Set / Add My Wallets</span>
          </button>

          <button
            onClick={onRefreshPrices}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded hover:border-slate-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            title="Refresh Live Oracles"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Sync Oracles</span>
          </button>

          <button
            onClick={onOpenPlisio}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-200 hover:text-white bg-slate-900 border border-purple-500/40 rounded hover:border-purple-400/80 transition-colors whitespace-nowrap shrink-0"
            title="Open Plisio HMAC Payout Gateway"
          >
            <span className="text-purple-400 font-bold">HMAC</span>
            <span>Plisio Dispatch</span>
          </button>

          <button
            onClick={onOpenExecution}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded transition-all whitespace-nowrap shrink-0 shadow-sm shadow-amber-400/20"
            title="Open Transaction Signing & Execution Desk"
          >
            <span>⚡ Sign & Execute TX</span>
          </button>

          <button
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded hover:border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
