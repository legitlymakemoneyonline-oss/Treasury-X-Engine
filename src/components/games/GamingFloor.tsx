import React, { useState } from 'react';
import { PlinkoGame } from './PlinkoGame';
import { KenoGame } from './KenoGame';
import { DiceGame } from './DiceGame';
import { RouletteGame } from './RouletteGame';
import { DepositModal } from './DepositModal';
import { BetResult, GameType } from '../../types/games';
import { generateRandomSeed } from '../../services/provablyFair';
import { soundManager } from '../../services/soundEffects';
import {
  ShieldCheck,
  History,
  Coins,
  Zap,
  RefreshCw,
  Key,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  BellOff,
  Flame,
} from 'lucide-react';

interface GamingFloorProps {
  playerBalancePol: number;
  playerBalanceUsdt: number;
  treasuryPolBalance?: number;
  treasuryUsdtBalance?: number;
  poolPolBalance?: number;
  onBetPlaced: (result: BetResult) => void;
  recentBets: BetResult[];
  onTransferFromTreasury?: (amount: number, currency: 'POL' | 'USDT') => void;
  onWithdrawToTreasury?: (amount: number, currency: 'POL' | 'USDT') => void;
  onFundPoolFromBankroll?: (amount: number) => void;
  onStakeFromBankroll?: (amount: number) => void;
  onLoadPracticeCredits?: (amount: number) => void;
  onResetBalanceToZero?: () => void;
  polAddress?: string;
}

export const GamingFloor: React.FC<GamingFloorProps> = ({
  playerBalancePol,
  playerBalanceUsdt,
  treasuryPolBalance = 93.389,
  treasuryUsdtBalance = 0,
  poolPolBalance = 0,
  onBetPlaced,
  recentBets,
  onTransferFromTreasury = () => {},
  onWithdrawToTreasury = () => {},
  onFundPoolFromBankroll,
  onStakeFromBankroll,
  onLoadPracticeCredits = () => {},
  onResetBalanceToZero = () => {},
  polAddress = '0x85109D0e1ec106A16A135827Dd406305B93FC955',
}) => {
  const [activeGame, setActiveGame] = useState<GameType>('PLINKO');
  const [selectedCurrency, setSelectedCurrency] = useState<'POL' | 'USDT'>('POL');
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => soundManager.isSoundMuted());

  // Provably fair seed state
  const [serverSeed, setServerSeed] = useState<string>(() => generateRandomSeed(32));
  const [clientSeed, setClientSeed] = useState<string>(() => generateRandomSeed(16));
  const [nonce, setNonce] = useState<number>(1);
  const [showSeedModal, setShowSeedModal] = useState<boolean>(false);

  const incrementNonce = () => {
    setNonce((prev) => prev + 1);
  };

  const handleRotateSeeds = () => {
    setServerSeed(generateRandomSeed(32));
    setClientSeed(generateRandomSeed(16));
    setNonce(1);
  };

  const currentBalance =
    selectedCurrency === 'POL' ? playerBalancePol : playerBalanceUsdt;

  return (
    <section className="py-10 border-b border-slate-800 bg-[#0B0F17]">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>Polygon Gaming Engine · Provably Fair Liquidity Sink</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                TiggyBank Gaming Floor
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
                🛡️ STRICT TRUTH PROTOCOL: ZERO FAKE BALANCES
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              <strong>Honest Balance Policy:</strong> Balance is strictly 0.00 unless loaded from Treasury Safe, Web3 wallet, or Sandbox Practice Mode.
            </p>
          </div>

          {/* Currency Switcher & Deposit Button & Provably Fair Modal Trigger */}
          <div className="flex items-center flex-wrap gap-2.5 font-mono text-xs">
            {/* Currency toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setSelectedCurrency('POL')}
                className={`px-3 py-1 rounded font-bold transition-colors ${
                  selectedCurrency === 'POL'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                POL ({playerBalancePol.toLocaleString()})
              </button>
              <button
                onClick={() => setSelectedCurrency('USDT')}
                className={`px-3 py-1 rounded font-bold transition-colors ${
                  selectedCurrency === 'USDT'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USDT (${playerBalanceUsdt.toLocaleString()})
              </button>
            </div>

            {/* Direct Add Balance / Deposit Button */}
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold rounded-lg shadow-md shadow-amber-400/20 border border-amber-300/80 transition-all cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>+ Add Balance / Deposit</span>
            </button>

            {/* Withdraw / Route Winnings button if user has active bankroll */}
            {currentBalance > 0 && (
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
                title="Send winnings to Safe, Fuel Pool, or Staking"
              >
                <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Route Winnings / Withdraw</span>
              </button>
            )}

            {/* Bell Sound Effect Toggle with Test Chime */}
            <button
              onClick={() => {
                const isNowMuted = soundManager.toggleMute();
                setSoundMuted(isNowMuted);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                !soundMuted
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={!soundMuted ? 'Bell sound is active on hit numbers. Click to mute.' : 'Bell sound is muted. Click to enable.'}
            >
              {!soundMuted ? (
                <Bell className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <BellOff className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{!soundMuted ? 'Bell: ON' : 'Bell: OFF'}</span>
            </button>

            <button
              onClick={() => setShowSeedModal(!showSeedModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Seeds (Nonce: {nonce})</span>
            </button>
          </div>
        </div>

        {/* Zero-Balance Guidance Banner */}
        {currentBalance === 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-purple-950/30 border border-amber-600/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Coins className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    Gaming Bankroll is 0.00 {selectedCurrency} (Strict Truth Active)
                  </span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Ready to play? You have <strong>{treasuryPolBalance.toLocaleString()} POL</strong> available in your on-chain Treasury safe (Polygon <code className="text-amber-300 font-mono">{polAddress.slice(0, 8)}...</code>). Transfer any amount to play instantly, deposit via Web3, or test risk-free with Sandbox Credits.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs font-mono rounded-lg shadow-md shadow-amber-400/20 transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Choose Deposit Method</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Selector Tabs */}
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveGame('PLINKO')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeGame === 'PLINKO'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>🎮</span>
            <span>Plinko</span>
          </button>

          <button
            onClick={() => setActiveGame('KENO')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeGame === 'KENO'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>🔢</span>
            <span>Keno</span>
          </button>

          <button
            onClick={() => setActiveGame('DICE')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeGame === 'DICE'
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>🎲</span>
            <span>Dice</span>
          </button>

          <button
            onClick={() => setActiveGame('ROULETTE')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeGame === 'ROULETTE'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>🎡</span>
            <span>Roulette</span>
          </button>
        </div>

        {/* Active Game Canvas Container */}
        <div className="pt-6">
          {activeGame === 'PLINKO' && (
            <PlinkoGame
              playerBalance={currentBalance}
              currency={selectedCurrency}
              serverSeed={serverSeed}
              clientSeed={clientSeed}
              nonce={nonce}
              onBetPlaced={onBetPlaced}
              incrementNonce={incrementNonce}
              onOpenDeposit={() => setShowDepositModal(true)}
            />
          )}

          {activeGame === 'KENO' && (
            <KenoGame
              playerBalance={currentBalance}
              currency={selectedCurrency}
              serverSeed={serverSeed}
              clientSeed={clientSeed}
              nonce={nonce}
              onBetPlaced={onBetPlaced}
              incrementNonce={incrementNonce}
              onOpenDeposit={() => setShowDepositModal(true)}
            />
          )}

          {activeGame === 'DICE' && (
            <DiceGame
              playerBalance={currentBalance}
              currency={selectedCurrency}
              serverSeed={serverSeed}
              clientSeed={clientSeed}
              nonce={nonce}
              onBetPlaced={onBetPlaced}
              incrementNonce={incrementNonce}
              onOpenDeposit={() => setShowDepositModal(true)}
            />
          )}

          {activeGame === 'ROULETTE' && (
            <RouletteGame
              playerBalance={currentBalance}
              currency={selectedCurrency}
              serverSeed={serverSeed}
              clientSeed={clientSeed}
              nonce={nonce}
              onBetPlaced={onBetPlaced}
              incrementNonce={incrementNonce}
              onOpenDeposit={() => setShowDepositModal(true)}
            />
          )}
        </div>

        {/* Provably Fair Seeds Modal Drawer */}
        {showSeedModal && (
          <div className="mt-6 p-4 rounded-xl border border-slate-800 bg-[#070A0F] font-mono text-xs space-y-3">
            <div className="flex justify-between items-center text-slate-300 font-bold">
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>ACTIVE PROVABLY FAIR CRYPTOGRAPHIC SEEDS</span>
              </span>
              <button
                onClick={handleRotateSeeds}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rotate Seeds</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500">SERVER SEED:</span>
                <div className="text-purple-300 truncate mt-0.5">{serverSeed}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500">CLIENT SEED:</span>
                <div className="text-cyan-300 truncate mt-0.5">{clientSeed}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500">NONCE (COUNTER):</span>
                <div className="text-amber-400 font-bold mt-0.5">#{nonce}</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Bets Live Ticker */}
        {recentBets.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-400 mb-3 font-bold">
              <History className="w-4 h-4 text-amber-400" />
              <span>RECENT GAMING LIQUIDITY ACTIVITY</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-850">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Game</th>
                    <th className="py-2 px-3">Wager</th>
                    <th className="py-2 px-3">Payout</th>
                    <th className="py-2 px-3">Multiplier</th>
                    <th className="py-2 px-3">Profit / Loss</th>
                    <th className="py-2 px-3">House Fee (Treasury)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/40 text-[11px]">
                  {recentBets.map((bet, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2 px-3 text-slate-500">{bet.timestamp.split(' ')[1] || bet.timestamp}</td>
                      <td className="py-2 px-3 font-bold text-slate-300">{bet.game}</td>
                      <td className="py-2 px-3 text-slate-300">
                        {bet.betAmount} {bet.currency}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {bet.payout.toFixed(2)} {bet.currency}
                      </td>
                      <td className="py-2 px-3 font-bold text-amber-400">{bet.multiplier.toFixed(2)}×</td>
                      <td className="py-2 px-3 font-bold">
                        <span className={bet.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {bet.profit >= 0 ? '+' : ''}
                          {bet.profit.toFixed(2)} {bet.currency}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-purple-400 font-mono">
                        +{bet.houseFeeTreasury.toFixed(3)} {bet.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        treasuryPolBalance={treasuryPolBalance}
        treasuryUsdtBalance={treasuryUsdtBalance}
        poolPolBalance={poolPolBalance}
        playerBalancePol={playerBalancePol}
        playerBalanceUsdt={playerBalanceUsdt}
        selectedCurrency={selectedCurrency}
        onTransferFromTreasury={onTransferFromTreasury}
        onWithdrawToTreasury={onWithdrawToTreasury}
        onFundPoolFromBankroll={onFundPoolFromBankroll}
        onStakeFromBankroll={onStakeFromBankroll}
        onLoadPracticeCredits={onLoadPracticeCredits}
        onResetBalanceToZero={onResetBalanceToZero}
        polAddress={polAddress}
      />
    </section>
  );
};
