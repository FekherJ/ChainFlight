// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/ChainlinkRequestInterface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockOracle {
    ERC20 public linkToken;

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

    event OracleFulfilled(bytes32 indexed requestId, uint256 data);

    constructor(address linkTokenAddress) {
        linkToken = ERC20(linkTokenAddress);
    }

    // This function simulates the Chainlink Oracle's response to `transferAndCall`
    function onTokenTransfer(address sender, uint256 amount, bytes calldata data) external {
        // Decode the incoming data to get the requestId (bytes32 type)
        bytes32 requestId = abi.decode(data, (bytes32));

        // Emit an event to simulate the OracleRequest event
        emit OracleRequest(
            requestId,
            sender,
            bytes32(0), // Mock jobId (can be updated if necessary)
            address(this), // The callback address (this oracle)
            bytes4(0), // Mock callback function ID
            block.timestamp, // The expiration timestamp
            amount, // The amount of LINK tokens transferred
            data // The data payload (includes requestId)
        );
    }

    // Simulate fulfilling the Chainlink oracle request with the mocked data
    function fulfillOracleRequest(bytes32 requestId, uint256 flightDelay) public {
        // Emit event to simulate fulfilling the request with the flight delay
        emit OracleFulfilled(requestId, flightDelay);
    }
}
