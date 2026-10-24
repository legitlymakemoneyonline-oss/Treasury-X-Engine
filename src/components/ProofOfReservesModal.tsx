import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, ExternalLink, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';
import { OnChainAuditTarget } from '../types/treasury';
import { DEFAULT_AUDIT_TARGETS, verifyAddressLive, AuditVerificationResult } from '../services/onChainAudit';

interface ProofOfReservesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditConfirmed: (results: AuditVerificationResult[]) => void;
}

export const ProofOfReservesModal: React.FC<ProofOfReservesModalProps> = ({
  isOpen,
  onClose,
  onAuditConfirmed,
}) => {
  const [targets, setTargets] = useState<OnChainAuditTarget[]>(DEFAULT_AUDIT_TARGETS);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResults, setAuditResults] = useState<AuditVerificationResult[]>([]);
  const [customNetwork, setCustomNetwork] = useState<'BITCOIN_MAINNET' | 'POLYGON_POS'>('BITCOIN_MAINNET');
  const [customAddress, setCustomAddress] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunFullAudit = async () => {
    setIsAuditing(true);
    try {
      const results: AuditVerificationResult[] = [];
      for (const target of targets) {
        const res = await verifyAddressLive(target);
        results.push(res);
      }
      setAuditResults(results);
      onAuditConfirmed(results);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAddCustomTarget = async () => {
    if (!customAddress.trim()) return;
    const newTarget: OnChainAuditTarget = {
      network: customNetwork,
      asset: customNetwork === 'BITCOIN_MAINNET' ? 'BTC' : 'POL',
      address: customAddress.trim(),
      label: `Operator Custom Audit (${customNetwork === 'BITCOIN_MAINNET' ? 'BTC' : 'POL'})`,
      quorum: 'Single-Sig / Custom Safe',
      storageType: customNetwork === 'BITCOIN_MAINNET' ? 'COLD_AIRGAPPED' : 'SMART_CONTRACT_SAFE',
      lastVerifiedBlock: customNetwork === 'BITCOIN_MAINNET' ? 884920 : 64189210,
      isVerified: true,
    };

    setTargets((prev) => [...prev, newTarget]);
    setCustomAddress('');

    // Immediately verify the new target
    setIsAuditing(true);
    const res = await verifyAddressLive(newTarget);
    setAuditResults((prev) => [...prev, res]);
    setIsAuditing(false);
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0D121F] border border-slate-700/80 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090D17]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Proof of Reserves & On-Chain Audit Desk
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Cryptographic Address Verification via Blockstream & Polygon RPC
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs">
          {/* Audit Banner */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>ZERO-SIMULATION AUDIT DIRECTIVE</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every Bitcoin satoshi and Polygon POL token reported in TiggyBank Treasury X is backed by
              verifiable UTXOs and Safe smart contract state on public block explorers.
            </p>
          </div>

          {/* Targets List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                ACTIVE AUDIT TARGETS ({targets.length})
              </span>
              <button
                onClick={handleRunFullAudit}
                disabled={isAuditing}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? 'Verifying Oracles...' : 'Verify All Now'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {targets.map((target, idx) => {
                const audit = auditResults.find((a) => a.target.address === target.address);
                const explorerBase =
                  target.network === 'BITCOIN_MAINNET'
                    ? 'https://mempool.space/address/'
                    : 'https://polygonscan.com/address/';

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            target.asset === 'BTC' ? 'bg-amber-400' : 'bg-purple-500'
                          }`}
                        />
                        <span className="text-white font-bold">{target.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {target.quorum}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2 rounded text-[11px]">
                      <span className="text-slate-300 truncate">{target.address}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopy(target.address)}
                          className="text-slate-400 hover:text-white transition-colors"
                          title="Copy Address"
                        >
                          {copiedAddress === target.address ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`${explorerBase}${target.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:text-amber-300 transition-colors"
                          title="Open Block Explorer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {audit ? (
                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500">Confirmed Balance:</span>
                          <div className="text-emerald-400 font-bold">
                            {audit.confirmedBalance.toLocaleString()}{' '}
                            {target.asset}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">UTXO / TX Count:</span>
                          <div className="text-white font-bold">{audit.utxoOrNonceCount}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Mempool:</span>
                          <div className="text-emerald-400 font-bold">{audit.mempoolState}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic pt-1">
                        Ready for instant verification. Click 'Verify All Now'.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Custom Wallet Auditor */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">
              AUDIT ANY EXTERNAL ON-CHAIN WALLET
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <select
                value={customNetwork}
                onChange={(e) => setCustomNetwork(e.target.value as any)}
                className="sm:col-span-4 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="BITCOIN_MAINNET">Bitcoin Mainnet (Segwit/Taproot)</option>
                <option value="POLYGON_POS">Polygon PoS (EVM / Safe)</option>
              </select>

              <input
                type="text"
                placeholder="Enter bc1... or 0x... address"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="sm:col-span-6 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
              />

              <button
                onClick={handleAddCustomTarget}
                disabled={!customAddress.trim()}
                className="sm:col-span-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded transition-colors text-xs disabled:opacity-50"
              >
                Audit
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#090D17] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded transition-colors"
          >
            Close Audit Desk
          </button>
        </div>
      </div>
    </div>
  );
};
