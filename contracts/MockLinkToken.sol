// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockLinkToken is ERC20 {
    constructor() ERC20("Mock LINK", "LINK") {
        // Mint an initial supply of LINK tokens for testing purposes
        _mint(msg.sender, 1000000 * (10 ** 18));  // Mint 1,000,000 LINK tokens
    }

    // Mock approve function to simulate the approval of spending LINK tokens
    function approve(address spender, uint256 amount) public override returns (bool) {
        return super.approve(spender, amount);
    }

    // Mock transfer function to simulate transferring LINK tokens
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        return super.transfer(recipient, amount);
    }

    function transferAndCall(address to, uint256 value, bytes calldata data) public returns (bool) {
      _transfer(msg.sender, to, value);

      // Correctly call the onTokenTransfer function in the receiving contract
      (bool success,) = to.call(abi.encodeWithSignature("onTokenTransfer(address,uint256,bytes)", msg.sender, value, data));

      // Ensure the call was successful, revert if not
      require(success, "Failed to call onTokenTransfer");
      return success;
}

}
