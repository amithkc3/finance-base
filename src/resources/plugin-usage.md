## Welcome to Finance-Base!

This plugin brings **Double-Entry Accounting** directly into your Obsidian vault. If you have never done accounting before, don't worry! This guide is designed to explain everything in simple, easy-to-understand terms.

---

### 1. The Core Concept: The Zero-Sum Rule
In double-entry accounting, money doesn't appear out of thin air; it simply moves from one place to another. Therefore, every transaction you log must balance out to **zero**. 
If money leaves your bank account, it must go *somewhere* (like an expense category, or paying off a liability).

To keep things perfectly balanced, the sum of all numerical values in a single transaction's properties must equal `0`.

**Quick Examples of balancing to Zero:**

**Scenario A: Buying groceries with cash**
You spend 100 from your cash on food. Your cash decreases, and your food expenses increase.
- `Asset-Cash`: `-100`
- `Expense-Food`: `100`  
*(Math: -100 + 100 = 0)*

**Scenario B: Receiving your salary**
You get paid 5000 into your bank account. Your bank account increases, and your income increases. Since `Income` in accounting is often logged as a negative credit to balance the ledger, you record it as negative so it balances mathematically.
- `Asset-Bank`: `5000`
- `Income-Salary`: `-5000`
*(Math: 5000 - 5000 = 0)*

**Scenario C: Paying off a credit card**
You transfer 500 from your bank to your credit card.
- `Asset-Bank`: `-500`
- `Liability-CreditCard`: `500` (Adding 500 to a negative debt decreases what you owe).
*(Math: -500 + 500 = 0)*

---

### 2. Creating Custom Accounts (Valid Prefixes)
You do not need to register accounts manually! The plugin reads your transactions and automatically builds accounts based on these exact prefixes. If you type a prefix, followed by a name, it becomes an account instantly.

Here are the 5 valid prefixes you can use in your transaction files:
- `Asset-`: Things you own, like cash, savings, bank accounts. (Examples: `Asset-Wallet`, `Asset-HDFC`)
- `Liability-`: Things you owe, like loans, debts, or credit cards. (Examples: `Liability-Amex`, `Liability-CarLoan`)
- `Income-`: Money you receive. (Examples: `Income-Salary`, `Income-Freelance`)
- `Expense-`: Money you spend. (Examples: `Expense-Rent`, `Expense-Utilities`)
- `Commodity-`: Physical or digital assets that you track by *quantity*, not by currency value (like Gold, Silver, or Stocks). (Example: `Commodity-Gold`)

---

### 3. Tracking Commodities (Like Gold or Stocks)
Sometimes you buy things that change in value, like stocks or gold. You track these using the `Commodity-` prefix. Because commodities are tracked in units (e.g., 5 shares of Apple) instead of currency, the Zero-Sum Rule needs to know the price you bought them for to balance the math.

**How to log a commodity purchase:**
You bought 2 units of Apple Stock (`Commodity-Apple`) and paid $300 in total from your Bank. That means each unit cost $150.
- `Asset-Bank`: `-300` (Money leaves bank)
- `Commodity-Apple`: `2` (You gained 2 shares)
- `UnitPrice-Apple`: `150` (The plugin uses this to automatically calculate `2 shares * $150 = $300 value`, balancing the `-300` from your bank to perfectly equal zero!)

*Note: You can also manage current real-time prices for your commodities dynamically in the settings dropdown below to update your Net Worth automatically over time!*

---

### 4. Keeping Your Data Secure: Blockchain Integrity
This plugin has a highly advanced feature: **Transaction Integrity**. To stop accidental edits from ruining your accounting history, the plugin mathematically chains your transactions together like a blockchain.

1. **Validate New Transactions**: When you create a new transaction, you click "Validate" on your dashboard. The plugin checks if your math equals zero. If it does, it generates a unique cryptographic "hash" (a secure password-like string) and links it directly to the previous transaction.
2. **Verify Integrity**: If you ever accidentally edit an old transaction file, the math will break. Clicking "Verify Integrity" checks the whole chain backwards. If a file was tampered with after being locked, the plugin will catch it and mark it with an `integrity_error`!

---

### 5. Archiving History: Snapshots
As you log hundreds of transactions, your Net Worth changes. A **Snapshot** is a static file the dashboard automatically creates to save your exact Account balances at a specific point in time. 
Why do we do this? It allows the interactive Net Worth Chart to draw a graph of your financial history instantly, without having to calculate every single past transaction over and over again!

---

### 6. Settings Guide & Sample Configuration
Here is exactly how to configure your settings securely based on the options available below:
- **Currency symbol**: The standard symbol for the dashboard. (Sample: `₹` or `$`)
- **Usd to inr conversion rate**: The exchange rate used if a commodity has a different currency than your default. (Sample: `83.0`)
- **Commodity prices**: A JSON dictionary linking ticker symbols to current market prices so your dashboard Net Worth updates automatically. (Sample: `{"Gold": {"value": 76.24, "currency": "$"}}`)
- **Table rows to display**: How many recent entries appear in the actions block. (Sample: `10`)
- **Folder paths (Root, Transactions, Snapshots)**: The locations where the plugin natively creates these structures. Keep them relative! (Sample: `Finance/Transactions`)
- **Blockchain-linked verification**: Decide whether transactions should cryptographically lock sequentially (highly recommended) or evaluate independently.
