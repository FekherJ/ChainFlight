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
    event FlightStatusUpdated(uint256 flightStatus);  // Event for logging the updated flight status

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _oracle, string memory _jobId, uint256 _fee, address _link) {
        _setChainlinkToken(_link);  // Updated with underscore
        oracle = _oracle;
        jobId = _jobId.stringToBytes32();  // Convert string to bytes32 using the library
        fee = _fee;
        owner = msg.sender;
    }

    // Function to create a policy
    function createPolicy(address _insured, uint256 _premium, uint256 _payoutAmount, string memory _flightNumber) public onlyOwner {
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

    // Function to request flight status from Chainlink oracle
    function requestFlightStatus(string memory _flightNumber) public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);  // Updated with underscore
        req._add("flight", _flightNumber);  // Add the flight number to the request
        return _sendChainlinkRequestTo(oracle, req, fee);  // Updated with underscore
    }

    // Fulfill function to handle the response from the oracle
    function fulfill(bytes32 _requestId, uint256 _flightStatus) public recordChainlinkFulfillment(_requestId) {
        flightStatus = _flightStatus;
        emit FlightStatusUpdated(flightStatus);  // Log the flight status update
    }

    // Function to trigger the policy based on flight status
    function triggerPolicy(uint256 _policyId) public {
        Policy storage policy = policies[_policyId];
        require(policy.isActive, "Policy is not active");
        require(flightStatus == 2, "Flight is not delayed");  // Trigger the policy only if flight is delayed

        policy.isActive = false;  // Deactivate the policy after it is triggered

        // Emit event that the policy has been triggered
        emit PolicyTriggered(_policyId, policy.flightNumber, policy.payoutAmount, flightStatus);
    }
}
