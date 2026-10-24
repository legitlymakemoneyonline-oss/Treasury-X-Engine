import React, { useState, useRef, useEffect } from 'react';
import { Play, Sparkles, Shield, RotateCcw, Coins } from 'lucide-react';
import { rollPlinkoOutcome } from '../../services/provablyFair';
import { BetResult } from '../../types/games';
import { soundManager } from '../../services/soundEffects';

interface PlinkoGameProps {
  playerBalance: number;
  currency: 'POL' | 'USDT';
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  onBetPlaced: (result: BetResult) => void;
  incrementNonce: () => void;
  onOpenDeposit?: () => void;
}

export const PlinkoGame: React.FC<PlinkoGameProps> = ({
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
  const [risk, setRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [lastWinMultiplier, setLastWinMultiplier] = useState<number | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null);

  // Animated ball position state
  const [ballPos, setBallPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 200,
    y: 20,
    visible: false,
  });

  const rows = 10;
  const multipliersByRisk = {
    LOW: [5.6, 2.0, 1.4, 1.0, 0.7, 0.5, 0.7, 1.0, 1.4, 2.0, 5.6],
    MEDIUM: [13.0, 3.0, 1.3, 0.7, 0.4, 0.2, 0.4, 0.7, 1.3, 3.0, 13.0],
    HIGH: [29.0, 4.0, 1.5, 0.3, 0.2, 0.1, 0.2, 0.3, 1.5, 4.0, 29.0],
  };

  const multipliers = multipliersByRisk[risk];

  // Peg grid layout math
  const canvasWidth = 400;
  const canvasHeight = 360;
  const topY = 40;
  const rowSpacing = 28;

  const pegs: { x: number; y: number; r: number; c: number }[] = [];
  for (let r = 0; r <= rows; r++) {
    const count = r + 1;
    const y = topY + r * rowSpacing;
    const totalRowWidth = r * 28;
    const startX = canvasWidth / 2 - totalRowWidth / 2;
    for (let c = 0; c < count; c++) {
      pegs.push({ x: startX + c * 28, y, r, c });
    }
  }

  const handleDropBall = async () => {
    if (isDropping || betAmount <= 0 || betAmount > playerBalance) return;

    setIsDropping(true);
    setHighlightedSlot(null);
    setLastWinMultiplier(null);

    const outcome = await rollPlinkoOutcome(serverSeed, clientSeed, nonce, rows);
    incrementNonce();

    // Animate ball along path
    let currentR = 0;
    let currentC = 0;
    let curX = canvasWidth / 2;
    let curY = topY - 15;

    setBallPos({ x: curX, y: curY, visible: true });

    const stepInterval = 120;
    let step = 0;

    const interval = setInterval(() => {
      if (step < rows) {
        const dir = outcome.path[step]; // 0 = left, 1 = right
        if (dir === 1) {
          currentC += 1;
        }
        currentR += 1;

        // Find next peg target
        const totalRowWidth = currentR * 28;
        const startX = canvasWidth / 2 - totalRowWidth / 2;
        curX = startX + currentC * 28;
        curY = topY + currentR * rowSpacing - 6;

        setBallPos({ x: curX, y: curY, visible: true });
        if (step % 2 === 0) {
          soundManager.playBallTick();
        }
        step++;
      } else {
        clearInterval(interval);

        // Landed in final slot
        const slotIdx = outcome.finalSlot;
        const mult = multipliers[slotIdx];
        const payout = betAmount * mult;
        const profit = payout - betAmount;
        const houseFee = betAmount * 0.02; // 2% protocol fee to TiggyBank treasury

        setHighlightedSlot(slotIdx);
        setLastWinMultiplier(mult);

        // Bell sound on landing
        if (mult >= 10) {
          soundManager.playJackpotBells();
        } else if (mult >= 2) {
          soundManager.playWinChime();
        } else if (mult >= 1) {
          soundManager.playHitNumberBell();
        }

        // Drop into bucket
        setTimeout(() => {
          setBallPos((p) => ({ ...p, visible: false }));
          setIsDropping(false);

          onBetPlaced({
            id: `plinko-${Date.now()}`,
            timestamp: new Date().toISOString(),
            game: 'PLINKO',
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
        }, 300);
      }
    }, stepInterval);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
      {/* Left Control Panel */}
      <div className="lg:col-span-4 p-5 rounded-xl border border-slate-800 bg-[#090D17] space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Plinko Protocol Engine</span>
          </div>
          <span className="text-[10px] text-emerald-400">2.0% HOUSE CUT</span>
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
              disabled={isDropping}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-bold focus:border-amber-400 focus:outline-none"
            />
            <button
              onClick={() => setBetAmount((b) => Math.max(1, Math.floor(b / 2)))}
              disabled={isDropping}
              className="px-2.5 py-2 bg-slate-850 hover:bg-slate-700 text-slate-300 rounded border border-slate-750"
            >
              ½
            </button>
            <button
              onClick={() => setBetAmount((b) => Math.min(playerBalance, b * 2))}
              disabled={isDropping}
              className="px-2.5 py-2 bg-slate-850 hover:bg-slate-700 text-slate-300 rounded border border-slate-750"
            >
              2×
            </button>
          </div>
        </div>

        {/* Risk Level */}
        <div className="space-y-1.5">
          <span className="text-slate-400 text-[11px]">VOLATILITY RISK PROFILE</span>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded border border-slate-800">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                disabled={isDropping}
                className={`py-1.5 text-[10px] font-bold rounded transition-colors ${
                  risk === r
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Outcome Display */}
        {lastWinMultiplier !== null && (
          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400">LAST MULTIPLIER HIT</span>
            <div
              className={`text-2xl font-extrabold tabular-nums ${
                lastWinMultiplier >= 1 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {lastWinMultiplier}×
            </div>
            <div className="text-[11px] text-slate-300">
              Payout: {(betAmount * lastWinMultiplier).toFixed(2)} {currency}
            </div>
          </div>
        )}

        {/* Drop Ball Action Button or Deposit Trigger */}
        {playerBalance === 0 ? (
          <button
            type="button"
            onClick={onOpenDeposit}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-sm rounded shadow-lg shadow-amber-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Coins className="w-4 h-4 fill-current" />
            <span>+ Add Balance to Play</span>
          </button>
        ) : (
          <button
            onClick={handleDropBall}
            disabled={isDropping || betAmount > playerBalance}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-sm rounded shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isDropping ? 'Plinko Ball Dropping...' : 'Drop Plinko Ball'}</span>
          </button>
        )}

        <p className="text-[10px] text-slate-500 text-center">
          Every drop transfers 2% house fee to TiggyBank Treasury & triggers Auto-Accumulation.
        </p>
      </div>

      {/* Right Canvas: Pegs & Multiplier Bins */}
      <div className="lg:col-span-8 p-6 rounded-xl border border-slate-800 bg-[#070A0F] flex flex-col items-center relative overflow-hidden">
        {/* Subtle matrix dots */}
        <div className="relative w-full max-w-[420px] h-[370px]">
          {/* SVG Pegboard */}
          <svg className="w-full h-full" viewBox="0 0 400 360">
            {/* Pegs */}
            {pegs.map((peg, idx) => (
              <circle
                key={idx}
                cx={peg.x}
                cy={peg.y}
                r={3}
                fill="#cbd5e1"
                className="opacity-70 transition-all"
              />
            ))}

            {/* Dropping Ball */}
            {ballPos.visible && (
              <circle
                cx={ballPos.x}
                cy={ballPos.y}
                r={6.5}
                fill="#F59E0B"
                className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              />
            )}
          </svg>

          {/* Bottom Multiplier Buckets */}
          <div className="absolute bottom-1 inset-x-0 flex justify-between gap-1 px-1">
            {multipliers.map((m, idx) => {
              const isHighlight = highlightedSlot === idx;
              // Color spectrum from center red to edge emerald
              const isHigh = m >= 4;
              const isMid = m >= 1 && m < 4;

              return (
                <div
                  key={idx}
                  className={`flex-1 py-1 text-center rounded text-[10px] font-bold tabular-nums transition-all border ${
                    isHighlight
                      ? 'scale-110 bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/30'
                      : isHigh
                      ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
                      : isMid
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800'
                  }`}
                >
                  {m}×
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Provably Fair Hash Algorithm: SHA-256</span>
          <span className="text-amber-400">10 Rows · 11 Multipliers</span>
        </div>
      </div>
    </div>
  );
};
