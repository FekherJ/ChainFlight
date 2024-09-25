// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FlightDelayAPI is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    string public flightStatus; // Holds the status of the flight
    uint256 public delay; // Holds the delay of the flight in minutes

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    event RequestFlightData(bytes32 indexed requestId, uint256 delay, string flightStatus);

    // Pass the _oracle, _jobId, _fee, and _linkToken in the constructor
    constructor(address _oracle, bytes32 _jobId, uint256 _fee, address _linkToken) Ownable(msg.sender) {
        _setChainlinkToken(_linkToken); // Initialize Chainlink token
        oracle = _oracle; // Set Oracle address
        jobId = _jobId; // Set Job ID
        fee = _fee; // Set the fee for the request
    }

    /**
     * @notice Request flight delay data from the AviationStack API
     * @param flightNumber The flight number to query
     * @param flightDate The date of the flight in format "YYYY-MM-DD"
     * @return requestId The unique ID of the Chainlink request
     */
    function requestFlightData(string memory flightNumber, string memory flightDate) public returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        // Construct the API URL for the query
        string memory apiUrl = string(abi.encodePacked(
            "https://api.aviationstack.com/v1/flights?access_key=975d6fc4ac001e8fb0ad8d7bbfd7ee18&flight_number=", 
            flightNumber,
            "&flight_date=",
            flightDate
        ));

        req._add("get", apiUrl); // Set the GET request URL
        req._add("path", "data.0.arrival.delay"); // Path to access the delay in the JSON response

        return _sendChainlinkRequestTo(oracle, req, fee); // Send the request to the Chainlink Oracle
    }

    /**
     * @notice Fulfillment function to handle the Chainlink oracle response
     * @param _requestId The ID of the Chainlink request
     * @param _delay The flight delay in minutes
     */
    function fulfill(bytes32 _requestId, uint256 _delay) public recordChainlinkFulfillment(_requestId) {
        delay = _delay; // Store the flight delay data
        emit RequestFlightData(_requestId, _delay, flightStatus); // Emit event with the retrieved data
    }

    /**
     * @notice Withdraw LINK tokens from the contract (for admin only)
     */
    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }

    // Helper function to set the oracle address and jobId
    function setOracleJob(address _oracle, bytes32 _jobId, uint256 _fee) external onlyOwner {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }
}
