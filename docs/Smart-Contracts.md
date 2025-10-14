## Smart Contracts

### FARToken.sol
- ERC20 + ERC20Burnable, Ownable, Pausable.
- 1B max supply minted to deployer.
- Staking mechanism:
  - `stake(amount)` transfers tokens to contract and records balance.
  - `calculateRewards` accrues rewards using `rewardRate` (basis points).
  - `claimRewards` mints new tokens (inflationary reward).
- Admin controls:
  - `setRewardRate` (max 10000 = 100% APY).
  - `pause` / `unpause` operations in emergencies.

### InferencePayment.sol
- Roles: `DEFAULT_ADMIN_ROLE`, `ORACLE_ROLE`, `NODE_ROLE`.
- Users deposit $FAR (`deposit`) to fund tasks. Balances tracked per address.
- `createTask` reserves user funds; `completeTask` distributes actual cost with ±10% performance adjustment.
- Distribution:
  - 60% GPU node
  - 20% stakers (sent to staking contract)
  - 20% treasury
- Node registry ensures only approved providers can receive payments.
- Uses Chainlink price feed for future fiat conversions (`getLatestPrice`).

### Tooling
- Hardhat configuration sets Solidity 0.8.20, optimizer 200 runs.
- Scripts & tests (to be implemented) should cover:
  - Staking lifecycle (stake→claim→unstake).
  - Payment distribution with performance score variations.
  - Node registration & deactivation flows.

### Deployment Notes
- Deploy FARToken → record address.
- Deploy InferencePayment with FAR token, staking contract, treasury, and price feed addresses.
- Transfer ownership or grant roles to multisig for production control.
- Emit address registry via API gateway for frontend environment variables.
