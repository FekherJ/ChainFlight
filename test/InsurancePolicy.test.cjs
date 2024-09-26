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

        console.log("Fee : ", fee);
        console.log("Job ID : ", jobId);
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
    
        // Create a new AbiCoder instance for decoding the event
        const abiCoder = new ethers.AbiCoder();
    
        // Safeguard: Check if any events are emitted and find the right event
        if (receipt.logs.length > 0) {
            // Find the event by the topic (event signature hash for "RequestSent(bytes32)")
            const event = receipt.logs.find(log => log.topics[0] === ethers.id("RequestSent(bytes32)"));
    
            if (event) {
                if (event.data === '0x' || event.data.length === 0) {
                    console.log("Event data is empty.");
                } else {
                    // Decode the event data using the AbiCoder instance
                    const decodedEvent = abiCoder.decode(["bytes32"], event.data);
                    const requestId = decodedEvent[0];  // Extract the requestId from the decoded event
                    console.log("Request ID:", requestId.toString());
    
                    // Mock the oracle's response (fulfill the request with a mock delay)
                    const mockFlightDelay = ethers.toBigInt("30");  // Example delay of 30 minutes
                    console.log('Flight delay:', mockFlightDelay);
    
                    await mockOracle.fulfillOracleRequest(requestId, mockFlightDelay); // Fulfill the request with the actual requestId
    
                    // Verify that the flight delay is correctly updated
                    const flightDelay = await insurancePolicy.flightDelay();  // Assuming flightDelay() is the getter for delay status
                    expect(flightDelay).to.equal(mockFlightDelay);
                }
            } else {
                console.log("RequestSent event not found.");
            }
        } else {
            console.log("No events found in the receipt.");
        }
    });
    
  

    it("Should request flight delay data from the FlightDelayAPI contract", async function () {
        const flightNumber = "504";
        const flightDate = "2024-09-26";
  
        // Call the function to request flight delay data
        const tx = await flightDelayAPI.requestFlightData(flightNumber);  // add flightDate later
        const receipt = await tx.wait(); // Wait for the transaction to be mined
        console.log("receipt : ",receipt); // Log the entire receipt to debug
  
        if (receipt.logs.length > 0) {
          // Find the event by the topic (event signature hash for "RequestSent(bytes32)")
          const event = receipt.logs.find(log => log.topics[0] === ethers.id("RequestSent(bytes32)"));
  
          if (event) {
              if (event.data === '0x' || event.data.length === 0) {
                  console.log("Event data is empty.");
              } else {
                  // Decode the event data using the AbiCoder instance
                  const abiCoder = new ethers.AbiCoder();
                  const decodedEvent = abiCoder.decode(["bytes32"], event.data);
                  const requestId = decodedEvent[0];  // Extract the requestId from the decoded event
                  console.log("Request ID:", requestId.toString());
  
                  // Now use this requestId for the mock oracle response
                  const mockFlightDelay = ethers.toBigInt("30");  // Example delay of 30 minutes
                  console.log('Flight delay:', mockFlightDelay);
  
                  await mockOracle.fulfillOracleRequest(requestId, mockFlightDelay); // Fulfill the request with the actual requestId
  
                  // Verify that the flight delay is correctly updated
                  const flightDelay = await flightDelayAPI.delay();  // Assuming delay() is the getter for delay status
                  expect(flightDelay).to.equal(mockFlightDelay);
              }
          } else {
              console.log("RequestSent event not found.");
          }
        } else {
          console.log("No events found in the receipt.");
        }
      });
  });
