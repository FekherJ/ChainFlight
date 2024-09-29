// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FlightDelayAPI is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    string public flightStatus; // Holds the status of the flight
    uint256 public flightDelayStatus; // Holds the delay of the flight in minutes

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    event RequestFlightData(bytes32 indexed requestId, uint256 delay, string flightStatus);
    event FlightDelayDataReceived(bytes32 indexed requestId, uint256 flightDelayStatus);

    // Constructor to initialize Chainlink Any API details
    constructor(address _linkToken) Ownable(msg.sender) {
        _setChainlinkToken(_linkToken);
        oracle = 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD;  // Update this with the Chainlink Any API Oracle
        jobId = "ca98366cc7314957b8c012c72f05aeeb";           // Update this with the Chainlink Any API Job ID
        fee = 0.1 * 10 ** 18;                         // Fee for Chainlink request
    }

    /**
     * @notice Request flight delay data from an external API
     * @param flightNumber The flight number to query
     * @return requestId The unique ID of the Chainlink request
     */
    function requestFlightData(string memory flightNumber) public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        // Construct the API URL for the query (example using AviationStack API)
        string memory apiUrl = string(abi.encodePacked(
            "https://api.aviationstack.com/v1/flights?access_key=975d6fc4ac001e8fb0ad8d7bbfd7ee18&flight_number=", 
            flightNumber
        ));

        req._add("get", apiUrl); // Set the GET request URL
        req._add("path", "data.0.arrival.delay"); // Path to access the delay in the JSON response

        return _sendChainlinkRequestTo(oracle, req, fee); // Send the request to the Chainlink Oracle
    }

    /**
     * @notice Fulfill function called by the Chainlink Oracle with the flight delay data
     * @param _requestId The ID of the Chainlink request
     * @param _flightDelayStatus The delay status received from the API
     */
    function fulfill(bytes32 _requestId, uint256 _flightDelayStatus) public recordChainlinkFulfillment(_requestId) {
        flightDelayStatus = _flightDelayStatus;  // Update the flight delay status with data from the oracle
        emit FlightDelayDataReceived(_requestId, _flightDelayStatus);  // Emit event for logging
    }

    /**
     * @notice Withdraw LINK tokens from the contract (for admin only)
     */
    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }

    // Helper function to set the oracle address and job ID
    function setOracleJob(address _oracle, bytes32 _jobId, uint256 _fee) external onlyOwner {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }
}
