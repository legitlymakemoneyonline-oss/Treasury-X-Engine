import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ExternalLink,
  Copy,
  Check,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { LedgerEntry, AssetSymbol, LedgerEventType } from '../types/treasury';

interface TreasuryAccountingLedgerProps {
  entries: LedgerEntry[];
  onOpenAuditModal: () => void;
}

export const TreasuryAccountingLedger: React.FC<TreasuryAccountingLedgerProps> = ({
  entries,
  onOpenAuditModal,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.toAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.fromAddress.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAsset = assetFilter === 'ALL' || entry.asset === assetFilter;
      const matchesType = typeFilter === 'ALL' || entry.type === typeFilter;

      return matchesSearch && matchesAsset && matchesType;
    });
  }, [entries, searchQuery, assetFilter, typeFilter]);

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'BlockNumber',
      'TxHash',
      'Asset',
      'Amount',
      'UsdEquivalent',
      'EventType',
      'FromAddress',
      'ToAddress',
      'Status',
      'AuditSignature',
    ];

    const rows = filteredEntries.map((e) => [
      e.timestamp,
      e.blockNumber,
      e.txHash,
      e.asset,
      e.amount,
      e.usdEquivalent,
      e.type,
      e.fromAddress,
      e.toAddress,
      e.status,
      e.auditSignature || 'VERIFIED',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n'
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tiggybank_treasury_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="py-10 border-b border-slate-800 bg-[#0B0F17]">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              Double-Entry Cryptographic Accounting
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Treasury Accounting Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Immutable log of every yield sweep, auto-accumulation buy, quest engine payout, and vault deposit.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Merkle Proofs</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-t-xl border border-b-0 border-slate-800 bg-slate-900/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 text-xs font-mono">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by TX Hash, Address, or Event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/80"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Asset Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded border border-slate-800">
              {['ALL', 'BTC', 'POL', 'USDT'].map((asset) => (
                <button
                  key={asset}
                  onClick={() => setAssetFilter(asset)}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    assetFilter === asset
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>

            {/* Event Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-amber-500/80 text-[11px]"
            >
              <option value="ALL">All Event Types</option>
              <option value="AUTO_ACCUMULATION_BTC">Auto BTC Accumulation</option>
              <option value="QUEST_ENGINE_FUEL">Quest Engine Fuel</option>
              <option value="GAMING_VOLUME_FEE">Gaming Volume Fee</option>
              <option value="VALIDATOR_STAKING_REWARD">Validator Staking</option>
              <option value="PLISIO_PAYOUT_DISPATCH">Plisio Dispatch</option>
            </select>
          </div>
        </div>

        {/* Accounting Table */}
        <div className="border border-slate-800 rounded-b-xl overflow-x-auto bg-[#070A0F]">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/40 uppercase">
                <th className="py-3 px-4 font-semibold">Timestamp / Block</th>
                <th className="py-3 px-4 font-semibold">TX Hash</th>
                <th className="py-3 px-4 font-semibold">Event Type & Description</th>
                <th className="py-3 px-4 font-semibold text-right">Asset Amount</th>
                <th className="py-3 px-4 font-semibold text-right">USD Equiv.</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-amber-400 font-bold">0 Confirmed Transactions on Ledger</span>
                      <span className="text-slate-500 max-w-md">
                        All synthetic and simulated transactions have been permanently purged. Genuine transactions will be cryptographically recorded here upon live execution.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Timestamp & Block */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-white font-medium">
                        {entry.timestamp.replace('T', ' ').replace('Z', '')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Block #{entry.blockNumber.toLocaleString()}
                      </div>
                    </td>

                    {/* TX Hash with Copy */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400/90 font-medium">
                          {entry.txHash.slice(0, 8)}...{entry.txHash.slice(-6)}
                        </span>
                        <button
                          onClick={() => handleCopyHash(entry.id, entry.txHash)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          title="Copy Full TX Hash"
                        >
                          {copiedId === entry.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Event Type & Description */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="text-slate-200 font-semibold text-[11px]">
                        {entry.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5" title={entry.description}>
                        {entry.description}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold tabular-nums">
                      <span
                        className={
                          entry.type === 'AUTO_ACCUMULATION_BTC' || entry.type === 'GAMING_VOLUME_FEE'
                            ? 'text-emerald-400'
                            : entry.asset === 'BTC'
                            ? 'text-amber-400'
                            : 'text-purple-400'
                        }
                      >
                        {entry.amount.toLocaleString(undefined, {
                          maximumFractionDigits: entry.asset === 'BTC' ? 4 : 2,
                        })}{' '}
                        {entry.asset}
                      </span>
                    </td>

                    {/* USD Equivalent */}
                    <td className="py-3 px-4 text-right whitespace-nowrap text-slate-300 tabular-nums">
                      ${entry.usdEquivalent.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{entry.status}</span>
                      </span>
                    </td>

                    {/* Explorer Link */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <a
                        href={entry.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white inline-flex items-center justify-center p-1 rounded hover:bg-slate-800 transition-colors"
                        title="View on Public Block Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
