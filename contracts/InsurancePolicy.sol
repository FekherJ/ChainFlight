// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./bytesSwap.sol";  // Import the bytesSwap library

contract InsurancePolicy {
    using bytesSwap for string;  // Use the bytesSwap library

    uint256 public flightDelay;  // Flight delay in minutes
    address public owner;
    AggregatorV3Interface internal flightDelayFeed;  // Chainlink data feed for flight delay

    struct Policy {
        address insured;
        uint256 premium;
        uint256 payoutAmount;
        bool isActive;
        string flightNumber;
        uint256 delayThreshold;  // Delay threshold for payout
    }

    mapping(uint256 => Policy) public policies;
    uint256 public policyCount;

    event PolicyCreated(uint256 policyId, address insured, uint256 premium, uint256 payoutAmount, string flightNumber);
    event PayoutTriggered(uint256 policyId, address insured, uint256 payoutAmount);

    // Constructor to initialize the contract with the Chainlink data feed address
    constructor(address _flightDelayFeed) {
        flightDelayFeed = AggregatorV3Interface(_flightDelayFeed);
        owner = msg.sender;
    }

    // Function to create a new insurance policy
    function createPolicy(
        address insured,
        uint256 premium,
        uint256 payoutAmount,
        string memory flightNumber,
        uint256 delayThreshold
    ) public {
        policyCount++;
        policies[policyCount] = Policy(insured, premium, payoutAmount, true, flightNumber, delayThreshold);
        emit PolicyCreated(policyCount, insured, premium, payoutAmount, flightNumber);
    }

    // Function to fetch the latest flight delay from Chainlink data feed
    function getLatestFlightDelay() public view returns (int256) {
        (, int256 latestDelay, , , ) = flightDelayFeed.latestRoundData();
        return latestDelay;
    }

    // Function to trigger the insurance payout if delay threshold is exceeded
    function triggerPayout(uint256 policyId) public {
        Policy storage policy = policies[policyId];
        require(policy.isActive, "Policy is not active");

        // Fetch the latest delay from Chainlink
        int256 latestDelay = getLatestFlightDelay();

        // Check if the flight delay exceeds the policy's delay threshold
        if (uint256(latestDelay) >= policy.delayThreshold) {
            uint256 payoutAmount = policy.payoutAmount;
            policy.isActive = false;  // Deactivate the policy
            payable(policy.insured).transfer(payoutAmount);  // Process payout to the insured
            emit PayoutTriggered(policyId, policy.insured, payoutAmount);
        }
    }

    // Fallback function to receive payments
    receive() external payable {}
}
