import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Copy, Check, Send, AlertTriangle, ArrowRight } from 'lucide-react';
import { makePlisioHash, getPlisioCanonicalString, verifyPlisioHash } from '../services/cryptoHash';
import { PlisioPayoutPayload, TreasuryBalances } from '../types/treasury';

interface PlisioPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: TreasuryBalances;
  onDispatchPayout: (payload: PlisioPayoutPayload) => void;
}

export const PlisioPayoutModal: React.FC<PlisioPayoutModalProps> = ({
  isOpen,
  onClose,
  balances,
  onDispatchPayout,
}) => {
  const [currency, setCurrency] = useState<string>('USDT_TRC20');
  const [amount, setAmount] = useState<string>('50');
  const [toAddress, setToAddress] = useState<string>('TNo6V8zH4F6RzP8cZqT9wK2mY3vX7bJ1aL');
  const [secretKey, setSecretKey] = useState<string>('tiggy_plisio_secret_key_8892');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'verify'>('dispatch');

  // Real-time calculated hash
  const [generatedHash, setGeneratedHash] = useState<string>('');
  const [canonicalString, setCanonicalString] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Verification state
  const [verifyPayloadJson, setVerifyPayloadJson] = useState<string>(
    JSON.stringify(
      {
        currency: 'USDT_TRC20',
        amount: '50',
        to: 'TNo6V8zH4F6RzP8cZqT9wK2mY3vX7bJ1aL',
        hash: '',
      },
      null,
      2
    )
  );
  const [verifyResult, setVerifyResult] = useState<{
    tested: boolean;
    valid?: boolean;
    calculated?: string;
  }>({ tested: false });

  // Update hash dynamically as inputs change
  useEffect(() => {
    let isCancelled = false;
    const compute = async () => {
      const payload: Record<string, any> = {
        currency,
        amount,
        to: toAddress,
      };
      setCanonicalString(getPlisioCanonicalString(payload));
      const hash = await makePlisioHash(payload, secretKey);
      if (!isCancelled) {
        setGeneratedHash(hash);
      }
    };
    compute();
    return () => {
      isCancelled = true;
    };
  }, [currency, amount, toAddress, secretKey]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const maxAvailable =
    currency === 'POL'
      ? balances.polTreasury + balances.polQuestLiquidity
      : currency === 'BTC'
      ? balances.btcReserve
      : balances.pendingRevenueUsdt;

  const isOverBalance = numAmount > maxAvailable;

  const currentPayload: PlisioPayoutPayload = {
    currency,
    amount,
    to: toAddress,
    hash: generatedHash,
    secretKeyMasked: `${secretKey.slice(0, 4)}...${secretKey.slice(-3)}`,
    createdAt: new Date().toISOString(),
  };

  const formattedJson = JSON.stringify(
    {
      currency: currentPayload.currency,
      amount: currentPayload.amount,
      to: currentPayload.to,
      hash: currentPayload.hash,
    },
    null,
    2
  );

  const handleCopyJson = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteDispatch = () => {
    if (numAmount <= 0 || isOverBalance || !toAddress) return;
    setIsDispatching(true);
    setTimeout(() => {
      onDispatchPayout(currentPayload);
      setIsDispatching(false);
      onClose();
    }, 600);
  };

  const handleRunVerify = async () => {
    try {
      const parsed = JSON.parse(verifyPayloadJson);
      const res = await verifyPlisioHash(parsed, secretKey);
      setVerifyResult({
        tested: true,
        valid: res.isValid,
        calculated: res.expectedHash,
      });
    } catch {
      setVerifyResult({
        tested: true,
        valid: false,
        calculated: 'JSON_PARSE_ERROR',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0D121F] border border-slate-700/80 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090D17]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-mono font-bold text-purple-400 text-xs">
              #
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Plisio Cryptographic Payout Gateway
              </h3>
              <p className="text-[11px] text-slate-400">
                HMAC-SHA256 Lexicographical Signature Protocol
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

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`pb-2.5 px-1 font-semibold transition-colors ${
              activeTab === 'dispatch'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            01. Dispatch Live Payout
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`pb-2.5 px-1 font-semibold transition-colors ${
              activeTab === 'verify'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            02. Verify Webhook Signature
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {activeTab === 'dispatch' ? (
            <>
              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-300 font-medium">
                    PAYOUT CURRENCY
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  >
                    <option value="USDT_TRC20">USDT_TRC20 (Tron TRC-20)</option>
                    <option value="POL">POL (Polygon Native)</option>
                    <option value="BTC">BTC (Bitcoin Mainnet)</option>
                    <option value="USDC_POLYGON">USDC_POLYGON (PoS Native)</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <label className="text-slate-300 font-medium">PAYOUT AMOUNT</label>
                    <span className="text-slate-400">
                      Avail: <strong className={isOverBalance ? 'text-rose-400' : 'text-emerald-400'}>{maxAvailable.toLocaleString()} {currency.split('_')[0]}</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={maxAvailable}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-slate-900 border rounded text-xs text-white font-mono focus:outline-none ${
                      isOverBalance ? 'border-rose-500 text-rose-300' : 'border-slate-700 focus:border-purple-500'
                    }`}
                  />
                  {isOverBalance && (
                    <p className="text-[10px] text-rose-400 font-mono">
                      ⚠️ Solvency Limit: Max available is {maxAvailable.toLocaleString()} {currency.split('_')[0]}.
                    </p>
                  )}
                </div>

                {/* Destination Address */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-300 font-medium">
                    RECIPIENT ADDRESS (`to`)
                  </label>
                  <input
                    type="text"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="TRC20 or EVM destination address"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Plisio Secret Key */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-mono text-slate-300 font-medium flex items-center gap-1.5">
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>PLISIO HMAC SECRET KEY</span>
                    </label>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-mono"
                    >
                      {showKey ? 'Mask' : 'Reveal'}
                    </button>
                  </div>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Cryptographic Inspector */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 text-[10px]">
                    LEXICOGRAPHIC CANONICAL STRING (STEP 1):
                  </span>
                  <div className="text-purple-300 bg-slate-900/80 p-2 rounded border border-slate-800 mt-1 break-all text-[11px]">
                    {canonicalString}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px]">
                    COMPUTED HMAC-SHA256 SIGNATURE (STEP 2):
                  </span>
                  <div className="text-amber-400 bg-slate-900/80 p-2 rounded border border-slate-800 mt-1 break-all font-bold text-[11px]">
                    {generatedHash}
                  </div>
                </div>
              </div>

              {/* Exact JSON Payload Display */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-slate-400">
                    DISPATCH JSON PAYLOAD:
                  </span>
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 text-[11px] font-mono text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {formattedJson}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteDispatch}
                  disabled={isDispatching || !toAddress || numAmount <= 0 || isOverBalance}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-purple-400 to-amber-400 hover:from-purple-300 hover:to-amber-300 rounded transition-all shadow-md shadow-purple-500/10 disabled:bg-slate-800 disabled:opacity-40 disabled:text-slate-500 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isDispatching
                      ? 'Transmitting HMAC Payload...'
                      : isOverBalance
                      ? 'Insufficient Balance'
                      : 'Dispatch Payout & Record TX'}
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* Verify Webhook Signature Tab */
            <div className="space-y-4 font-mono text-xs">
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Paste incoming Plisio webhook callback JSON payload below. The engine will
                alphabetically sort properties and test HMAC-SHA256 signature validity against your secret key.
              </p>

              <textarea
                rows={8}
                value={verifyPayloadJson}
                onChange={(e) => setVerifyPayloadJson(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded text-emerald-400 text-xs font-mono focus:border-purple-500 focus:outline-none"
              />

              <button
                onClick={handleRunVerify}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors"
              >
                Run HMAC-SHA256 Verification
              </button>

              {verifyResult.tested && (
                <div
                  className={`p-4 rounded-lg border ${
                    verifyResult.valid
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {verifyResult.valid ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    )}
                    <span>
                      {verifyResult.valid
                        ? 'SIGNATURE VALID: Tamper-proof payload verified.'
                        : 'SIGNATURE MISMATCH: Invalid hash or wrong secret key.'}
                    </span>
                  </div>
                  <div className="text-[11px] mt-2 text-slate-300 break-all">
                    Calculated Hash: <span className="font-bold">{verifyResult.calculated}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
