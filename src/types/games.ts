export type GameType = 'PLINKO' | 'KENO' | 'DICE' | 'ROULETTE';

export interface BetResult {
  id: string;
  timestamp: string;
  game: GameType;
  betAmount: number;
  currency: 'POL' | 'USDT';
  multiplier: number;
  payout: number;
  profit: number;
  houseFeeTreasury: number; // protocol cut routed directly to TiggyBank Treasury
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface PlinkoRowConfig {
  rows: number;
  multipliers: number[];
}

export interface KenoPaytable {
  [selectedCount: number]: {
    [hits: number]: number; // multiplier
  };
}

export interface RouletteBet {
  type: 'STRAIGHT' | 'RED' | 'BLACK' | 'EVEN' | 'ODD' | 'LOW' | 'HIGH' | 'DOZEN_1' | 'DOZEN_2' | 'DOZEN_3';
  value?: number; // for straight bet number 0-36
  amount: number;
}
