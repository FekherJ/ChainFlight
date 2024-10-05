// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FlightDelayAPI.sol";

contract InsurancePolicy is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    // Chainlink parameters
    uint256 public flightDelayStatus;  // Store flight delay status here

    uint256 public constant EXPIRATION_PERIOD = 30 days;  // Set policy expiration to 30 days
    uint256 public constant MIN_PREMIUM = 0.01 ether;


    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    

    // Insurance parameters
    struct Policy {
        uint256 id;
        address policyHolder;
        uint256 premiumAmount;
        uint256 payoutAmount;
        bool isClaimed;
        uint256 expirationTimestamp;  // Added expiration timestamp
    }

    mapping(uint256 => Policy) public policies;
    uint256 public policyCount;

    event PolicyCreated(uint256 policyId, address policyHolder, uint256 premiumAmount, uint256 expirationTimestamp );
    event ClaimPaid(uint256 policyId, address policyHolder, uint256 payoutAmount);
    event FlightDelayDataReceived(bytes32 indexed requestId, uint256 flightDelayStatus);
    event RequestSent(bytes32 indexed requestId);
    event NoDelayReported(bytes32 indexed requestId);  // NEW event for no delay reported

    constructor(
        address _oracle,
        bytes32 _jobId,
        uint256 _fee,
        address _link
    ) Ownable(msg.sender) {
        _setChainlinkOracle(_oracle);
        jobId = _jobId;
        fee = _fee;
        _setChainlinkToken(_link);  // LINK token address for the network
    }

    /**
     * @notice Create a new insurance policy
     * @param premiumAmount The premium paid by the user
     * @param payoutAmount The amount to be paid in case of a claim
     * @param flightNumber The flight number for the policy
     */
    function createPolicy(uint256 premiumAmount, uint256 payoutAmount, string memory flightNumber) external payable {

        require(msg.value == premiumAmount, "Incorrect premium sent");
        require (premiumAmount >= MIN_PREMIUM,"Premium too low");

        // Request flight delay data after creating a policy
        bytes32 requestId = requestFlightDelayData(flightNumber);

        // Set expiration date (30 days from now)
        uint256 expirationTimestamp = block.timestamp + EXPIRATION_PERIOD;

        // Create policy
        Policy memory newPolicy = Policy({
            id: ++policyCount,
            policyHolder: msg.sender,
            premiumAmount: premiumAmount,
            payoutAmount: payoutAmount,
            isClaimed: false,
            expirationTimestamp: expirationTimestamp
        });

        policies[policyCount] = newPolicy;  // Single storage write for policy

        emit RequestSent(requestId);
        emit PolicyCreated(policyCount, msg.sender, premiumAmount, expirationTimestamp);
    }


    function _processClaims() internal {
        for (uint256 i = 1; i <= policyCount; i++) {
            Policy storage policy = policies[i];

            // Check if the policy is still valid and unclaimed
            if (!policy.isClaimed && block.timestamp <= policy.expirationTimestamp) {
                if (flightDelayStatus > 0) {
                    // Automatically transfer the payout amount to the policyholder
                    payable(policy.policyHolder).transfer(policy.payoutAmount);
                    policy.isClaimed = true;
                    emit ClaimPaid(policy.id, policy.policyHolder, policy.payoutAmount);
                }
            }  
        }
    }


    /**
     * @notice Request flight delay data from Chainlink
     * @param flightNumber The flight number to check
     * @return requestId The Chainlink request ID
     */
    function requestFlightDelayData(string memory flightNumber) public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        req._add("flightNumber", flightNumber);  // Add flight number to the request
        requestId = _sendChainlinkRequest(req, fee);
        emit RequestSent(requestId);
    }

    /**
     * @notice Fulfill function called by the Chainlink Oracle with the flight delay data
     * @param _requestId The ID of the Chainlink request
     * @param _flightDelayStatus The delay status received from the API
     */
    function fulfill(bytes32 _requestId, uint256 _flightDelayStatus) public recordChainlinkFulfillment(_requestId) {

        if (_flightDelayStatus > 0) {
            flightDelayStatus = _flightDelayStatus;
            emit FlightDelayDataReceived(_requestId, _flightDelayStatus);
            _processClaims();  // Automatically process claims after fulfilling the request

        } else {
            emit NoDelayReported(_requestId);  // NEW event for handling no delay reported
        }
    }

    /**
     * @notice Withdraw LINK tokens from the contract (for admin only)
     */
    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }

    // This allows the contract to receive Ether even if no function is called explicitly
    receive() external payable {
        // You can customize this function to log an event or handle the funds as needed.

    }
}
