const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsurancePolicy with Mock Chainlink and FlightDelayAPI", function () {
    let insurancePolicy;
    let mockOracle;
    let mockLinkToken;
    let flightDelayAPI;
    let mockLinkTokenAddress;
    const jobId = ethers.encodeBytes32String("test-job-id");
    const fee = ethers.parseEther("0.1"); // Use ethers v6 syntax for fee

    beforeEach(async function () {
        // Deploy the MockLinkToken contract
        const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
        mockLinkToken = await MockLinkToken.deploy();
        await mockLinkToken.waitForDeployment(); // Wait for deployment
        mockLinkTokenAddress = await mockLinkToken.getAddress(); // Get LINK token address
        console.log('mockLinkToken address:', mockLinkTokenAddress);

        // Deploy the MockOracle contract
        const MockOracle = await ethers.getContractFactory("MockOracle");
        mockOracle = await MockOracle.deploy(mockLinkTokenAddress); // Pass the LINK token address
        await mockOracle.waitForDeployment(); // Wait for deployment
        const mockOracleAddress = await mockOracle.getAddress(); // Get oracle address
        console.log('mockOracle address:', mockOracleAddress);

        // Deploy the InsurancePolicy contract with the oracle and LINK token addresses
        const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
        insurancePolicy = await InsurancePolicy.deploy(mockOracleAddress, jobId, fee, mockLinkTokenAddress); // Use correct mockLinkTokenAddress
        await insurancePolicy.waitForDeployment(); // Wait for deployment
        const insurancePolicyAddress = await insurancePolicy.getAddress();
        console.log('insurancePolicy address:', insurancePolicyAddress);
        

        // Deploy the FlightDelayAPI contract
        const FlightDelayAPI = await ethers.getContractFactory("FlightDelayAPI");
        flightDelayAPI = await FlightDelayAPI.deploy(mockOracleAddress, jobId, fee, mockLinkTokenAddress);
        await flightDelayAPI.waitForDeployment(); // Wait for deployment
        const flightDelayAPIAddress = await flightDelayAPI.getAddress();
        console.log('flightDelayAPI address:', flightDelayAPIAddress);

        // Transfer some LINK tokens to the FlightDelayAPI and InsurancePolicy contracts
        await mockLinkToken.transfer(flightDelayAPIAddress, ethers.parseEther("5000")); // Transfer 5000 LINK
        await mockLinkToken.transfer(insurancePolicyAddress, ethers.parseEther("5000")); // Transfer 5000 LINK

        // Log the LINK token balances of each contract to ensure tokens are transferred
        const flightDelayAPILinkBalance = await mockLinkToken.balanceOf(flightDelayAPIAddress);
        const insurancePolicyLinkBalance = await mockLinkToken.balanceOf(insurancePolicyAddress);
        console.log('FlightDelayAPI LINK Balance:', ethers.formatEther(flightDelayAPILinkBalance));  // Should be 5000 LINK
        console.log('InsurancePolicy LINK Balance:', ethers.formatEther(insurancePolicyLinkBalance));  // Should be 5000 LINK

  
    });

    it("Should create a policy and emit PolicyCreated event", async function () {
        const premiumAmount = ethers.parseEther("1");
        const payoutAmount = ethers.parseEther("10");
        
        // Test creating a policy and emitting the event
        await expect(insurancePolicy.createPolicy(premiumAmount, payoutAmount, { value: premiumAmount }))
            .to.emit(insurancePolicy, "PolicyCreated")
            .withArgs(1, (await ethers.getSigners())[0].getAddress(), premiumAmount);
    });

    it("Should request and fulfill flight delay data using Chainlink", async function () {
      const apiEndpoint = "https://api.aviationstack.com/v1/flights?access_key=975d6fc4ac001e8fb0ad8d7bbfd7ee18"; // Example AviationStack API endpoint
  
      // Send a request to fetch flight delay data
      const tx = await insurancePolicy.requestFlightDelayData(apiEndpoint);
      const receipt = await tx.wait(); // Wait for the transaction to complete

      console.log(receipt); // Log the entire receipt to debug

      // Safeguard: Check if any events are emitted and find the right event
      if (receipt.events) {
          const event = receipt.events.find(event => event.event === "RequestSent");
          if (event) {
              const requestId = event.args.requestId;
              console.log("Request ID:", requestId.toString());
          } else {
              console.log("RequestSent event not found.");
          }
      } else {
          console.log("No events found in the receipt.");
      }

  
      // Capture the emitted event to get the requestId
      const event = receipt.events.find(event => event.event === "RequestSent");
      const requestId = event.args.requestId;
      console.log("Request ID:", requestId.toString());
  
      // Mock the oracle's response (fulfill the request with a mock flight delay)
      const mockFlightDelay = ethers.toBigInt("30");  // Example delay of 30 minutes
      await mockOracle.fulfillOracleRequest(requestId, mockFlightDelay); // Fulfill the mock request
  
      // Verify that the flight delay is correctly updated
      const flightDelay = await insurancePolicy.flightDelay();
      expect(flightDelay).to.equal(mockFlightDelay);
    });
  

    it("Should request flight delay data from the FlightDelayAPI contract", async function () {
      const flightNumber = "504";
      const flightDate = "2024-09-26";
  
      // Call the function to request flight delay data
      const tx = await flightDelayAPI.requestFlightData(flightNumber, flightDate);
      const receipt = await tx.wait(); // Wait for the transaction to complete
      console.log(receipt); // Log the entire receipt to debug

      if (receipt.events) {
        const event = receipt.events.find(event => event.event === "RequestSent");
        if (event) {
            const requestId = event.args.requestId;
            console.log("Request ID:", requestId.toString());
        } else {
            console.log("RequestSent event not found.");
        }
      } else {
        console.log("No events found in the receipt.");
      }

  
      // Capture the emitted event to get the requestId
      const event = receipt.events.find(event => event.event === "RequestSent");
      const requestId = event.args.requestId; // This is the real request ID from the event
      console.log("Request ID:", requestId.toString());
  
      // Mock the oracle's response (fulfill the request with a mock delay)
      const mockFlightDelay = ethers.toBigInt("30"); // Example delay of 30 minutes
      console.log('Flight delay:', mockFlightDelay);
  
      // Rename this to mockRequestId to avoid conflict
      const mockRequestId = ethers.keccak256(ethers.toUtf8Bytes("flight-delay-test-request")); // Mock requestId
      await mockOracle.fulfillOracleRequest(mockRequestId, mockFlightDelay); // Fulfill mock flight delay request
  
      // Verify that the flight delay is correctly updated
      const flightDelay = await flightDelayAPI.delay();
      expect(flightDelay).to.equal(mockFlightDelay);
  });
  
});
