// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InsurancePolicy is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    uint256 public flightDelay;
    bytes32 private jobId;
    uint256 private fee;
    address private oracle;
    string private apiKey;

    event FlightDelayUpdated(uint256 delay);

    constructor(address _oracle, bytes32 _jobId, uint256 _fee, string memory _apiKey) {
        _setPublicChainlinkToken();
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
        apiKey = _apiKey; // Your API key for the external flight delay API
    }

    // Request Flight Delay Data
    function requestFlightDelayData(string memory flightNumber) public onlyOwner {
        Chainlink.Request memory request = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        
        // External API URL (replace with your actual API)
        string memory apiUrl = string(abi.encodePacked(
            "https://api.yourflightdata.com/delay?flight=",
            flightNumber,
            "&apiKey=",
            apiKey
        ));
        
        // Set the API endpoint and parameters
        request._add("get", apiUrl);
        request._add("path", "data.delay"); // Adjust the path according to your JSON structure

        _sendChainlinkRequestTo(oracle, request, fee);
    }

    // Callback function
    function fulfill(bytes32 _requestId, uint256 _delay) public recordChainlinkFulfillment(_requestId) {
        flightDelay = _delay;
        emit FlightDelayUpdated(_delay);
    }

    // Withdraw LINK from contract
    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }
}
