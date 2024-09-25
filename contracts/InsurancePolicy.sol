// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
        _setChainlinkToken(_link); // LINK token address for the network
    }

    function createPolicy(uint256 premiumAmount, uint256 payoutAmount) external payable {
        require(msg.value == premiumAmount, "Incorrect premium sent");

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

    function requestClaim(uint256 policyId) external {
        Policy storage policy = policies[policyId];
        require(policy.policyHolder == msg.sender, "Only the policy holder can request the claim");
        require(!policy.isClaimed, "Claim has already been made");

        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfillClaim.selector);
        req._add("policyId", uint2str(policyId));

        bytes32 requestId = _sendChainlinkRequest(req, fee);
        emit RequestSent(requestId);
    }

    function requestFlightDelayData(string memory apiEndpoint) public returns (bytes32 requestId) {           
    Chainlink.Request memory request = _buildChainlinkRequest(jobId, address(this), this.fulfillFlightDelayDataRequest.selector);
    
    // Add the GET request URL for the API
    request._add("get", apiEndpoint);   

    // Add the path to the specific data point within the API response JSON
    request._add("path", "data.flight_delay_status");  // Adjust 'path' based on API's response format

    requestId = _sendChainlinkRequestTo(oracle, request, fee);   // Send the request to the oracle
    emit RequestSent(requestId);  // Emit the event with the request ID
}


    // Callback function that Chainlink oracle will call with the flight delay data
    function fulfillFlightDelayDataRequest(bytes32 _requestId, uint256 _flightDelayStatus) public recordChainlinkFulfillment(_requestId) {
        flightDelayStatus = _flightDelayStatus;  // Store the fetched flight delay status
        emit FlightDelayDataReceived(_requestId, _flightDelayStatus);
    }

    function fulfillClaim(bytes32 _requestId, uint256 _policyId) public recordChainlinkFulfillment(_requestId) {
    Policy storage policy = policies[_policyId];
    require(!policy.isClaimed, "Claim already fulfilled");

    policy.isClaimed = true;

    // Pay the policy holder the payout amount
    payable(policy.policyHolder).transfer(policy.payoutAmount);
    emit ClaimPaid(_policyId, policy.policyHolder, policy.payoutAmount);
}


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

    receive() external payable {}
}
