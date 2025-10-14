// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

interface IFARToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract InferencePayment is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant NODE_ROLE = keccak256("NODE_ROLE");

    IFARToken public immutable farToken;
    AggregatorV3Interface public immutable priceFeed;

    struct Task {
        address user;
        address node;
        uint256 amount;
        uint256 timestamp;
        bool completed;
        bool distributed;
    }

    struct NodeInfo {
        address owner;
        uint256 totalEarned;
        uint256 tasksCompleted;
        uint256 reliability;
        bool active;
    }

    mapping(bytes32 => Task) public tasks;
    mapping(address => NodeInfo) public nodes;
    mapping(address => uint256) public userBalances;

    uint256 public constant NODE_SHARE = 60;
    uint256 public constant STAKER_SHARE = 20;
    uint256 public constant TREASURY_SHARE = 20;

    address public immutable stakingContract;
    address public immutable treasury;

    event TaskCreated(bytes32 indexed taskId, address indexed user, uint256 amount);
    event TaskCompleted(bytes32 indexed taskId, address indexed node, uint256 nodePayment);
    event NodeRegistered(address indexed node, address indexed owner);
    event NodeRatingUpdated(address indexed node, uint256 newRating);

    constructor(
        address farToken_,
        address stakingContract_,
        address treasury_,
        address priceFeed_
    ) {
        farToken = IFARToken(farToken_);
        stakingContract = stakingContract_;
        treasury = treasury_;
        priceFeed = AggregatorV3Interface(priceFeed_);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        require(farToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        userBalances[msg.sender] += amount;
    }

    function createTask(bytes32 taskId, uint256 estimatedCost) external nonReentrant {
        require(userBalances[msg.sender] >= estimatedCost, "Insufficient balance");
        require(tasks[taskId].user == address(0), "Task already exists");

        tasks[taskId] = Task({
            user: msg.sender,
            node: address(0),
            amount: estimatedCost,
            timestamp: block.timestamp,
            completed: false,
            distributed: false
        });

        userBalances[msg.sender] -= estimatedCost;
        emit TaskCreated(taskId, msg.sender, estimatedCost);
    }

    function completeTask(
        bytes32 taskId,
        address node,
        uint256 actualCost,
        uint256 performanceScore
    ) external onlyRole(ORACLE_ROLE) nonReentrant {
        Task storage task = tasks[taskId];
        require(task.user != address(0), "Task does not exist");
        require(!task.completed, "Task already completed");
        require(nodes[node].active, "Node not active");

        task.completed = true;
        task.node = node;

        uint256 adjustment = 100;
        if (performanceScore > 80) {
            adjustment = 100 + ((performanceScore - 80) / 2);
        } else if (performanceScore < 80) {
            adjustment = 100 - ((80 - performanceScore) / 2);
        }

        uint256 nodePayment = (actualCost * NODE_SHARE * adjustment) / 10000;
        uint256 stakerPayment = (actualCost * STAKER_SHARE) / 100;
        uint256 treasuryPayment = (actualCost * TREASURY_SHARE) / 100;

        if (actualCost < task.amount) {
            userBalances[task.user] += (task.amount - actualCost);
        }

        require(farToken.transfer(node, nodePayment), "Node payment failed");
        require(farToken.transfer(stakingContract, stakerPayment), "Staker payment failed");
        require(farToken.transfer(treasury, treasuryPayment), "Treasury payment failed");

        nodes[node].totalEarned += nodePayment;
        nodes[node].tasksCompleted += 1;
        nodes[node].reliability = (performanceScore + nodes[node].reliability) / 2;

        task.distributed = true;

        emit TaskCompleted(taskId, node, nodePayment);
    }

    function registerNode(address owner) external onlyRole(ORACLE_ROLE) {
        require(!nodes[owner].active, "Node already registered");
        nodes[owner] = NodeInfo({
            owner: owner,
            totalEarned: 0,
            tasksCompleted: 0,
            reliability: 80,
            active: true
        });
        _grantRole(NODE_ROLE, owner);
        emit NodeRegistered(owner, owner);
    }

    function updateNodeRating(address node, uint256 newRating) external onlyRole(ORACLE_ROLE) {
        require(nodes[node].active, "Node not active");
        require(newRating <= 100, "Invalid rating");
        nodes[node].reliability = newRating;
        emit NodeRatingUpdated(node, newRating);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        userBalances[msg.sender] -= amount;
        require(farToken.transfer(msg.sender, amount), "Transfer failed");
    }

    function getLatestPrice() external view returns (int256) {
        (, int256 price, , ,) = priceFeed.latestRoundData();
        return price;
    }
}
