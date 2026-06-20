# Cross-Chain Bridges: Lock & Mint

Reference: https://www.youtube.com/watch?v=lHyGtqWAax8

---

## What is Cross-Messaging?

Cross-messaging is the exchange of data — NFTs, tokens, or plain strings like "Hello world!" — from one blockchain to another.

### Types of Cross-Messaging

- Token Transfers — exchange of fungible tokens (e.g. USDC, ETH) between chains
- NFT Bridging — exchange of NFTs (e.g. move a Bored Ape from Ethereum to Polygon)
- **Bridging** — transfer of tokens from one chain to another ← what we are doing today

---

## What is Bridging?

Bridging is the transfer of tokens from one chain to another — mostly from where a token is supported to where it is not supported, or vice versa.

---

## Forms of Bridging

### 1. Burn and Mint Bridge

This is when tokens are permanently destroyed (burned) on the source chain and an equivalent amount is newly created (minted) on the destination chain.

**Pros:**

- Total supply before = total supply after — the supply stays constant across both chains
- Simple and straightforward — no liquidity pools or reserves needed
- Works well for native cross-chain tokens designed from the ground up

**Cons:**

- The original token is gone forever on the source chain — if anything goes wrong in transit, the tokens are lost
- Requires both chains to support the burn and mint logic natively, limiting compatibility
- Smart contract bugs on either side can result in permanent loss of funds with no recovery path
- Not suitable for tokens where the original chain's version must remain intact

**Analogy:**
Think of it like exchanging your foreign currency at an airport. You hand over your Naira (burn), and the exchange desk gives you Dollars (mint). Your Naira is gone — you cannot get the exact same notes back. The total monetary value is preserved, but the original form is destroyed.

**Real World Applications:**

- Circle's USDC cross-chain transfer protocol (CCTP) — burns USDC on Ethereum, mints on Avalanche
- Wormhole's native token bridge for assets designed to live on multiple chains simultaneously
- LayerZero's OFT (Omnichain Fungible Token) standard used by projects like Stargate Finance

---

### 2. Lock and Unlock Bridge

This is when tokens are locked in a smart contract vault on the source chain, and an equivalent amount of the same token (already held in reserve) is released from a vault on the destination chain.

**Pros:**

- The original token is never destroyed — it is always recoverable on the source chain
- Works with existing tokens that were not designed for cross-chain use
- No wrapping needed — users receive the actual native token on the other side

**Cons:**

- Stressful to manage because tokens are fragmented across multiple chains — you need to track balances on each chain separately
- The destination chain must maintain a liquidity reserve of the token. If the reserve runs dry, the bridge cannot process withdrawals — making it unreliable under high demand
- Requires liquidity providers on every destination chain, adding complexity and cost
- If the reserve vault on either chain is hacked, users can lose funds permanently

**Analogy:**
Think of it like ATM cash withdrawals across countries. Your money is locked in your Nigerian bank account, and a partner bank abroad releases an equivalent amount from their local vault. If their vault is empty, you cannot withdraw, even though your money is safely sitting in Nigeria.

**Real World Applications:**

- Polygon's PoS Bridge — locks ETH/ERC20 on Ethereum, releases MATIC-side tokens from a reserve
- Ronin Bridge (used by Axie Infinity) — notorious for the $625M hack because the reserve vault was compromised
- Multichain (formerly Anyswap) — used lock-unlock for many token routes before it shut down in 2023

---

### 3. Lock and Mint Bridge ← What We Built

This is when tokens are locked on a chain where they are supported, and made available on a chain where they are not supported by creating new, equivalent **wrapped tokens** on the destination chain.

**Examples of Wrapped Tokens:**

- **USDC.e** — USDC wrapped to be compatible with chains other than Ethereum, such as ZKSync, Arbitrum, and Linea
- **WBTC (Wrapped Bitcoin)** — Bitcoin locked on the Bitcoin network, ERC20 representation minted on Ethereum
- **WETH (Wrapped ETH)** — ETH locked, usable as an ERC20 token within DeFi protocols on the same or other chains

**Pros:**

- Easy and straightforward — the original token stays safe and locked; the wrapped version represents it faithfully
- No liquidity reserve needed on the destination chain — wrapped tokens are minted on demand
- Total supply is always backed 1:1 by locked tokens — no fractional reserve risk
- The original token is always recoverable by burning the wrapped version and unlocking

**Cons:**

- The wrapped token is not the original — some platforms may not accept wTST where they want TST
- You are trusting the bridge smart contract to hold your tokens safely — a bug or hack means locked funds could be lost
- Users must go through a burn-and-unlock process to get the original token back, which adds friction
- Centralisation risk — if the relayer (the off-chain actor that triggers minting) goes offline, tokens are locked with no way to mint on the other side

**Analogy — The NGN Cheque:**

I want to buy something from a dealer whose bank does not accept NGN directly — they only accept NGNe, the digital wrapped version of Naira.

So I go to my bank and ask them to create a cheque worth the price of what I want in NGNe. If I have enough in my account, they **lock** that amount and **issue the cheque**. I can still use my account for everything else, minus the locked amount.

I then hand that cheque to the dealer — that is the **minting**. The cheque exists; it has value; it is backed by real money sitting locked in my account.

To reverse it — if I want my Naira back — I take the cheque back to the bank, they **nullify it** (burn) and **unlock** my money. Now I can spend it directly from my account again.

**Terms:**

| Term                         | Bridge Equivalent                   |
| ---------------------------- | ----------------------------------- |
| My bank account              | Chain A (Source Chain — Sepolia)   |
| The NGNe cheque              | Wrapped Token (wTST)                |
| Where I spend the cheque     | Chain B (Destination Chain — Amoy) |
| Locking the money            | Locking TST in the LockContract     |
| Creating the cheque          | Minting wTST on Amoy                |
| Nullifying the cheque        | Burning wTST                        |
| Releasing the reserved money | Unlocking TST back to the user      |

**Real World Applications:**

- **WBTC** — Bitcoin locked with BitGo custodian, WBTC minted on Ethereum for use in DeFi
- **Polygon's Lock & Mint** — ERC20 tokens locked on Ethereum, equivalent tokens minted on Polygon PoS
- **Arbitrum Bridge** — ETH/ERC20 locked on Ethereum mainnet, mirrored tokens minted on Arbitrum L2

---

### 4. Burn and Unlock Bridge

This is the **reversal** of the Lock and Mint Bridge. Wrapped tokens on the destination chain are burned, and the original tokens locked on the source chain are released back to the user.

**Pros:**

- Cleanly reverses a Lock and Mint operation — the original token is fully recovered
- Burning wrapped tokens reduces circulating supply on the destination chain, keeping the 1:1 backing accurate
- No residual wrapped tokens remain after the process — no "ghost" supply

**Cons:**

- Depends entirely on the Lock and Mint side working correctly — if the source chain vault is compromised, there is nothing to unlock
- Users must trust the bridge to verify the burn happened before releasing funds — a verification failure could mean burned tokens with nothing unlocked
- Latency between the burn confirmation and the unlock can leave users in a waiting state with no tokens on either chain temporarily

**Analogy:**
Going back to the cheque example — you take the NGNe cheque back to the bank (burn), and they release your NGN back into your account (unlock). The cheque is destroyed; your original money is free.

**Real World Applications:**

- Returning WBTC to native Bitcoin — burn WBTC on Ethereum, receive BTC on the Bitcoin network
- Withdrawing from Arbitrum — burn the L2 token, receive the original ERC20 back on Ethereum mainnet
- Returning bridged USDC.e back to native USDC on Ethereum via the Arbitrum bridge

---

## Benefits of Cross-Chain Bridging

1. **Access to DeFi on multiple chains** — A token stuck on Ethereum can be used in Polygon DeFi protocols without selling it. Example: bridging USDC to Polygon to farm yield on Aave Polygon.
2. **Lower transaction fees** — Ethereum mainnet gas can be expensive. Bridging to L2s like Arbitrum or Optimism lets users transact for fractions of a cent. Example: NFT traders moving to Immutable X to avoid $50 gas fees. So yesterday I was trying to get faucet ETH and POL to my MetaMask, so I tried POL POS, ETH Faucet and POW Faucet and some others I can't remember, and they were saying sth of minimum of 0.005 or 0.001 in my account jus before they can give me the fake token oo, I now went to Bitnob to like fund my MetaMask, and they were charging me 2dols to transfer 5 dols, I ran back to youtube and claude to look for where to get 
3. **Access to chain-specific applications** — Some dApps only exist on one chain. Bridging unlocks access. Example: Axie Infinity required WETH on Ronin; users bridged ETH to play.
4. **Liquidity aggregation** — Protocols can pool liquidity across chains, giving users better swap rates than staying on one chain. Example: Stargate Finance routes liquidity across 8+ chains for better prices.
5. **Portfolio diversification across ecosystems** — Users can hold assets and earn on Solana, Ethereum, and BNB Chain simultaneously without converting to different native tokens.

---

## How Bridges are Managed

### Centralized

A single company or entity controls the bridge, holds the keys, and processes transfers.

**Pros:**

- Fast — no waiting for decentralised consensus; transactions clear quickly
- Easy to use — no complex wallet setups or protocol knowledge required

**Cons:**

- Single point of failure — if the company is hacked or goes offline, funds are at risk. Example: FTX's bridge went down when FTX collapsed.
- Trust required — users must trust the operator not to steal or mismanage locked funds

---

### Decentralized

Control is distributed across a network of validators or nodes who must agree before processing a transfer.

**Pros:**

- No single point of failure — requires majority of validators to be compromised simultaneously
- Transparent — all actions happen on-chain and are publicly auditable

**Cons:**

- Slower — consensus among validators takes time, adding latency to transfers
- More complex to use — users may need to interact with multiple contracts or wait for finality periods

---

### Native

The bridge is built and maintained by the blockchain protocol itself, not a third party.

**Pros:**

- Maximum trust — built by the same team that built the chain, deeply integrated and battle-tested
- No additional trust assumptions — you only trust the chain you already trust

**Cons:**

- Only works between specific chains — you cannot use the Arbitrum native bridge to move assets to Polygon
- Limited token support — usually only supports the chain's native assets, not arbitrary ERC20s

---

### Third Party

Independent protocols built on top of existing chains to enable bridging between them.

**Pros:**

- Supports many chains and many tokens in one interface — one bridge, many routes
- Competitive fees and better UX than native bridges in many cases

**Cons:**

- Additional trust assumption — you trust the third party's smart contracts and team on top of the underlying chain
- Higher risk surface — more code, more audits needed. Example: Wormhole lost $320M in a third-party bridge exploit in 2022.

---

## What We Built Today

A **Lock and Mint Bridge** running on live testnets:

- **Sepolia (Chain A)** — users lock TST tokens in our `LockContract`
- **Amoy/Polygon (Chain B)** — our relayer mints equivalent `wTST` wrapped tokens via `MintContract`
- **Relayer** — a Node.js process that watches for `Locked` events and triggers minting automatically
- **Frontend** — a React + ethers.js UI that walks users through Approve → Lock → Bridging → Minted

The code is open source and deployed to real testnets with real wallet signatures.
