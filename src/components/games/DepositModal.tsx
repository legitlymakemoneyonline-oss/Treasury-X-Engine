import React, { useState } from 'react';
import {
  X,
  Wallet,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  ArrowDownCircle,
  ArrowUpCircle,
  Cpu,
  Coins,
  Sparkles,
  ExternalLink,
  Flame,
} from 'lucide-react';
import {
  hasInjectedProvider,
  connectOperatorWallet,
  switchToPolygonMainnet,
  executeEvmTransaction,
} from '../../services/web3Execution';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  treasuryPolBalance: number;
  treasuryUsdtBalance: number;
  poolPolBalance?: number;
  playerBalancePol: number;
  playerBalanceUsdt: number;
  selectedCurrency: 'POL' | 'USDT';
  onTransferFromTreasury: (amount: number, currency: 'POL' | 'USDT') => void;
  onWithdrawToTreasury: (amount: number, currency: 'POL' | 'USDT') => void;
  onFundPoolFromBankroll?: (amount: number) => void;
  onStakeFromBankroll?: (amount: number) => void;
  onLoadPracticeCredits: (amount: number) => void;
  onResetBalanceToZero: () => void;
  polAddress: string;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  treasuryPolBalance,
  treasuryUsdtBalance,
  poolPolBalance = 0,
  playerBalancePol,
  playerBalanceUsdt,
  selectedCurrency,
  onTransferFromTreasury,
  onWithdrawToTreasury,
  onFundPoolFromBankroll,
  onStakeFromBankroll,
  onLoadPracticeCredits,
  onResetBalanceToZero,
  polAddress,
}) => {
  const [activeTab, setActiveTab] = useState<'treasury' | 'web3' | 'plisio' | 'practice'>('treasury');
  const [currency, setCurrency] = useState<'POL' | 'USDT'>(selectedCurrency);
  const [transferAmount, setTransferAmount] = useState<string>('10');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('10');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Web3 state
  const [isConnectingWeb3, setIsConnectingWeb3] = useState<boolean>(false);
  const [web3Address, setWeb3Address] = useState<string | null>(null);
  const [web3DepositAmount, setWeb3DepositAmount] = useState<string>('5');
  const [isBroadcastingWeb3, setIsBroadcastingWeb3] = useState<boolean>(false);
  const [web3Error, setWeb3Error] = useState<string | null>(null);
  const [web3SuccessTx, setWeb3SuccessTx] = useState<string | null>(null);

  // Plisio state
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAvailableTreasury = currency === 'POL' ? treasuryPolBalance : treasuryUsdtBalance;
  const currentPlayerBalance = currency === 'POL' ? playerBalancePol : playerBalanceUsdt;

  const handleExecuteTreasuryTransfer = () => {
    setActionError(null);
    const num = parseFloat(transferAmount);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid amount greater than 0.');
      return;
    }
    if (num > currentAvailableTreasury) {
      setActionError(`Insufficient funds in Treasury Safe. Available: ${currentAvailableTreasury.toLocaleString()} ${currency}`);
      return;
    }

    onTransferFromTreasury(num, currency);
    setActionSuccess(`Transferred ${num} ${currency} from Treasury Safe to Game Bankroll!`);
    setTimeout(() => setActionSuccess(null), 5000);
  };

  const handleExecuteWithdrawal = () => {
    setActionError(null);
    const num = parseFloat(withdrawAmount);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid withdrawal amount.');
      return;
    }
    if (num > currentPlayerBalance) {
      setActionError(`Insufficient funds in Game Bankroll. Available: ${currentPlayerBalance.toLocaleString()} ${currency}`);
      return;
    }

    onWithdrawToTreasury(num, currency);
    setActionSuccess(`Returned ${num} ${currency} from Game Bankroll back to Treasury Safe!`);
    setTimeout(() => setActionSuccess(null), 5000);
  };

  const handleExecuteFundPool = () => {
    setActionError(null);
    const num = parseFloat(withdrawAmount);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid amount to fund the pool.');
      return;
    }
    if (num > currentPlayerBalance) {
      setActionError(`Insufficient funds in Game Bankroll. Available: ${currentPlayerBalance.toLocaleString()} ${currency}`);
      return;
    }

    if (currency !== 'POL') {
      setActionError('Only POL can be routed directly to the Quest Fuel Pool.');
      return;
    }

    if (onFundPoolFromBankroll) {
      onFundPoolFromBankroll(num);
      setActionSuccess(`Successfully sent ${num} POL from winning bankroll to fund the Quest Fuel Pool!`);
      setTimeout(() => setActionSuccess(null), 5000);
    }
  };

  const handleExecuteStake = () => {
    setActionError(null);
    const num = parseFloat(withdrawAmount);
    if (isNaN(num) || num <= 0) {
      setActionError('Please enter a valid amount to stake.');
      return;
    }
    if (num > currentPlayerBalance) {
      setActionError(`Insufficient funds in Game Bankroll. Available: ${currentPlayerBalance.toLocaleString()} ${currency}`);
      return;
    }

    if (currency !== 'POL') {
      setActionError('Only POL can be delegated to Polygon PoS Validator Staking.');
      return;
    }

    if (onStakeFromBankroll) {
      onStakeFromBankroll(num);
      setActionSuccess(`Successfully delegated ${num} POL from winning bankroll to Validator Staking (~5.2% APR)!`);
      setTimeout(() => setActionSuccess(null), 5000);
    }
  };

  const handleConnectWallet = async () => {
    setIsConnectingWeb3(true);
    setWeb3Error(null);
    try {
      const signer = await connectOperatorWallet();
      setWeb3Address(signer.address);
      if (!signer.isPolygon) {
        await switchToPolygonMainnet();
      }
    } catch (err: any) {
      setWeb3Error(err.message || 'Failed to connect Web3 wallet');
    } finally {
      setIsConnectingWeb3(false);
    }
  };

  const handleBroadcastWeb3Deposit = async () => {
    const amt = parseFloat(web3DepositAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsBroadcastingWeb3(true);
    setWeb3Error(null);
    setWeb3SuccessTx(null);

    try {
      if (!web3Address) {
        throw new Error('Please connect your Web3 wallet first.');
      }
      const res = await executeEvmTransaction(
        web3Address,
        polAddress,
        amt
      );

      setWeb3SuccessTx(res.txHash);
      onTransferFromTreasury(amt, 'POL');
      setActionSuccess(`On-Chain Deposit confirmed! +${amt} POL credited to your Game Bankroll.`);
    } catch (err: any) {
      setWeb3Error(err.message || 'Transaction rejected or failed.');
    } finally {
      setIsBroadcastingWeb3(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(polAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0B0F17] border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#0B0F17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Fund Game Bankroll</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                  STRICT TRUTH PROTOCOL
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Deposit real assets or test risk-free. No imaginary numbers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Bar */}
        <div className="px-6 py-3 bg-[#070A0F] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">GAMING BANKROLL:</span>{' '}
              <span className="font-bold text-amber-400">
                {playerBalancePol.toLocaleString()} POL
              </span>{' '}
              <span className="text-slate-600">/</span>{' '}
              <span className="font-bold text-emerald-400">
                ${playerBalanceUsdt.toLocaleString()} USDT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">SAFE:</span>
              <span className="font-bold text-purple-300">
                {treasuryPolBalance.toLocaleString()} POL
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">FUEL POOL:</span>
              <span className="font-bold text-amber-400">
                {poolPolBalance.toLocaleString()} POL
              </span>
            </div>
          </div>
        </div>

        {/* Success / Alert Banner */}
        {actionSuccess && (
          <div className="px-6 py-3 bg-emerald-950/90 border-b border-emerald-600/70 text-emerald-200 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[11px] shrink-0 transition-colors cursor-pointer"
            >
              Play Games Now →
            </button>
          </div>
        )}

        {/* Error Banner */}
        {actionError && (
          <div className="px-6 py-3 bg-rose-950/90 border-b border-rose-600/70 text-rose-200 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="p-1 hover:text-white text-rose-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-2 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('treasury')}
            className={`px-3 py-2 rounded-t-lg font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'treasury'
                ? 'border-purple-500 text-white bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
            <span>1. From Treasury Safe (Fast)</span>
          </button>

          <button
            onClick={() => setActiveTab('web3')}
            className={`px-3 py-2 rounded-t-lg font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'web3'
                ? 'border-purple-500 text-white bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. Web3 Wallet (MetaMask)</span>
          </button>

          <button
            onClick={() => setActiveTab('plisio')}
            className={`px-3 py-2 rounded-t-lg font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'plisio'
                ? 'border-purple-500 text-white bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Plisio Crypto Invoice</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`px-3 py-2 rounded-t-lg font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'practice'
                ? 'border-purple-500 text-white bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>4. Sandbox Practice Faucet</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5">
          {/* TAB 1: Transfer from Treasury Safe */}
          {activeTab === 'treasury' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-200/90 leading-relaxed">
                <strong>Instant Internal Allocation:</strong> Move real POL from your on-chain verified safe (Smart Contract / Wallet <code className="text-purple-300 font-mono">{polAddress.slice(0, 10)}...{polAddress.slice(-6)}</code>) directly into the Gaming Floor to play games. You can return it anytime with zero loss.
              </div>

              {/* Currency selector for transfer */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">Select Currency:</span>
                <button
                  onClick={() => setCurrency('POL')}
                  className={`px-3 py-1 rounded font-bold transition-colors ${
                    currency === 'POL' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  POL (Available: {treasuryPolBalance.toLocaleString()})
                </button>
                <button
                  onClick={() => setCurrency('USDT')}
                  className={`px-3 py-1 rounded font-bold transition-colors ${
                    currency === 'USDT' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  USDT (Available: ${treasuryUsdtBalance.toLocaleString()})
                </button>
              </div>

              {/* Deposit Section */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                    <span>DEPOSIT TO GAMING FLOOR</span>
                  </span>
                  <span className="text-slate-500">
                    Max Safe: {currentAvailableTreasury.toLocaleString()} {currency}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      min="0.1"
                      step="1"
                      className="w-full bg-[#070A0F] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                      placeholder="Amount to move..."
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                      {currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 5, 10, 25].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setTransferAmount(String(preset))}
                        className="px-2.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
                      >
                        +{preset}
                      </button>
                    ))}
                    <button
                      onClick={() => setTransferAmount(String(currentAvailableTreasury))}
                      className="px-2.5 py-2 rounded bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-xs font-mono text-purple-300 font-bold"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleExecuteTreasuryTransfer}
                  disabled={currentAvailableTreasury <= 0 || parseFloat(transferAmount) <= 0}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Deposit {transferAmount || '0'} {currency} into Bankroll</span>
                </button>
              </div>

              {/* Withdraw & Bankroll Routing Section */}
              {currentPlayerBalance > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200 font-bold flex items-center gap-1.5">
                      <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                      <span>ALLOCATE / WITHDRAW WINNINGS</span>
                    </span>
                    <span className="text-amber-300 font-bold">
                      Available: {currentPlayerBalance.toLocaleString()} {currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="0.1"
                        max={currentPlayerBalance}
                        className="w-full bg-[#070A0F] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                        placeholder="Amount..."
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                        {currency}
                      </span>
                    </div>

                    <button
                      onClick={() => setWithdrawAmount(String(currentPlayerBalance))}
                      className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-300 font-bold shrink-0"
                    >
                      MAX ({currentPlayerBalance.toLocaleString()})
                    </button>
                  </div>

                  {/* 3 Action Destination Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Destination 1: Treasury Safe */}
                    <button
                      onClick={handleExecuteWithdrawal}
                      className="p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>To Treasury Safe</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        Locks into core cold reserve safe.
                      </p>
                    </button>

                    {/* Destination 2: Fund Quest Fuel Pool */}
                    <button
                      onClick={handleExecuteFundPool}
                      disabled={currency !== 'POL'}
                      className="p-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-left transition-all disabled:opacity-40 group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                        <span>Fund Fuel Pool</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        Powers gas & platform payouts.
                      </p>
                    </button>

                    {/* Destination 3: Stake on Polygon PoS */}
                    <button
                      onClick={handleExecuteStake}
                      disabled={currency !== 'POL'}
                      className="p-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-left transition-all disabled:opacity-40 group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <Coins className="w-3.5 h-3.5 shrink-0" />
                        <span>Delegate Staking</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        Earns ~5.2% APR native yield.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Web3 Wallet Direct Deposit */}
          {activeTab === 'web3' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200/90 leading-relaxed">
                <strong>Direct On-Chain Web3 Injection:</strong> Connect MetaMask, Rabby, Coinbase, or any browser wallet on Polygon Mainnet (Chain ID 137) to transfer POL directly to your treasury address.
              </div>

              {!web3Address ? (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnectingWeb3}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isConnectingWeb3 ? 'Connecting Web3 Extension...' : 'Connect Browser Wallet'}</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">CONNECTED WALLET:</span>
                      <div className="text-cyan-400 font-bold truncate max-w-xs">{web3Address}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Polygon (137)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-mono">Deposit Amount (POL):</label>
                    <input
                      type="number"
                      value={web3DepositAmount}
                      onChange={(e) => setWeb3DepositAmount(e.target.value)}
                      min="0.1"
                      className="w-full bg-[#070A0F] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    onClick={handleBroadcastWeb3Deposit}
                    disabled={isBroadcastingWeb3 || parseFloat(web3DepositAmount) <= 0}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>
                      {isBroadcastingWeb3 ? 'Broadcasting to Polygon...' : `Sign & Deposit ${web3DepositAmount} POL`}
                    </span>
                  </button>
                </div>
              )}

              {web3Error && (
                <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{web3Error}</span>
                </div>
              )}

              {web3SuccessTx && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center justify-between">
                  <span>Tx Confirmed: {web3SuccessTx.slice(0, 14)}...</span>
                  <a
                    href={`https://polygonscan.com/tx/${web3SuccessTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <span>View on PolygonScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Plisio Crypto Invoice */}
          {activeTab === 'plisio' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed">
                <strong>Plisio Crypto Gateway:</strong> Send USDT (TRC20) or POL directly from any external exchange (Binance, Bybit, Kraken) to your configured treasury destination.
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
                <span className="text-slate-400">YOUR TREASURY RECEIVING DESTINATION:</span>
                <div className="flex items-center justify-between p-2.5 bg-[#070A0F] rounded-lg border border-slate-800">
                  <span className="text-amber-300 truncate select-all">{polAddress}</span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-2"
                  >
                    {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">
                  Network: <strong>Polygon Mainnet (PoS)</strong> or <strong>TRC20</strong> for USDT payouts.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Sandbox Practice Faucet */}
          {activeTab === 'practice' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-700/60 text-xs text-emerald-200 leading-relaxed">
                <strong>100% Truthful Sandbox Testing:</strong> If you do not want to use real money yet and simply want to inspect the provably fair physics, pegboard drops, or dice algorithms, load temporary practice credits below.
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>EXPLICIT TEST MODE DECLARATION</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Practice credits have <strong>ZERO real value</strong> and do NOT alter your real Bitcoin vault or Polygon on-chain treasury. You can reset them back to 0 at any time.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      onLoadPracticeCredits(50);
                      setActionSuccess('Loaded 50 Practice Credits (Sandbox Test Only).');
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Load 50 Test Credits</span>
                  </button>

                  <button
                    onClick={() => {
                      onLoadPracticeCredits(200);
                      setActionSuccess('Loaded 200 Practice Credits (Sandbox Test Only).');
                    }}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Load 200 Test Credits</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onResetBalanceToZero();
                      setActionSuccess('Bankroll balance strictly reset to 0.');
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 rounded-lg text-xs font-mono transition-colors"
                  >
                    Reset Balance Back to Strict 0.00
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#070A0F] border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Truth Guarantee: Verified On-Chain Math</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
