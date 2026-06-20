// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MintContract is ERC20 {
    address public relayer;
    mapping(uint256 => bool) public processed;

    event Minted(address indexed recipient, uint256 amount, uint256 nonce);

    constructor(address relayerAddress) ERC20("Wrapped TestToken", "wTST") {
        relayer = relayerAddress;
    }

    function mint(address recipient, uint256 amount, uint256 nonce) external {
        require(msg.sender == relayer, "Only relayer");
        require(!processed[nonce],    "Already minted");

        processed[nonce] = true;
        _mint(recipient, amount);
        emit Minted(recipient, amount, nonce);
    }
}
