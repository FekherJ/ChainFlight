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

    // Add a constructor to initialize linkToken if necessary
    constructor(address _linkTokenAddress) {
        linkToken = LinkTokenInterface(_linkTokenAddress);
    }

    function fulfillOracleRequest(bytes32 _requestId) public {
        // Mock function to simulate Chainlink response
        emit OracleRequest(_requestId, msg.sender, bytes32(0), address(this), bytes4(0), block.timestamp, 0, "");
    }
}
