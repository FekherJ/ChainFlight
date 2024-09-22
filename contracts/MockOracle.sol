// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/interfaces/ChainlinkRequestInterface.sol";
import "./LinkTokenInterface.sol";

contract MockOracle {
    LinkTokenInterface public linkToken;

    event OracleRequest(
        bytes32 indexed requestId,
        address requester,
        bytes32 jobId,
        address callbackAddress,
        bytes4 callbackFunctionId,
        uint256 cancelExpiration,
        uint256 payment,
        bytes data
    );

    constructor(address _linkToken) {
        linkToken = LinkTokenInterface(_linkToken);
    }

    function fulfillOracleRequest(
        bytes32 requestId,
        uint256 payment,
        address callbackAddress,
        bytes4 callbackFunctionId,
        //uint256 expiration,  // incomment if needed
        bytes32 data
    ) public returns (bool) {
        require(linkToken.transfer(msg.sender, payment), "Unable to transfer LINK tokens");

        // Simulate fulfilling the request by calling the callback function on the contract
        (bool success, ) = callbackAddress.call(
            abi.encodeWithSelector(callbackFunctionId, requestId, data)
        );

        return success;
    }
}
