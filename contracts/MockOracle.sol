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

    event OracleFulfilled(bytes32 indexed requestId, uint256 data); // Updated to include `data`

    // Initialize linkToken in the constructor
    constructor(address _linkTokenAddress) {
        linkToken = LinkTokenInterface(_linkTokenAddress);
    }

    // onTokenTransfer is called when LINK is transferred to this contract
    function onTokenTransfer(
        address _sender,
        uint256 _value,
        bytes memory _data
    ) public {
        require(msg.sender == address(linkToken), "Only LinkToken can trigger");

        // Decode the incoming data to get the requestId (bytes32 type)
        bytes32 requestId = abi.decode(_data, (bytes32));

        // Emit an event to simulate the OracleRequest event
        emit OracleRequest(
            requestId,
            _sender, // The requester (who sent the LINK)
            bytes32(0), // Mock jobId (can be updated if necessary)
            address(this), // The callback address (this oracle)
            bytes4(0), // Mock callback function ID
            block.timestamp, // The expiration timestamp
            _value, // The amount of LINK tokens transferred
            _data // The data payload (includes requestId)
        );
    }

    // Simulates the Chainlink oracle fulfilling the request with data
    function fulfillOracleRequest(bytes32 _requestId, uint256 _data) public {
        // Emit an event to simulate fulfilling the request with the data
        emit OracleFulfilled(_requestId, _data);
    }
}
