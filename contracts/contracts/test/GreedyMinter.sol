// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface INeonRonin {
    function mint(uint256 qty) external payable;
}

/// @dev Test helper: tries to mint again from inside onERC721Received to get past the wallet limit.
contract GreedyMinter {
    INeonRonin private immutable ronin;
    uint256 private reentries;

    constructor(address ronin_) {
        ronin = INeonRonin(ronin_);
    }

    function start(uint256 qty) external payable {
        ronin.mint{value: msg.value}(qty);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        if (reentries++ == 0) ronin.mint(1);
        return this.onERC721Received.selector;
    }
}
