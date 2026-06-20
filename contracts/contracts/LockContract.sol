// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LockContract {
    IERC20 public token;
    uint256 public timeout;
    uint256 public nextNonce;

    mapping(uint256 => address)  public depositor;
    mapping(uint256 => uint256)  public lockTime;
    mapping(uint256 => uint256)  public lockAmount;
    mapping(uint256 => bool)     public processed;

    event Locked(address indexed sender, uint256 amount, uint256 nonce);
    event Refunded(address indexed sender, uint256 amount, uint256 nonce);

    constructor(address tokenAddress, uint256 _timeout) {
        token   = IERC20(tokenAddress);
        timeout = _timeout;
    }

    function lock(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        uint256 nonce = nextNonce++;
        depositor[nonce]  = msg.sender;
        lockTime[nonce]   = block.timestamp;
        lockAmount[nonce] = amount;

        token.transferFrom(msg.sender, address(this), amount);
        emit Locked(msg.sender, amount, nonce);
    }

    function refund(uint256 nonce) external {
        require(depositor[nonce] == msg.sender,                    "Not depositor");
        require(block.timestamp >= lockTime[nonce] + timeout,      "Timeout not elapsed");
        require(!processed[nonce],                                 "Already processed");

        processed[nonce] = true;
        uint256 amount = lockAmount[nonce];
        token.transfer(msg.sender, amount);
        emit Refunded(msg.sender, amount, nonce);
    }

    // Called by relayer after mint succeeds on Chain B — marks nonce consumed
    function markProcessed(uint256 nonce) external {
        require(depositor[nonce] != address(0), "Unknown nonce");
        require(!processed[nonce],              "Already processed");
        processed[nonce] = true;
    }
}
