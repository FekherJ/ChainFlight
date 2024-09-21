// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract InsurancePolicy is ChainlinkClient {
    using Chainlink for Chainlink.Request;

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
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor(address _oracle, bytes32 _jobId, uint256 _fee, address _link) {
        _setChainlinkToken(_link);  // Set the LINK token address
        oracle = _oracle;           // Set the Chainlink oracle address
        jobId = _jobId;             // Set the Chainlink job ID for flight data
        fee = _fee;                 // Set the Chainlink fee
        owner = msg.sender;
    }

    /**
     * Create a new insurance policy for a specific flight.
     * Policies are stored in a mapping with a unique policy ID.
     */
    function createPolicy(address insured, uint256 premium, uint256 payoutAmount, string memory flightNumber) public onlyOwner {
        policyCount++; // Increment policy count to get a unique policy ID
        policies[policyCount] = Policy({
            insured: insured,
            premium: premium,
            payoutAmount: payoutAmount,
            isActive: true,
            flightNumber: flightNumber
        });

        emit PolicyCreated(policyCount, insured, premium, payoutAmount, flightNumber);
    }

    /**
     * Fetch details of a specific policy by its ID.
     */
    function getPolicy(uint256 policyId) public view returns (Policy memory) {
        return policies[policyId];
    }

  /**
 * Trigger the payout for a policy if the flight is delayed.
 */
    function triggerPayout(uint256 policyId, uint256 _flightStatus) public onlyOwner {
        Policy storage policy = policies[policyId];
        require(policy.isActive, "Policy is not active");

    // Check the flight status and trigger payout if delayed
    if (_flightStatus == 2) { // Assuming 2 = delayed
        // Process payout (simplified for example)
        payable(policy.insured).transfer(policy.payoutAmount);
        policy.isActive = false;  // Deactivate policy after payout
    }

    emit PolicyTriggered(policyId, policy.flightNumber, policy.payoutAmount, _flightStatus);
}

    // Additional functions to interact with Chainlink and handle data requests would go here
}
