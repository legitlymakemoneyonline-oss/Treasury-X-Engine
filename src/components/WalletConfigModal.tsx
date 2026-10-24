import React, { useState } from 'react';
import { X, Wallet, ShieldCheck, CheckCircle2, RefreshCw, ExternalLink, ArrowRight, AlertTriangle } from 'lucide-react';
import { queryRealBitcoinBalance, queryRealPolygonBalance } from '../services/onChainAudit';

interface WalletConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  btcAddress: string;
  polAddress: string;
  strictOnChainMode: boolean;
  onSaveWallets: (btcAddr: string, polAddr: string, strictMode: boolean) => void;
  onSyncRealBalances: (btcAddr: string, polAddr: string) => Promise<{ realBtc: number; realPol: number }>;
}

export const WalletConfigModal: React.FC<WalletConfigModalProps> = ({
  isOpen,
  onClose,
  btcAddress,
  polAddress,
  strictOnChainMode,
  onSaveWallets,
  onSyncRealBalances,
}) => {
  const [inputBtc, setInputBtc] = useState<string>(btcAddress);
  const [inputPol, setInputPol] = useState<string>(polAddress);
  const [isStrictMode, setIsStrictMode] = useState<boolean>(strictOnChainMode);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    btcBalance?: number;
    polBalance?: number;
    btcSource?: string;
    polSource?: string;
    tested?: boolean;
  }>({});

  if (!isOpen) return null;

  const handleTestOnChainSync = async () => {
    setIsTesting(true);
    try {
      const [btcRes, polRes] = await Promise.all([
        queryRealBitcoinBalance(inputBtc.trim()),
        queryRealPolygonBalance(inputPol.trim()),
      ]);

      setTestResult({
        btcBalance: btcRes.balanceBtc,
        polBalance: polRes.balancePol,
        btcSource: btcRes.source,
        polSource: polRes.source,
        tested: true,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndApply = async () => {
    onSaveWallets(inputBtc.trim(), inputPol.trim(), isStrictMode);
    await onSyncRealBalances(inputBtc.trim(), inputPol.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono text-xs">
      <div className="bg-[#0D121F] border border-slate-700/80 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090D17]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-bold text-amber-400 text-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Real Wallet Configuration & On-Chain Audit Desk
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct RPC & Mempool Synchronization (Zero Demos / Zero Fake Balances)
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
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Strict Real On-Chain Mode Toggle Banner */}
          <div
            className={`p-4 rounded-lg border transition-all ${
              isStrictMode
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>STRICT REAL ON-CHAIN MODE (NO DEMOS)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When enabled, the application fetches the <strong>EXACT on-chain balance</strong> directly
                  from Bitcoin Mainnet and Polygon PoS RPC nodes for your configured addresses. Any simulated or
                  launch demo values are discarded in favor of true blockchain ledger data.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsStrictMode(!isStrictMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isStrictMode ? 'bg-amber-400' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                    isStrictMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Form: Bitcoin Address */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <span className="text-amber-400">₿</span>
                <span>BITCOIN COLD RESERVE WALLET ADDRESS</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setInputBtc(text.trim());
                    } catch {}
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline"
                >
                  Paste
                </button>
                <a
                  href={`https://mempool.space/address/${inputBtc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <span>Mempool</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <input
              type="text"
              value={inputBtc}
              onChange={(e) => setInputBtc(e.target.value)}
              placeholder="Paste your bc1q... or 3... or 1... Bitcoin address"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-amber-400 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              Queried directly via Blockstream & Mempool.space mainnet APIs. Zero mock balances.
            </p>
          </div>

          {/* Form: Polygon Address */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <span className="text-purple-400">⬡</span>
                <span>POLYGON OPERATIONAL SAFE / CONTRACT ADDRESS</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (typeof window !== 'undefined' && (window as any).ethereum) {
                      try {
                        const accs = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                        if (accs && accs[0]) setInputPol(accs[0]);
                      } catch {}
                    }
                  }}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold"
                  title="Auto-fill with connected MetaMask/Rabby address"
                >
                  Use My MetaMask/Web3
                </button>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setInputPol(text.trim());
                    } catch {}
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline"
                >
                  Paste
                </button>
                <a
                  href={`https://polygonscan.com/address/${inputPol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-slate-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <span>Polygonscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <input
              type="text"
              value={inputPol}
              onChange={(e) => setInputPol(e.target.value)}
              placeholder="Paste your 0x... Polygon Safe or Wallet address"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-purple-400 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              Queried directly via Polygon PoS Bor JSON-RPC (eth_getBalance). Real on-chain balance only.
            </p>
          </div>

          {/* Test On-Chain Sync Button */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleTestOnChainSync}
              disabled={isTesting || !inputBtc || !inputPol}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isTesting ? 'Querying Blockchain RPCs...' : 'Test Query Live Balances'}</span>
            </button>
          </div>

          {/* Live Test Results */}
          {testResult.tested && (
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400 font-bold">
                LIVE ON-CHAIN QUERY RESULTS:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500">BITCOIN MAINNET:</span>
                  <div className="text-amber-400 font-bold text-sm tabular-nums mt-0.5">
                    {testResult.btcBalance?.toFixed(8)} BTC
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Source: {testResult.btcSource}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500">POLYGON POS MAINNET:</span>
                  <div className="text-purple-400 font-bold text-sm tabular-nums mt-0.5">
                    {testResult.polBalance?.toLocaleString(undefined, { maximumFractionDigits: 4 })} POL
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Source: {testResult.polSource}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#090D17] flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            {isStrictMode ? 'Mode: STRICT REAL ON-CHAIN ONLY' : 'Mode: HYBRID AUDITED DESK'}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded transition-all shadow-sm"
            >
              Save & Sync Live Treasury
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
