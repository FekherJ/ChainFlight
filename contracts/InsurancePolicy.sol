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

    // Use a mapping to store policies by a unique policy ID
    mapping(uint256 => Policy) public policies;
    
    // Track the number of policies to generate unique IDs
    uint256 public policyCount;

    event PolicyCreated(uint256 policyId, address insured, uint256 premium, uint256 payoutAmount, string flightNumber);
    event PolicyTriggered(uint256 policyId, string flightNumber, uint256 payoutAmount, uint256 flightStatus);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(string memory _jobId) {
        jobId = _jobId.stringToBytes32();  // Convert string to bytes32 using the library
        owner = msg.sender;
    }

    function createPolicy(
        address _insured, 
        uint256 _premium, 
        uint256 _payoutAmount, 
        string memory _flightNumber
    ) public onlyOwner {
        policyCount++;
        policies[policyCount] = Policy({
            insured: _insured,
            premium: _premium,
            payoutAmount: _payoutAmount,
            isActive: true,
            flightNumber: _flightNumber
        });

        emit PolicyCreated(policyCount, _insured, _premium, _payoutAmount, _flightNumber);
    }

    function requestFlightStatus(string memory _flightNumber) public {
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        req._add("flightNumber", _flightNumber);
        _sendChainlinkRequestTo(oracle, req, fee);
    }

    function fulfill(bytes32 _requestId, uint256 _flightStatus) public recordChainlinkFulfillment(_requestId) {
        flightStatus = _flightStatus;
        // Here you could trigger payout for delayed flights
    }
}
