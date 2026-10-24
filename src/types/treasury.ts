export type AssetSymbol = 'BTC' | 'POL' | 'USDT';

export interface AssetPrice {
  symbol: AssetSymbol;
  name: string;
  usdPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

export interface TreasuryBalances {
  btcReserve: number;          // Cold Bitcoin Reserve balance
  polTreasury: number;         // Polygon Operational Treasury balance
  polQuestLiquidity: number;   // POL reserved for Quest Engine payouts
  polStaked: number;           // POL staked in validator yield
  pendingRevenueUsdt: number;  // Accumulated pending protocol revenue in USD
}

export type LedgerEventType = 
  | 'YIELD_SWEEP'
  | 'AUTO_ACCUMULATION_BTC'
  | 'QUEST_ENGINE_FUEL'
  | 'GAMING_VOLUME_FEE'
  | 'VALIDATOR_STAKING_REWARD'
  | 'STAKING_DELEGATION'
  | 'PLISIO_PAYOUT_DISPATCH'
  | 'COLD_VAULT_REBALANCE';

export interface LedgerEntry {
  id: string;
  timestamp: string;
  txHash: string;
  asset: AssetSymbol;
  amount: number;
  usdEquivalent: number;
  type: LedgerEventType;
  description: string;
  fromAddress: string;
  toAddress: string;
  status: 'AUDITED' | 'CONFIRMED' | 'PENDING_MULTISIG';
  blockNumber: number;
  explorerUrl: string;
  auditSignature?: string;
}

export interface LiquidityFlowNode {
  id: string;
  title: string;
  category: 'SOURCE' | 'AGGREGATOR' | 'DESTINATION' | 'FUEL';
  amountText: string;
  description: string;
  active: boolean;
  pulseIntensity: number;
  coordinates: { x: number; y: number };
}

export interface ForecastProjection {
  periodDays: number;
  label: string;
  projectedBtc: number;
  projectedPol: number;
  projectedNetWorthUsd: number;
  accumulatedBtcUsd: number;
  earnedYieldUsd: number;
}

export interface PlisioPayoutPayload {
  currency: string;
  amount: string;
  to: string;
  hash: string;
  secretKeyMasked?: string;
  createdAt: string;
}

export interface OnChainAuditTarget {
  network: 'BITCOIN_MAINNET' | 'POLYGON_POS';
  asset: AssetSymbol;
  address: string;
  label: string;
  quorum: string;
  storageType: 'COLD_AIRGAPPED' | 'SMART_CONTRACT_SAFE';
  lastVerifiedBlock: number;
  isVerified: boolean;
}
