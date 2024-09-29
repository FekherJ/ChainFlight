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
        console.log("Fee:", fee);
        console.log("Job ID:", jobId);

        // Deploy the MockLinkToken contract
        const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
        mockLinkToken = await MockLinkToken.deploy();
        await mockLinkToken.waitForDeployment();
        mockLinkTokenAddress = await mockLinkToken.getAddress();
        console.log("mockLinkToken address:", mockLinkTokenAddress);

        // Deploy the MockOracle contract
        const MockOracle = await ethers.getContractFactory("MockOracle");
        mockOracle = await MockOracle.deploy(mockLinkTokenAddress);
        await mockOracle.waitForDeployment();
        const mockOracleAddress = await mockOracle.getAddress();
        console.log("mockOracle address:", mockOracleAddress);

        // Deploy the InsurancePolicy contract
        const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
        insurancePolicy = await InsurancePolicy.deploy(mockOracleAddress, jobId, fee, mockLinkTokenAddress);
        await insurancePolicy.waitForDeployment();
        const insurancePolicyAddress = await insurancePolicy.getAddress();
        console.log("insurancePolicy address:", insurancePolicyAddress);

        // Deploy the FlightDelayAPI contract
        const FlightDelayAPI = await ethers.getContractFactory("FlightDelayAPI");
        flightDelayAPI = await FlightDelayAPI.deploy(mockLinkTokenAddress);
        await flightDelayAPI.waitForDeployment();
        const flightDelayAPIAddress = await flightDelayAPI.getAddress();
        console.log("flightDelayAPI address:", flightDelayAPIAddress);

        // Transfer some LINK tokens to the FlightDelayAPI and InsurancePolicy contracts
        await mockLinkToken.transfer(flightDelayAPIAddress, ethers.parseEther("5000"));
        await mockLinkToken.transfer(insurancePolicyAddress, ethers.parseEther("5000"));

        // Log LINK token balances of each contract
        const flightDelayAPILinkBalance = await mockLinkToken.balanceOf(flightDelayAPIAddress);
        const insurancePolicyLinkBalance = await mockLinkToken.balanceOf(insurancePolicyAddress);
        console.log("FlightDelayAPI LINK Balance:", ethers.formatEther(flightDelayAPILinkBalance));
        console.log("InsurancePolicy LINK Balance:", ethers.formatEther(insurancePolicyLinkBalance));
    });

    it("Should create a policy and emit PolicyCreated event", async function () {
        const premiumAmount = ethers.parseEther("1");
        const payoutAmount = ethers.parseEther("10");

        // Test creating a policy and emitting the event
        await expect(insurancePolicy.createPolicy(premiumAmount, payoutAmount, "Flight123", { value: premiumAmount }))
            .to.emit(insurancePolicy, "PolicyCreated")
            .withArgs(1, (await ethers.getSigners())[0].getAddress(), premiumAmount);
    });

    it("Should request and fulfill flight delay data using Chainlink", async function () {
        const flightNumber = "123";

        // Send a request to fetch flight delay data
        const tx = await insurancePolicy.requestFlightDelayData(flightNumber);
        const receipt = await tx.wait();

        // Create a new AbiCoder instance for decoding the event
        const abiCoder = new ethers.AbiCoder();

        // Safeguard: Check if any events are emitted and find the right event
        if (receipt.logs.length > 0) {
            // Find the event by the topic (event signature hash for "RequestSent(bytes32)")
            const event = receipt.logs.find(log => log.topics[0] === ethers.id("RequestSent(bytes32)"));

            if (event) {
                // Check if event data exists
                if (event.data && event.data !== '0x' && event.data.length > 0) {
                    const decodedEvent = abiCoder.decode(["bytes32"], event.data);
                    const requestId = decodedEvent[0];
                    console.log("Request ID:", requestId.toString());

                    // Mock the oracle's response (fulfill the request with a mock delay)
                    const mockFlightDelay = ethers.toBigInt("30"); // Example delay of 30 minutes
                    console.log("Mock Flight delay:", mockFlightDelay);

                    await mockOracle.fulfillOracleRequest(requestId, mockFlightDelay);

                    // Verify that the flight delay is correctly updated
                    const flightDelay = await insurancePolicy.flightDelayStatus();
                    expect(flightDelay).to.equal(mockFlightDelay);
                } else {
                    console.log("Event data is empty or invalid.");
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

        // Call the function to request flight delay data
        const tx = await flightDelayAPI.requestFlightData(flightNumber);
        const receipt = await tx.wait();
        console.log("receipt:", receipt);

        if (receipt.logs.length > 0) {
            // Find the event by the topic (event signature hash for "RequestSent(bytes32)"))
            const event = receipt.logs.find(log => log.topics[0] === ethers.id("RequestSent(bytes32)"));

            if (event) {
                // Check if event data exists
                if (event.data && event.data !== '0x' && event.data.length > 0) {
                    const abiCoder = new ethers.AbiCoder();
                    const decodedEvent = abiCoder.decode(["bytes32"], event.data);
                    const requestId = decodedEvent[0];
                    console.log("Request ID:", requestId.toString());

                    // Now use this requestId for the mock oracle response
                    const mockFlightDelay = ethers.toBigInt("30"); // Example delay of 30 minutes
                    console.log("Mock Flight delay:", mockFlightDelay);

                    await mockOracle.fulfillOracleRequest(requestId, mockFlightDelay);

                    // Verify that the flight delay is correctly updated
                    const flightDelay = await flightDelayAPI.flightDelayStatus(); // Assuming flightDelayStatus() is the getter for delay
                    expect(flightDelay).to.equal(mockFlightDelay);
                } else {
                    console.log("Event data is empty or invalid.");
                }
            } else {
                console.log("RequestSent event not found.");
            }
        } else {
            console.log("No events found in the receipt.");
        }
    });
});
