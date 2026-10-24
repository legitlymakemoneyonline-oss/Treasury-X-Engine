---
name: strict-truth-protocol
description: Mandates zero fake numbers, zero synthetic balances, and zero simulated demo states across all applications. Enforces strict transparency where if data does not exist or is unconfirmed on-chain, 0 or empty state is displayed with straight-up truth.
---

# Strict Truth Protocol & Zero Fake Numbers Constitution

This skill defines the non-negotiable operational standard for all financial, cryptographic, gaming, and dashboard interfaces built in this workspace:

## Core Directives

1. **Straight-Up Truth, Nothing But The Truth**:
   - Never generate fake numbers, inflated yields, synthetic pending balances, or mock revenue figures.
   - If a metric, balance, or yield stream is not directly verified from live on-chain queries (e.g. RPC, Blockstream, Polygonscan), it MUST display `0`, `$0.00`, or an explicit empty state.
   - Do NOT populate synthetic ledger entries or fictitious transaction histories to make the app "look active." An empty ledger stating "0 confirmed transactions" is truthful, professional, and required.

2. **No Fake Bankrolls or Deceptive Free Money**:
   - Never inject arbitrary starter bankrolls (e.g. "2,500 POL" or "1,000 USDT") unless the user explicitly connected and authenticated real assets or asked for a clearly segregated sandbox.
   - If player credits are 0, display 0.

3. **Verifiable Addresses Only**:
   - Do not display random hardcoded addresses as if they were the user's active vault or contract.
   - Use the user's actual configured addresses (`bc1qa97p92vnrpcz7shkq5gpd8ewqxv7avz0llu46l` for Bitcoin and `0x85109D0e1ec106A16A135827Dd406305B93FC955` for Polygon).

4. **Honest Forecasts & Health Solvency**:
   - Forecast engines must default to `0` baseline daily volume rather than assuming fictitious inflows.
   - Solvency matrices must never fabricate fake liabilities (e.g. $185k) or fake monthly burns (e.g. $28.5k). Unencumbered assets must be clearly identified as 100% self-custodied with zero debt.
