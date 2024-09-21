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

    Policy[] public policies;

    event PolicyCreated(uint256 policyId, address insured, uint256 premium, uint256 payoutAmount, string flightNumber);
    event PolicyTriggered(uint256 policyId, string flightNumber, uint256 payoutAmount, uint256 flightStatus);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor(address _oracle, bytes32 _jobId, uint256 _fee, address _link) {
        _setChainlinkToken(_link);  // Set the LINK token address
        oracle = _oracle;  // Set the Chainlink oracle address
        jobId = _jobId;  // Set the Chainlink job ID for flight data
        fee = _fee;  // Set the Chainlink fee
        owner = msg.sender;
    }

    /**
     * Create a new insurance policy for a specific flight.
     */
    function createPolicy(address insured, uint256 premium, uint256 payoutAmount, string memory flightNumber) public onlyOwner {
        policies.push(Policy(insured, premium, payoutAmount, true, flightNumber));
        uint256 policyId = policies.length - 1;
        emit PolicyCreated(policyId, insured, premium, payoutAmount, flightNumber);
    }

    /**
     * Request flight status data from the Chainlink Oracle.
     */
    function requestFlightStatus(uint256 policyId) public onlyOwner {
        require(policyId < policies.length, "Invalid policy ID");
        Policy storage policy = policies[policyId];
        require(policy.isActive, "Policy is not active");

        // Build Chainlink request using the correct method
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfillFlightStatus.selector);
        
        // Add flight number to the request
        req._add("flightNumber", policy.flightNumber);

        // Send the Chainlink request to the oracle
        _sendChainlinkRequestTo(oracle, req, fee);
    }

    /**
     * Fulfillment function called by the Chainlink node with the flight status.
     * 1 = On Time, 2 = Delayed, 3 = Canceled
     */
    function fulfillFlightStatus(bytes32 _requestId, uint256 _flightStatus) public recordChainlinkFulfillment(_requestId) {
        flightStatus = _flightStatus;
        uint256 policyId = policies.length - 1;  // Assuming the latest policy is being checked

        Policy storage policy = policies[policyId];
        require(policy.isActive, "Policy is no longer active");

        if (_flightStatus == 2) {  // Flight is delayed
            policy.isActive = false;  // Mark policy as inactive after payout
            payable(policy.insured).transfer(policy.payoutAmount);  // Payout the insured
            emit PolicyTriggered(policyId, policy.flightNumber, policy.payoutAmount, _flightStatus);
        }
    }

    // Fallback function to allow contract to receive funds
    receive() external payable {}

    // Withdraw any remaining balance from the contract (Only owner)
    function withdrawFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
