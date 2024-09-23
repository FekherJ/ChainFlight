// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "./bytesSwap.sol";  // Import the bytesSwap library

contract InsurancePolicy is ChainlinkClient {
    using Chainlink for Chainlink.Request;
    using bytesSwap for string;  // Use the bytesSwap library

    uint256 public flightStatus;  // 1 = on time, 2 = delayed, etc.
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    address public owner;

    struct Policy {
        address insured;
        uint256 premium;
        uint256 payoutAmount;
        bool isActive;
        string flightNumber;
    }

    mapping(uint256 => Policy) public policies;
    
    uint256 public policyCount;

    event PolicyCreated(uint256 policyId, address insured, uint256 premium, uint256 payoutAmount, string flightNumber);

    constructor(address _oracle, bytes32 _jobId, uint256 _fee, address _linkToken) {
        _setChainlinkToken(_linkToken);
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
        owner = msg.sender;
    }

    function createPolicy(address insured, uint256 premium, uint256 payoutAmount, string memory flightNumber) public {
        policyCount++;
        policies[policyCount] = Policy(insured, premium, payoutAmount, true, flightNumber);
        emit PolicyCreated(policyCount, insured, premium, payoutAmount, flightNumber);  // Emit the event after creating a policy
    }

    // Request flight status from Chainlink oracle
    function requestFlightStatus(string memory flightNumber) public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        req._add("flightNumber", flightNumber);
        requestId = _sendChainlinkRequest(req, fee);
        // No need to emit ChainlinkRequested here, it will be handled by Chainlink
    }

    // Chainlink oracle response handler
    function fulfill(bytes32 _requestId, uint256 _flightStatus) public recordChainlinkFulfillment(_requestId) {
        flightStatus = _flightStatus;
    }
}
