# DCA Protocol Terms of Service

**Version 1.0**
**Effective Date: January 30, 2026**

## 1. Acceptance of Terms

By creating a Dollar-Cost Averaging (DCA) account on the Sui blockchain using this protocol, you ("User") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the protocol.

## 2. Protocol Description

The DCA Protocol is a permissionless smart contract system deployed on the Sui blockchain that enables automated, recurring token swaps. The protocol:

- Allows users to create DCA accounts to swap tokens at specified intervals
- Uses decentralized exchanges (DEXs) via aggregators for trade execution
- Relies on Pyth Network oracles for price verification
- Permits any executor to trigger eligible trades and earn rewards

## 3. User Responsibilities

### 3.1 Wallet Security
You are solely responsible for maintaining the security of your wallet and private keys. The protocol cannot recover lost funds or reverse transactions.

### 3.2 Token Selection
You are responsible for selecting the input and output tokens for your DCA. The protocol does not guarantee the availability, liquidity, or value of any token.

### 3.3 Configuration
You are responsible for setting appropriate parameters including:
- Number of orders
- Trade frequency (interval)
- Slippage tolerance

### 3.4 Funding
You must provide sufficient input tokens to fund your DCA account. Trades will not execute if the account has insufficient balance.

## 4. Risks and Disclaimers

### 4.1 Smart Contract Risk
The protocol is provided "as-is" without warranty. Smart contracts may contain bugs or vulnerabilities despite security audits.

### 4.2 Market Risk
Token prices are volatile. You may receive significantly less output value than expected due to market movements between trades.

### 4.3 Slippage Risk
Trades may execute at prices worse than quoted due to slippage, especially for large orders or illiquid pairs.

### 4.4 Oracle Risk
Price calculations depend on Pyth Network oracles. Oracle failures or manipulation could affect trade execution.

### 4.5 DEX Risk
Trades route through third-party DEXs. The protocol is not responsible for DEX failures, hacks, or manipulation.

### 4.6 Executor Risk
Any address can execute eligible trades. While the protocol enforces minimum output requirements, executors operate independently.

## 5. Fees

### 5.1 Protocol Fee
A fee (configurable by protocol governance) is deducted from each trade's input amount.

### 5.2 Executor Reward
A reward in SUI is allocated per trade to incentivize executors. Users must maintain sufficient SUI to cover executor rewards.

### 5.3 Network Fees
Standard Sui network gas fees apply to all transactions.

## 6. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE PROTOCOL DEVELOPERS, CONTRIBUTORS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.

## 7. Modifications

These Terms may be updated. Continued use of the protocol after changes constitutes acceptance of the new Terms. Users may be required to accept updated terms when creating new DCA accounts.

## 8. Governing Law

These Terms shall be governed by and construed in accordance with the laws applicable to decentralized blockchain protocols.

## 9. Contact

For questions about these Terms, please open an issue on the protocol's GitHub repository.

---

By creating a DCA account, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
