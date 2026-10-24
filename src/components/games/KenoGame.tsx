import React, { useState } from 'react';
import { Play, Sparkles, Trash2, Wand2, Coins } from 'lucide-react';
import { rollKenoOutcome } from '../../services/provablyFair';
import { BetResult } from '../../types/games';
import { soundManager } from '../../services/soundEffects';

interface KenoGameProps {
  playerBalance: number;
  currency: 'POL' | 'USDT';
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  onBetPlaced: (result: BetResult) => void;
  incrementNonce: () => void;
  onOpenDeposit?: () => void;
}

// Multiplier table based on (total numbers picked) -> (hits)
const KENO_PAYTABLE: Record<number, Record<number, number>> = {
  1: { 1: 3.8 },
  2: { 1: 1.0, 2: 9.0 },
  3: { 2: 2.5, 3: 26.0 },
  4: { 2: 1.5, 3: 5.0, 4: 80.0 },
  5: { 2: 1.0, 3: 3.0, 4: 15.0, 5: 300.0 },
  6: { 3: 2.0, 4: 7.0, 5: 60.0, 6: 700.0 },
  7: { 3: 1.5, 4: 5.0, 5: 25.0, 6: 150.0, 7: 1500.0 },
  8: { 4: 3.0, 5: 12.0, 6: 70.0, 7: 400.0, 8: 3000.0 },
  9: { 4: 2.0, 5: 8.0, 6: 35.0, 7: 150.0, 8: 1000.0, 9: 5000.0 },
  10: { 4: 1.5, 5: 5.0, 6: 20.0, 7: 80.0, 8: 400.0, 9: 2000.0, 10: 10000.0 },
};

export const KenoGame: React.FC<KenoGameProps> = ({
  playerBalance,
  currency,
  serverSeed,
  clientSeed,
  nonce,
  onBetPlaced,
  incrementNonce,
  onOpenDeposit,
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([7, 14, 21, 28, 35]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastHitsCount, setLastHitsCount] = useState<number | null>(null);
  const [lastWinMultiplier, setLastWinMultiplier] = useState<number | null>(null);

  const totalNumbers = 40;

  const toggleNumber = (num: number) => {
    if (isPlaying) return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length < 10) {
        setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  const handleAutoPick = (count = 5) => {
    if (isPlaying) return;
    const pool = Array.from({ length: totalNumbers }, (_, i) => i + 1);
    const picks: number[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    setSelectedNumbers(picks.sort((a, b) => a - b));
  };

  const handleClear = () => {
    if (isPlaying) return;
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setLastHitsCount(null);
  };

  const handlePlayKeno = async () => {
    if (isPlaying || selectedNumbers.length === 0 || betAmount <= 0 || betAmount > playerBalance)
      return;

    setIsPlaying(true);
    setDrawnNumbers([]);
    setLastHitsCount(null);
    setLastWinMultiplier(null);

    const outcome = await rollKenoOutcome(serverSeed, clientSeed, nonce, 10, totalNumbers);
    incrementNonce();

    // Sequentially reveal 10 balls
    const revealed: number[] = [];
    let i = 0;

    const interval = setInterval(() => {
      if (i < outcome.winningNumbers.length) {
        const ball = outcome.winningNumbers[i];
        revealed.push(ball);
        setDrawnNumbers([...revealed]);

        // Crisp bell sound whenever a drawn ball hits the player's selected number
        if (selectedNumbers.includes(ball)) {
          soundManager.playHitNumberBell();
        } else {
          soundManager.playBallTick();
        }

        i++;
      } else {
        clearInterval(interval);

        // Calculate hits
        const matches = selectedNumbers.filter((n) => outcome.winningNumbers.includes(n));
        const hits = matches.length;
        const payRow = KENO_PAYTABLE[selectedNumbers.length] || {};
        const mult = payRow[hits] || 0;
        const payout = betAmount * mult;
        const profit = payout - betAmount;
        const houseFee = betAmount * 0.02;

        setLastHitsCount(hits);
        setLastWinMultiplier(mult);
        setIsPlaying(false);

        // Sound chime for win or jackpot
        if (mult >= 15) {
          soundManager.playJackpotBells();
        } else if (profit > 0) {
          soundManager.playWinChime();
        }

        onBetPlaced({
          id: `keno-${Date.now()}`,
          timestamp: new Date().toISOString(),
          game: 'KENO',
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
    }, 140);
  };

  const currentPaytable = KENO_PAYTABLE[selectedNumbers.length] || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
      {/* Left Control Panel */}
      <div className="lg:col-span-4 p-5 rounded-xl border border-slate-800 bg-[#090D17] space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Keno Protocol Engine</span>
          </div>
          <span className="text-[10px] text-emerald-400">10 of 40 Draw</span>
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
              disabled={isPlaying}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-bold focus:border-purple-400 focus:outline-none"
            />
            <button
              onClick={() => setBetAmount((b) => Math.max(1, Math.floor(b / 2)))}
              disabled={isPlaying}
              className="px-2.5 py-2 bg-slate-850 hover:bg-slate-700 text-slate-300 rounded border border-slate-750"
            >
              ½
            </button>
            <button
              onClick={() => setBetAmount((b) => Math.min(playerBalance, b * 2))}
              disabled={isPlaying}
              className="px-2.5 py-2 bg-slate-850 hover:bg-slate-700 text-slate-300 rounded border border-slate-750"
            >
              2×
            </button>
          </div>
        </div>

        {/* Pick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleAutoPick(5)}
            disabled={isPlaying}
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded flex items-center justify-center gap-1 text-[11px]"
          >
            <Wand2 className="w-3 h-3 text-purple-400" />
            <span>Pick 5</span>
          </button>
          <button
            onClick={() => handleAutoPick(10)}
            disabled={isPlaying}
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded flex items-center justify-center gap-1 text-[11px]"
          >
            <Wand2 className="w-3 h-3 text-purple-400" />
            <span>Pick 10</span>
          </button>
          <button
            onClick={handleClear}
            disabled={isPlaying}
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded flex items-center justify-center gap-1 text-[11px]"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>Clear</span>
          </button>
        </div>

        {/* Dynamic Payout Table */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold border-b border-slate-800/80 pb-1.5">
            <span>HITS ({selectedNumbers.length} PICKED)</span>
            <span>MULTIPLIER</span>
          </div>

          <div className="max-h-28 overflow-y-auto space-y-1">
            {Object.keys(currentPaytable).length === 0 ? (
              <div className="text-[10px] text-slate-500 py-2 text-center">
                Select 1 to 10 numbers to view payouts.
              </div>
            ) : (
              Object.entries(currentPaytable).map(([hits, mult]) => {
                const isCurrentHit = lastHitsCount === Number(hits);
                return (
                  <div
                    key={hits}
                    className={`flex justify-between py-0.5 px-1.5 rounded text-[11px] tabular-nums ${
                      isCurrentHit
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>{hits} Hits</span>
                    <span className="text-amber-400 font-bold">{mult}×</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Result banner */}
        {lastHitsCount !== null && lastWinMultiplier !== null && (
          <div
            className={`p-3 rounded text-center border ${
              lastWinMultiplier > 0
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <div className="font-bold text-sm">
              {lastHitsCount} Hits · {lastWinMultiplier}× Multiplier
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Payout: {(betAmount * lastWinMultiplier).toFixed(2)} {currency}
            </div>
          </div>
        )}

        {/* Play Button or Deposit Trigger */}
        {playerBalance === 0 ? (
          <button
            type="button"
            onClick={onOpenDeposit}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-amber-400 hover:from-purple-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm rounded shadow-lg shadow-purple-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Coins className="w-4 h-4 fill-current" />
            <span>+ Add Balance to Play</span>
          </button>
        ) : (
          <button
            onClick={handlePlayKeno}
            disabled={isPlaying || selectedNumbers.length === 0 || betAmount > playerBalance}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-amber-400 hover:from-purple-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm rounded shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isPlaying ? 'Drawing 10 Balls...' : `Play Keno (${selectedNumbers.length} Picks)`}</span>
          </button>
        )}
      </div>

      {/* Right Canvas: 40 Ball Grid */}
      <div className="lg:col-span-8 p-6 rounded-xl border border-slate-800 bg-[#070A0F] space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>SELECT 1 TO 10 NUMBERS FROM THE 40-BALL MATRIX:</span>
          <span className="text-amber-400 font-bold">{selectedNumbers.length}/10 Selected</span>
        </div>

        {/* 40 Numbers Grid (8 columns x 5 rows) */}
        <div className="grid grid-cols-8 gap-2.5">
          {Array.from({ length: totalNumbers }, (_, i) => i + 1).map((num) => {
            const isSelected = selectedNumbers.includes(num);
            const isDrawn = drawnNumbers.includes(num);
            const isHit = isSelected && isDrawn;

            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={isPlaying}
                className={`h-11 sm:h-12 rounded-lg font-mono font-bold text-sm transition-all flex items-center justify-center relative border ${
                  isHit
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/40 scale-105'
                    : isDrawn
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                    : isSelected
                    ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-500/20'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span>{num}</span>
                {isHit && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Drawn Numbers Row */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">DRAWN BALLS (10):</span>
            <div className="flex flex-wrap gap-1.5">
              {drawnNumbers.length === 0 ? (
                <span className="text-slate-600 italic">Waiting for round draw...</span>
              ) : (
                drawnNumbers.map((d, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      selectedNumbers.includes(d)
                        ? 'bg-emerald-400 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {d}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
