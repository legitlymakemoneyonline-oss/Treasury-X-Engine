import React, { useState } from 'react';
import { Play, RotateCcw, Sparkles, Coins } from 'lucide-react';
import { rollRouletteOutcome } from '../../services/provablyFair';
import { BetResult, RouletteBet } from '../../types/games';
import { soundManager } from '../../services/soundEffects';

interface RouletteGameProps {
  playerBalance: number;
  currency: 'POL' | 'USDT';
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  onBetPlaced: (result: BetResult) => void;
  incrementNonce: () => void;
  onOpenDeposit?: () => void;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Standard European roulette wheel sequence
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const RouletteGame: React.FC<RouletteGameProps> = ({
  playerBalance,
  currency,
  serverSeed,
  clientSeed,
  nonce,
  onBetPlaced,
  incrementNonce,
  onOpenDeposit,
}) => {
  const [chipSize, setChipSize] = useState<number>(10);
  const [bets, setBets] = useState<RouletteBet[]>([
    { type: 'RED', amount: 10 },
  ]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [winningPocket, setWinningPocket] = useState<number | null>(null);
  const [winningColor, setWinningColor] = useState<'RED' | 'BLACK' | 'GREEN' | null>(null);
  const [lastPayout, setLastPayout] = useState<number | null>(null);

  const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  const addBet = (bet: RouletteBet) => {
    if (isSpinning) return;
    if (totalBetAmount + bet.amount > playerBalance) return;

    setBets((prev) => {
      // If bet of same type/value exists, increment amount
      const existingIdx = prev.findIndex(
        (b) => b.type === bet.type && (bet.type !== 'STRAIGHT' || b.value === bet.value)
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].amount += bet.amount;
        return next;
      }
      return [...prev, bet];
    });
  };

  const clearBets = () => {
    if (isSpinning) return;
    setBets([]);
    setWinningPocket(null);
  };

  const handleSpinRoulette = async () => {
    if (isSpinning || totalBetAmount <= 0 || totalBetAmount > playerBalance) return;

    setIsSpinning(true);
    setWinningPocket(null);
    setWinningColor(null);
    setLastPayout(null);

    const outcome = await rollRouletteOutcome(serverSeed, clientSeed, nonce);
    incrementNonce();

    // Wheel spin calculation: find index of pocket on wheel
    const pocketIndex = WHEEL_NUMBERS.indexOf(outcome.pocket);
    const degreesPerPocket = 360 / 37;
    // Extra rotations (e.g. 5 full spins = 1800 deg)
    const targetDeg = 1800 + (360 - pocketIndex * degreesPerPocket);

    setWheelRotation((prev) => prev + targetDeg);

    setTimeout(() => {
      setWinningPocket(outcome.pocket);
      setWinningColor(outcome.color);
      setIsSpinning(false);

      // Evaluate bets
      let totalPayout = 0;
      bets.forEach((bet) => {
        let won = false;
        let mult = 0;

        if (bet.type === 'STRAIGHT' && bet.value === outcome.pocket) {
          won = true;
          mult = 36;
        } else if (bet.type === 'RED' && outcome.color === 'RED') {
          won = true;
          mult = 2;
        } else if (bet.type === 'BLACK' && outcome.color === 'BLACK') {
          won = true;
          mult = 2;
        } else if (bet.type === 'EVEN' && outcome.pocket !== 0 && outcome.pocket % 2 === 0) {
          won = true;
          mult = 2;
        } else if (bet.type === 'ODD' && outcome.pocket !== 0 && outcome.pocket % 2 !== 0) {
          won = true;
          mult = 2;
        } else if (bet.type === 'LOW' && outcome.pocket >= 1 && outcome.pocket <= 18) {
          won = true;
          mult = 2;
        } else if (bet.type === 'HIGH' && outcome.pocket >= 19 && outcome.pocket <= 36) {
          won = true;
          mult = 2;
        } else if (bet.type === 'DOZEN_1' && outcome.pocket >= 1 && outcome.pocket <= 12) {
          won = true;
          mult = 3;
        } else if (bet.type === 'DOZEN_2' && outcome.pocket >= 13 && outcome.pocket <= 24) {
          won = true;
          mult = 3;
        } else if (bet.type === 'DOZEN_3' && outcome.pocket >= 25 && outcome.pocket <= 36) {
          won = true;
          mult = 3;
        }

        if (won) {
          totalPayout += bet.amount * mult;
        }
      });

      const profit = totalPayout - totalBetAmount;
      const effectiveMultiplier = totalBetAmount > 0 ? totalPayout / totalBetAmount : 0;
      const houseFee = totalBetAmount * 0.027; // European roulette 2.7% house edge

      setLastPayout(totalPayout);

      // Play bell chime: if player hit a straight-up number or won payout
      const hitStraightNumber = bets.some((b) => b.type === 'STRAIGHT' && b.value === outcome.pocket);
      if (hitStraightNumber) {
        soundManager.playJackpotBells();
      } else if (totalPayout > 0) {
        soundManager.playWinChime();
      } else {
        soundManager.playHitNumberBell(0.85); // Single settling bell when pocket lands
      }

      onBetPlaced({
        id: `roulette-${Date.now()}`,
        timestamp: new Date().toISOString(),
        game: 'ROULETTE',
        betAmount: totalBetAmount,
        currency,
        multiplier: Number(effectiveMultiplier.toFixed(2)),
        payout: totalPayout,
        profit,
        houseFeeTreasury: houseFee,
        serverSeedHash: outcome.hash,
        clientSeed,
        nonce,
      });
    }, 3200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
      {/* Left Control Panel */}
      <div className="lg:col-span-4 p-5 rounded-xl border border-slate-800 bg-[#090D17] space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>European Roulette</span>
          </div>
          <span className="text-[10px] text-emerald-400">2.7% Single Zero</span>
        </div>

        {/* Chip Selection */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>SELECT CHIP DENOMINATION</span>
            <span>BALANCE: {playerBalance.toLocaleString()} {currency}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 25, 100].map((val) => (
              <button
                key={val}
                onClick={() => setChipSize(val)}
                disabled={isSpinning}
                className={`py-2 rounded font-bold border transition-colors ${
                  chipSize === val
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {val} {currency}
              </button>
            ))}
          </div>
        </div>

        {/* Active Bets Summary */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[11px] text-slate-400 border-b border-slate-800 pb-1">
            <span>ACTIVE BETS ({bets.length})</span>
            <button
              onClick={clearBets}
              disabled={isSpinning}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="max-h-24 overflow-y-auto space-y-1">
            {bets.length === 0 ? (
              <div className="text-[10px] text-slate-500 py-1 text-center">
                Click chips on the board to place bets.
              </div>
            ) : (
              bets.map((b, idx) => (
                <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                  <span>
                    {b.type === 'STRAIGHT' ? `Single #${b.value}` : b.type.replace('_', ' ')}
                  </span>
                  <span className="text-amber-400 font-bold">{b.amount} {currency}</span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-850 flex justify-between font-bold text-white text-xs">
            <span>TOTAL STAKE:</span>
            <span className="text-amber-400 tabular-nums">{totalBetAmount} {currency}</span>
          </div>
        </div>

        {/* Win Banner */}
        {winningPocket !== null && (
          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400">WINNING POCKET:</span>
            <div
              className={`text-2xl font-extrabold ${
                winningColor === 'RED'
                  ? 'text-rose-400'
                  : winningColor === 'BLACK'
                  ? 'text-slate-100'
                  : 'text-emerald-400'
              }`}
            >
              {winningPocket} ({winningColor})
            </div>
            {lastPayout !== null && (
              <div className="text-[11px] text-emerald-400 font-bold">
                Payout: {lastPayout.toFixed(2)} {currency}
              </div>
            )}
          </div>
        )}

        {/* Spin Wheel Button or Deposit Trigger */}
        {playerBalance === 0 ? (
          <button
            type="button"
            onClick={onOpenDeposit}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm rounded shadow-lg shadow-rose-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Coins className="w-4 h-4 fill-current" />
            <span>+ Add Balance to Play</span>
          </button>
        ) : (
          <button
            onClick={handleSpinRoulette}
            disabled={isSpinning || totalBetAmount <= 0 || totalBetAmount > playerBalance}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm rounded shadow-lg shadow-rose-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isSpinning ? 'Wheel Spinning...' : `Spin Wheel (${totalBetAmount} ${currency})`}</span>
          </button>
        )}
      </div>

      {/* Right Canvas: Wheel and Betting Grid */}
      <div className="lg:col-span-8 p-6 rounded-xl border border-slate-800 bg-[#070A0F] space-y-6 flex flex-col items-center">
        {/* Animated Roulette Wheel Graphic */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52">
          {/* Wheel Disc */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-500/40 shadow-xl shadow-amber-500/10 transition-transform duration-[3200ms] ease-out flex items-center justify-center relative overflow-hidden"
            style={{
              transform: `rotate(${wheelRotation}deg)`,
              background: 'conic-gradient(#dc2626 0deg 9.7deg, #0f172a 9.7deg 19.4deg, #dc2626 19.4deg 29.1deg, #0f172a 29.1deg 38.8deg, #dc2626 38.8deg 48.5deg, #0f172a 48.5deg 58.2deg, #dc2626 58.2deg 67.9deg, #0f172a 67.9deg 77.6deg, #dc2626 77.6deg 87.3deg, #0f172a 87.3deg 97deg, #dc2626 97deg 106.7deg, #0f172a 106.7deg 116.4deg, #dc2626 116.4deg 126.1deg, #0f172a 126.1deg 135.8deg, #dc2626 135.8deg 145.5deg, #0f172a 145.5deg 155.2deg, #dc2626 155.2deg 164.9deg, #0f172a 164.9deg 174.6deg, #10b981 174.6deg 184.3deg, #dc2626 184.3deg 194deg, #0f172a 194deg 203.7deg, #dc2626 203.7deg 213.4deg, #0f172a 213.4deg 223.1deg, #dc2626 223.1deg 232.8deg, #0f172a 232.8deg 242.5deg, #dc2626 242.5deg 252.2deg, #0f172a 252.2deg 261.9deg, #dc2626 261.9deg 271.6deg, #0f172a 271.6deg 281.3deg, #dc2626 281.3deg 291deg, #0f172a 291deg 300.7deg, #dc2626 300.7deg 310.4deg, #0f172a 310.4deg 320.1deg, #dc2626 320.1deg 329.8deg, #0f172a 329.8deg 339.5deg, #dc2626 339.5deg 349.2deg, #0f172a 349.2deg 360deg)',
            }}
          >
            {/* Inner Center Hub */}
            <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-amber-400/80 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-400 font-bold">ROULETTE</span>
              <span className="text-amber-400 font-extrabold text-sm">37 POCKET</span>
            </div>
          </div>

          {/* Top Pointer Indicator */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-5 bg-amber-400 clip-triangle shadow-md z-10" />
        </div>

        {/* Betting Board Layout */}
        <div className="w-full space-y-2">
          {/* Outside Bets (Red/Black/Even/Odd/Dozens) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => addBet({ type: 'RED', amount: chipSize })}
              disabled={isSpinning}
              className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded border border-rose-400/60 shadow-sm transition-all"
            >
              RED (1:1)
            </button>
            <button
              onClick={() => addBet({ type: 'BLACK', amount: chipSize })}
              disabled={isSpinning}
              className="py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold rounded border border-slate-700 shadow-sm transition-all"
            >
              BLACK (1:1)
            </button>
            <button
              onClick={() => addBet({ type: 'EVEN', amount: chipSize })}
              disabled={isSpinning}
              className="py-2.5 bg-slate-850 hover:bg-slate-750 text-slate-200 font-bold rounded border border-slate-700 transition-all"
            >
              EVEN (1:1)
            </button>
            <button
              onClick={() => addBet({ type: 'ODD', amount: chipSize })}
              disabled={isSpinning}
              className="py-2.5 bg-slate-850 hover:bg-slate-750 text-slate-200 font-bold rounded border border-slate-700 transition-all"
            >
              ODD (1:1)
            </button>
          </div>

          {/* Dozens */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => addBet({ type: 'DOZEN_1', amount: chipSize })}
              disabled={isSpinning}
              className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded border border-slate-800 text-[11px]"
            >
              1st 12 (2:1)
            </button>
            <button
              onClick={() => addBet({ type: 'DOZEN_2', amount: chipSize })}
              disabled={isSpinning}
              className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded border border-slate-800 text-[11px]"
            >
              2nd 12 (2:1)
            </button>
            <button
              onClick={() => addBet({ type: 'DOZEN_3', amount: chipSize })}
              disabled={isSpinning}
              className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded border border-slate-800 text-[11px]"
            >
              3rd 12 (2:1)
            </button>
          </div>

          {/* Straight Numbers Grid (0 to 36) */}
          <div className="pt-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
              STRAIGHT BETS (35:1 PAYOUT):
            </span>
            <div className="grid grid-cols-12 sm:grid-cols-13 gap-1">
              {/* Zero */}
              <button
                onClick={() => addBet({ type: 'STRAIGHT', value: 0, amount: chipSize })}
                disabled={isSpinning}
                className="py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                0
              </button>

              {/* 1 to 36 */}
              {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => {
                const isRed = RED_NUMBERS.includes(num);
                const hasBet = bets.some((b) => b.type === 'STRAIGHT' && b.value === num);
                return (
                  <button
                    key={num}
                    onClick={() => addBet({ type: 'STRAIGHT', value: num, amount: chipSize })}
                    disabled={isSpinning}
                    className={`py-2 rounded font-bold text-xs transition-all relative ${
                      hasBet
                        ? 'ring-2 ring-amber-400 bg-amber-400 text-slate-950'
                        : isRed
                        ? 'bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-800/60'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
