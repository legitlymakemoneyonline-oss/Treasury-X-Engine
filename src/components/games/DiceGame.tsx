import React, { useState } from 'react';
import { Play, Sparkles, ArrowRightLeft, ShieldCheck, Coins } from 'lucide-react';
import { rollDiceOutcome } from '../../services/provablyFair';
import { BetResult } from '../../types/games';
import { soundManager } from '../../services/soundEffects';

interface DiceGameProps {
  playerBalance: number;
  currency: 'POL' | 'USDT';
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  onBetPlaced: (result: BetResult) => void;
  incrementNonce: () => void;
  onOpenDeposit?: () => void;
}

export const DiceGame: React.FC<DiceGameProps> = ({
  playerBalance,
  currency,
  serverSeed,
  clientSeed,
  nonce,
  onBetPlaced,
  incrementNonce,
  onOpenDeposit,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [targetNumber, setTargetNumber] = useState<number>(50.0);
  const [isRollUnder, setIsRollUnder] = useState<boolean>(true);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rolledNumber, setRolledNumber] = useState<number | null>(null);
  const [isWon, setIsWon] = useState<boolean | null>(null);

  // House edge 2.0%
  const houseEdge = 0.02;
  const winChance = isRollUnder ? targetNumber : 100 - targetNumber;
  const multiplier = Number(((1 - houseEdge) * (100 / winChance)).toFixed(4));
  const potentialProfit = Number((betAmount * multiplier - betAmount).toFixed(2));

  const handleRollDice = async () => {
    if (isRolling || betAmount <= 0 || betAmount > playerBalance) return;

    setIsRolling(true);
    setRolledNumber(null);
    setIsWon(null);

    const outcome = await rollDiceOutcome(serverSeed, clientSeed, nonce);
    incrementNonce();

    // Roll animation
    let counter = 0;
    const interval = setInterval(() => {
      counter += 1;
      setRolledNumber(Math.floor(Math.random() * 10000) / 100);
      if (counter > 8) {
        clearInterval(interval);

        const roll = outcome.roll;
        setRolledNumber(roll);

        const won = isRollUnder ? roll < targetNumber : roll > targetNumber;
        setIsWon(won);
        setIsRolling(false);

        if (won) {
          if (multiplier >= 10) {
            soundManager.playJackpotBells();
          } else {
            soundManager.playHitNumberBell();
          }
        } else {
          soundManager.playBallTick();
        }

        const mult = won ? multiplier : 0;
        const payout = won ? betAmount * multiplier : 0;
        const profit = payout - betAmount;
        const houseFee = betAmount * houseEdge;

        onBetPlaced({
          id: `dice-${Date.now()}`,
          timestamp: new Date().toISOString(),
          game: 'DICE',
          betAmount,
          currency,
          multiplier: mult,
          payout,
          profit,
          houseFeeTreasury: houseFee,
          serverSeedHash: outcome.hash,
          clientSeed,
          nonce,
        });
      }
    }, 50);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
      {/* Left Control Panel */}
      <div className="lg:col-span-4 p-5 rounded-xl border border-slate-800 bg-[#090D17] space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Provably Fair Dice</span>
          </div>
          <span className="text-[10px] text-emerald-400">2.0% HOUSE EDGE</span>
        </div>

        {/* Bet Amount */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>BET AMOUNT ({currency})</span>
            <span>BALANCE: {playerBalance.toLocaleString()} {currency}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={playerBalance}
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
              disabled={isRolling}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-bold focus:border-cyan-400 focus:outline-none"
            />
            <button
              onClick={() => setBetAmount((b) => Math.max(1, Math.floor(b / 2)))}
              disabled={isRolling}
              className="px-2.5 py-2 bg-slate-850 hover:bg-slate-700 text-slate-300 rounded border border-slate-750"
            >
              ½
            </button>
            <button
              onClick={() => setBetAmount((b) => Math.min(playerBalance, b * 2))}
              disabled={isRolling}
              className="px-2.5 py-2 bg-slate-850 hover:bg-slate-700 text-slate-300 rounded border border-slate-750"
            >
              2×
            </button>
          </div>
        </div>

        {/* Win Metrics Breakdown */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500">MULTIPLIER:</span>
            <div className="text-amber-400 font-extrabold text-sm tabular-nums mt-0.5">
              {multiplier.toFixed(4)}×
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500">WIN CHANCE:</span>
            <div className="text-white font-extrabold text-sm tabular-nums mt-0.5">
              {winChance.toFixed(2)}%
            </div>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-850 flex justify-between">
            <span className="text-[10px] text-slate-400">POTENTIAL PROFIT:</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              +{potentialProfit.toLocaleString()} {currency}
            </span>
          </div>
        </div>

        {/* Roll Mode Toggle */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-400 text-[11px]">CONDITION</span>
          <button
            onClick={() => setIsRollUnder(!isRollUnder)}
            disabled={isRolling}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-850 hover:bg-slate-750 text-cyan-300 font-bold rounded border border-slate-700 transition-colors"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>{isRollUnder ? `Roll Under < ${targetNumber.toFixed(2)}` : `Roll Over > ${targetNumber.toFixed(2)}`}</span>
          </button>
        </div>

        {/* Roll Dice Button or Deposit Trigger */}
        {playerBalance === 0 ? (
          <button
            type="button"
            onClick={onOpenDeposit}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-slate-950 font-extrabold text-sm rounded shadow-lg shadow-cyan-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Coins className="w-4 h-4 fill-current" />
            <span>+ Add Balance to Play</span>
          </button>
        ) : (
          <button
            onClick={handleRollDice}
            disabled={isRolling || betAmount > playerBalance}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-slate-950 font-extrabold text-sm rounded shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isRolling ? 'Rolling Random Seed...' : 'Roll Dice'}</span>
          </button>
        )}
      </div>

      {/* Right Canvas: Animated Slider & Result Display */}
      <div className="lg:col-span-8 p-6 rounded-xl border border-slate-800 bg-[#070A0F] space-y-8 flex flex-col justify-center min-h-[360px]">
        {/* Large Result Roll Display */}
        <div className="text-center space-y-2">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            TARGET: {isRollUnder ? `< ${targetNumber.toFixed(2)}` : `> ${targetNumber.toFixed(2)}`}
          </span>

          <div
            className={`text-6xl font-extrabold tracking-tight tabular-nums transition-colors duration-200 ${
              rolledNumber === null
                ? 'text-slate-600'
                : isWon === true
                ? 'text-emerald-400'
                : isWon === false
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          >
            {rolledNumber !== null ? rolledNumber.toFixed(2) : '50.00'}
          </div>

          <div className="h-5">
            {isWon !== null && (
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isWon ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {isWon ? `WIN: +${potentialProfit} ${currency}` : `LOSS: -${betAmount} ${currency}`}
              </span>
            )}
          </div>
        </div>

        {/* Interactive Slider Bar */}
        <div className="space-y-4 px-4">
          <div className="relative pt-6 pb-2">
            {/* Visual bar container */}
            <div className="h-3 rounded-full bg-slate-900 border border-slate-800 relative overflow-hidden">
              {/* Green winning zone */}
              <div
                className="absolute top-0 bottom-0 bg-emerald-500/40 transition-all"
                style={{
                  left: isRollUnder ? '0%' : `${targetNumber}%`,
                  width: isRollUnder ? `${targetNumber}%` : `${100 - targetNumber}%`,
                }}
              />
              {/* Red losing zone */}
              <div
                className="absolute top-0 bottom-0 bg-rose-500/30 transition-all"
                style={{
                  left: isRollUnder ? `${targetNumber}%` : '0%',
                  width: isRollUnder ? `${100 - targetNumber}%` : `${targetNumber}%`,
                }}
              />
            </div>

            {/* Target Slider Input */}
            <input
              type="range"
              min="2"
              max="98"
              step="1"
              value={targetNumber}
              onChange={(e) => setTargetNumber(Number(e.target.value))}
              disabled={isRolling}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {/* Slider Thumb Handle */}
            <div
              className="absolute top-4 -translate-x-1/2 pointer-events-none transition-all flex flex-col items-center"
              style={{ left: `${targetNumber}%` }}
            >
              <div className="w-5 h-5 bg-amber-400 rounded-full border-2 border-slate-950 shadow-md shadow-amber-400/50 flex items-center justify-center" />
              <span className="text-[10px] font-bold text-amber-400 mt-1 tabular-nums">
                {targetNumber.toFixed(0)}
              </span>
            </div>

            {/* Rolled number indicator pip */}
            {rolledNumber !== null && (
              <div
                className="absolute top-0 -translate-x-1/2 pointer-events-none transition-all flex flex-col items-center"
                style={{ left: `${rolledNumber}%` }}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isWon ? 'bg-emerald-400 ring-4 ring-emerald-500/30' : 'bg-rose-500 ring-4 ring-rose-500/30'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Scale labels */}
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
