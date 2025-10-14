export const CONTRACT_ADDRESSES = {
  FAR_TOKEN: process.env.NEXT_PUBLIC_FAR_TOKEN ?? '0xF00000000000000000000000000000000000FAR',
  INFERENCE_PAYMENT:
    process.env.NEXT_PUBLIC_INFERENCE_PAYMENT ?? '0xF0000000000000000000000000000000000PAY',
  STAKING: process.env.NEXT_PUBLIC_STAKING_CONTRACT ?? '0xF0000000000000000000000000000000000STA'
} as const;

export const CONTRACT_ABIS = {
  FAR_TOKEN: [
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)'
  ],
  STAKING: [
    'function stake(uint256 amount)',
    'function unstake(uint256 amount)',
    'function claimRewards()',
    'function stakingBalance(address account) view returns (uint256)',
    'function rewardsEarned(address account) view returns (uint256)'
  ],
  INFERENCE_PAYMENT: [
    'function userBalances(address user) view returns (uint256)',
    'function deposit(uint256 amount)',
    'function withdraw(uint256 amount)'
  ]
} as const;
