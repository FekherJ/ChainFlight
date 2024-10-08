// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FlightDelayAPI is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    string public flightStatus; // Holds the status of the flight
    uint256 public flightDelayStatus; // Holds the delay of the flight in minutes

    address private oracle;  // changed for test purposes -> TO SET AS PRIVATE!!!
    bytes32 private jobId;
    uint256 private fee;

    event RequestFlightData(bytes32 indexed requestId, uint256 delay, string flightStatus);
    event FlightDelayDataReceived(bytes32 indexed requestId, uint256 flightDelayStatus);
    event FlightNoDelay(bytes32 indexed requestId);  // NEW event for no delay
    event RequestSent(bytes32 indexed requestId);


   // Constructor to initialize Chainlink Any API details
    constructor(address _linkToken, address _oracle, bytes32 _jobId, uint256 _fee) Ownable(msg.sender) {
        _setChainlinkToken(_linkToken);
        oracle = _oracle;       // The MockOracle address can be passed here
        jobId = _jobId;         // Pass a mock jobId for testing
        fee = _fee;             // Pass a fee (like 0.1 LINK in wei)
    }

    // Getter function to access the oracle for testing purposes
    function getOracle() external view returns (address) {
        return oracle;
    }


    /**
     * @notice Request flight delay data from an external API
     * @param flightNumber The flight number to query
     * @return requestId The unique ID of the Chainlink request
     */
    function requestFlightData(string memory flightNumber) public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        // Construct the API URL for the query (replace YOUR_API_KEY with the actual key)
        string memory apiUrl = string(abi.encodePacked(
            "https://api.aviationstack.com/v1/flights?access_key=975d6fc4ac001e8fb0ad8d7bbfd7ee18&flight_number=", 
            flightNumber
        ));

        req._add("get", apiUrl); // Set the GET request URL
        req._add("path", "data.0.arrival.delay"); // Path to access the delay in the JSON response

        requestId = _sendChainlinkRequestTo(oracle, req, fee);
        emit RequestSent(requestId); // Emit the RequestSent event
        return requestId; // Send the request to the Chainlink Oracle
    }

    /**
     * @notice Fulfill function called by the Chainlink Oracle with the flight delay data
     * @param _requestId The ID of the Chainlink request
     * @param _flightDelayStatus The delay status received from the API
     */
    function fulfill(bytes32 _requestId, uint256 _flightDelayStatus) public recordChainlinkFulfillment(_requestId) {
        if (_flightDelayStatus > 0) {
            flightDelayStatus = _flightDelayStatus;  // Update the flight delay status with data from the oracle
            emit FlightDelayDataReceived(_requestId, _flightDelayStatus);
        } else {
            emit FlightNoDelay(_requestId);  // NEW event when no delay is reported
        }
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
