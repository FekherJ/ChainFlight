// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FlightDelayAPI.sol";

contract InsurancePolicy is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    // Chainlink parameters
    uint256 public flightDelayStatus;  // Store flight delay status here
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
    }

    mapping(uint256 => Policy) public policies;
    uint256 public policyCount;

    event PolicyCreated(uint256 policyId, address policyHolder, uint256 premiumAmount);
    event ClaimPaid(uint256 policyId, address policyHolder, uint256 payoutAmount);
    event FlightDelayDataReceived(bytes32 indexed requestId, uint256 flightDelayStatus);
    event RequestSent(bytes32 indexed requestId);

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
     */
    function createPolicy(uint256 premiumAmount, uint256 payoutAmount, string memory flightNumber) external payable {
        require(msg.value == premiumAmount, "Incorrect premium sent");

        // After policy creation, request flight delay data
        bytes32 requestId = requestFlightDelayData(flightNumber);
        emit RequestSent(requestId);

        policyCount++;
        policies[policyCount] = Policy({
            id: policyCount,
            policyHolder: msg.sender,
            premiumAmount: premiumAmount,
            payoutAmount: payoutAmount,
            isClaimed: false
        });

        emit PolicyCreated(policyCount, msg.sender, premiumAmount);
    }

    /**
     * @notice Request flight delay data from Chainlink
     * @param flightNumber The flight number to check
     * @return requestId The Chainlink request ID
     */
    function requestFlightDelayData(string memory flightNumber) public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfillFlightDelayDataRequest.selector);
        req._add("flightNumber", flightNumber);  // Add flight number to the request
        requestId = _sendChainlinkRequest(req, fee);
        emit RequestSent(requestId);
    }

    /**
     * @notice Fulfill function called by the Chainlink Oracle with the flight delay data
     * @param _requestId The ID of the Chainlink request
     * @param _flightDelayStatus The delay status received from the API
     */
    function fulfillFlightDelayDataRequest(bytes32 _requestId, uint256 _flightDelayStatus) public recordChainlinkFulfillment(_requestId) {
        flightDelayStatus = _flightDelayStatus;  // Store the fetched flight delay status
        emit FlightDelayDataReceived(_requestId, _flightDelayStatus);
    }

    /**
     * @notice Request an insurance claim based on policy ID
     * @param policyId The ID of the insurance policy
     */
    function requestClaim(uint256 policyId) external {
        Policy storage policy = policies[policyId];
        require(policy.policyHolder == msg.sender, "Only the policy holder can request the claim");
        require(!policy.isClaimed, "Claim has already been made");

        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfillClaim.selector);
        req._add("policyId", uint2str(policyId));

        bytes32 requestId = _sendChainlinkRequest(req, fee);
        emit RequestSent(requestId);
    }

    /**
     * @notice Fulfill function for insurance claims
     * @param _requestId The ID of the Chainlink request
     * @param _policyId The ID of the policy
     */
    function fulfillClaim(bytes32 _requestId, uint256 _policyId) public recordChainlinkFulfillment(_requestId) {
        Policy storage policy = policies[_policyId];
        require(!policy.isClaimed, "Claim already fulfilled");

        policy.isClaimed = true;

        // Pay the policy holder the payout amount
        payable(policy.policyHolder).transfer(policy.payoutAmount);
        emit ClaimPaid(_policyId, policy.policyHolder, policy.payoutAmount);
    }

    /**
     * @notice Convert uint to string (for policyId)
     * @param _i The integer to be converted
     * @return The string representation of the integer
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

    // Allow the contract to receive ETH
    receive() external payable {}
}
