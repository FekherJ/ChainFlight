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
        

        // Deploy the FlightDelayAPI contract
        const FlightDelayAPI = await ethers.getContractFactory("FlightDelayAPI");
        flightDelayAPI = await FlightDelayAPI.deploy(mockOracleAddress, jobId, fee, mockLinkTokenAddress);
        await flightDelayAPI.waitForDeployment(); // Wait for deployment
        console.log('flightDelayAPI address:', await flightDelayAPI.getAddress());
    });

    it("Should create a policy and emit PolicyCreated event", async function () {
        const premiumAmount = ethers.parseEther("1");
        const payoutAmount = ethers.parseEther("10");

        console.log('insurancePolicy address:', await insurancePolicy.getAddress());
        
        // Test creating a policy and emitting the event
        await expect(insurancePolicy.createPolicy(premiumAmount, payoutAmount, { value: premiumAmount }))
            .to.emit(insurancePolicy, "PolicyCreated")
            .withArgs(1, (await ethers.getSigners())[0].getAddress(), premiumAmount);
    });

    it("Should request and fulfill insurance data using Chainlink", async function () {
        const apiEndpoint = "https://api.aviationstack.com/v1/flights?access_key=975d6fc4ac001e8fb0ad8d7bbfd7ee18"; // Example AviationStack API endpoint
        
        // Send a request to fetch insurance data
        const tx = await insurancePolicy.requestInsuranceData(apiEndpoint);
        await tx.wait(); // Wait for the transaction to complete

        // Mock the oracle's response (fulfill the request with a mock response)
        const mockResponse = ethers.parseUnits("5", 18);  // Example insurance rate of 5
        const requestId = ethers.keccak256(ethers.toUtf8Bytes("test-request")); // Mock requestId
        await mockOracle.fulfillOracleRequest(requestId, mockResponse); // Fulfill mock request

        // Verify the insurance rate is correctly updated
        const insuranceRate = await insurancePolicy.insuranceRate();
        expect(insuranceRate).to.equal(mockResponse);
    });

    it("Should request flight delay data from the FlightDelayAPI contract", async function () {
        const flightNumber = "XYZ123";
        const flightDate = "2024-09-26";

        // Call the function to request flight delay data
        const tx = await flightDelayAPI.requestFlightData(flightNumber, flightDate);
        await tx.wait(); // Wait for the transaction to complete

        // Mock the oracle's response (fulfill the request with a mock delay)
        const mockFlightDelay = ethers.parseUnits("30", 18);  // Example delay of 30 minutes
        const requestId = ethers.keccak256(ethers.toUtf8Bytes("flight-delay-test-request")); // Mock requestId
        await mockOracle.fulfillOracleRequest(requestId, mockFlightDelay); // Fulfill mock flight delay request

        // Verify that the flight delay is correctly updated
        const flightDelay = await flightDelayAPI.delay();
        expect(flightDelay).to.equal(mockFlightDelay);
    });
});
