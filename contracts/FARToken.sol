// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract FARToken is ERC20, ERC20Burnable, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public rewardsEarned;

    uint256 public totalStaked;
    uint256 public rewardRate = 100; // 1% base APY (100 = 1% in basis points)

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor() ERC20("Far Labs Token", "FAR") {
        _mint(msg.sender, MAX_SUPPLY);
    }

    function stake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        if (stakingBalance[msg.sender] > 0) {
            uint256 pending = calculateRewards(msg.sender);
            rewardsEarned[msg.sender] += pending;
        }

        _transfer(msg.sender, address(this), amount);
        stakingBalance[msg.sender] += amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "Cannot unstake 0 tokens");
        require(stakingBalance[msg.sender] >= amount, "Insufficient staked balance");

        uint256 pending = calculateRewards(msg.sender);
        rewardsEarned[msg.sender] += pending;

        stakingBalance[msg.sender] -= amount;
        totalStaked -= amount;

        _transfer(address(this), msg.sender, amount);

        if (stakingBalance[msg.sender] == 0) {
            stakingTimestamp[msg.sender] = 0;
        } else {
            stakingTimestamp[msg.sender] = block.timestamp;
        }

        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external {
        uint256 pending = calculateRewards(msg.sender);
        uint256 total = rewardsEarned[msg.sender] + pending;

        require(total > 0, "No rewards to claim");

        rewardsEarned[msg.sender] = 0;
        stakingTimestamp[msg.sender] = block.timestamp;

        _mint(msg.sender, total);

        emit RewardsClaimed(msg.sender, total);
    }

    function calculateRewards(address user) public view returns (uint256) {
        if (stakingBalance[user] == 0 || stakingTimestamp[user] == 0) {
            return 0;
        }

        uint256 stakingDuration = block.timestamp - stakingTimestamp[user];
        uint256 rewards = (stakingBalance[user] * rewardRate * stakingDuration) / (365 days * 10000);

        return rewards;
    }

    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 10000, "Rate too high");
        rewardRate = newRate;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
