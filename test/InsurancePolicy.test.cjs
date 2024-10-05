const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsurancePolicy with Mock Chainlink and FlightDelayAPI", function () {
    let insurancePolicy;
    let mockOracle;
    let mockLinkToken;
    let flightDelayAPI;
    let mockLinkTokenAddress;
    const jobId = "0xca98366cc7314957b8c012c72f05aeeb00000000000000000000000000000000";
    const fee = ethers.parseEther("0.1");

    let mockOracleAddress;

    beforeEach(async function () {

        // Deploy the MockLinkToken contract
        const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
        mockLinkToken = await MockLinkToken.deploy();
        await mockLinkToken.waitForDeployment();
        mockLinkTokenAddress = await mockLinkToken.getAddress();

        // Deploy the MockOracle contract
        const MockOracle = await ethers.getContractFactory("MockOracle");
        mockOracle = await MockOracle.deploy(mockLinkTokenAddress);
        await mockOracle.waitForDeployment();
        mockOracleAddress = await mockOracle.getAddress();  // Store the oracle address here

        // Deploy the InsurancePolicy contract
        const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
        insurancePolicy = await InsurancePolicy.deploy(mockOracleAddress, jobId, fee, mockLinkTokenAddress);
        await insurancePolicy.waitForDeployment();
        const insurancePolicyAddress = await insurancePolicy.getAddress();

        // Deploy the FlightDelayAPI contract
        const FlightDelayAPI = await ethers.getContractFactory("FlightDelayAPI");
        flightDelayAPI = await FlightDelayAPI.deploy(
            mockLinkTokenAddress,  // _linkToken
            mockOracleAddress,     // _oracle
            jobId,                 // _jobId (32-byte identifier for Chainlink job)
            fee                    // _fee (Fee for Chainlink requests, e.g., 0.1 LINK)
        );

        await flightDelayAPI.waitForDeployment();
        const flightDelayAPIAddress = await flightDelayAPI.getAddress();

        // Transfer some LINK tokens to the FlightDelayAPI and InsurancePolicy contracts
        await mockLinkToken.transfer(flightDelayAPIAddress, ethers.parseEther("9000"));
        await mockLinkToken.transfer(insurancePolicyAddress, ethers.parseEther("9000"));

        // Log LINK token balances of each contract
        const flightDelayAPILinkBalance = await mockLinkToken.balanceOf(flightDelayAPIAddress);
        const insurancePolicyLinkBalance = await mockLinkToken.balanceOf(insurancePolicyAddress);
    });


    it("Should create a policy and emit PolicyCreated event", async function () {
        const premiumAmount = ethers.parseEther("1");
        const payoutAmount = ethers.parseEther("10");

        await expect(insurancePolicy.createPolicy(premiumAmount, payoutAmount, "Flight123", { value: premiumAmount }))
            .to.emit(insurancePolicy, "PolicyCreated")
            .withArgs(1, (await ethers.getSigners())[0].getAddress(), premiumAmount);
    });

    it("Should request and fulfill flight delay data using Chainlink", async function () {
        const flightNumber = "504";
        const tx = await flightDelayAPI.requestFlightData(flightNumber);
        const receipt = await tx.wait();

        //console.log("Transaction Receipt:", JSON.stringify(receipt, null, 2));

        const FlightDelayAPI = await ethers.getContractFactory("FlightDelayAPI");
        const flightDelayInterface = FlightDelayAPI.interface;

        const parsedLogs = receipt.logs.map(log => {
            try {
                return flightDelayInterface.parseLog(log);
            } catch (error) {
                return null;
            }
        }).filter(log => log !== null);

        const requestSentEvent = parsedLogs.find(log => log.name === "RequestSent");
        if (!requestSentEvent) {
            throw new Error("RequestSent event not found or invalid.");
        }

        const requestId = requestSentEvent.args[0];
        //console.log("Request ID:", requestId.toString());

        const mockFlightDelay = ethers.toBigInt("30");
        await mockOracle.fulfillOracleRequest(requestId, mockFlightDelay, flightDelayAPI.getAddress());

        const flightDelayStatus = await flightDelayAPI.flightDelayStatus();
        expect(flightDelayStatus).to.equal(mockFlightDelay);
    });

    it("Should emit NoDelayReported event when there is no delay", async function () {
        const flightNumber = "504";
    
        // Send a request to fetch flight delay data
        const tx = await flightDelayAPI.requestFlightData(flightNumber);
        const receipt = await tx.wait();
    
        // Simulate no delay scenario
        const abiCoder = new ethers.AbiCoder();
        const event = receipt.logs.find(log => log.topics[0] === ethers.id("RequestSent(bytes32)"));
    
        if (event) {
            if (event.data && event.data !== '0x' && event.data.length > 0) {
                const decodedEvent = abiCoder.decode(["bytes32"], event.data);
                const requestId = decodedEvent[0];
                //console.log("Request ID:", requestId.toString());
    
                // Make sure the correct oracle fulfills the request
                await flightDelayAPI.setOracle(mockOracleAddress);
    
                // Fulfill oracle request with no delay (0 minutes)
                await mockOracle.fulfillOracleRequest(requestId, ethers.toBigInt("0"), flightDelayAPI.getAddress()); // No delay
    
                // Expect NoDelayReported event to be emitted
                await expect(mockOracle.fulfillOracleRequest(requestId, ethers.toBigInt("0"), flightDelayAPI.getAddress()))
                    .to.emit(insurancePolicy, "NoDelayReported")
                    .withArgs(requestId);
            } else {
                console.log("Event data is empty or invalid.");
            }
        } else {
            console.log("RequestSent event not found.");
        }
    });
    

    it("Should request flight delay data from the FlightDelayAPI contract", async function () {
        const flightNumber = "504";
        const tx = await flightDelayAPI.requestFlightData(flightNumber);
        const receipt = await tx.wait();
        //console.log("Transaction Receipt:", JSON.stringify(receipt, null, 2));

        const FlightDelayAPI = await ethers.getContractFactory("FlightDelayAPI");
        const flightDelayInterface = FlightDelayAPI.interface;

        const parsedLogs = receipt.logs.map(log => {
            try {
                return flightDelayInterface.parseLog(log);
            } catch (error) {
                return null;
            }
        }).filter(log => log !== null);

        const requestSentEvent = parsedLogs.find(log => log.name === "RequestSent");
        if (!requestSentEvent) {
            throw new Error("RequestSent event not found or invalid.");
        }

        const requestId = requestSentEvent.args[0];
        //console.log("Request ID:", requestId.toString());

        const mockFlightDelay = ethers.toBigInt("30");
        await mockOracle.fulfillOracleRequest(requestId, mockFlightDelay, flightDelayAPI.getAddress());

        const flightDelayStatus = await flightDelayAPI.flightDelayStatus();
        expect(flightDelayStatus).to.equal(mockFlightDelay);
    });

    it("Should request and fulfill flight delay data using Chainlink", async function () {
        const flightNumber = "504";
        const tx = await flightDelayAPI.requestFlightData(flightNumber);
        const receipt = await tx.wait();
    
        const FlightDelayAPI = await ethers.getContractFactory("FlightDelayAPI");
        const flightDelayInterface = FlightDelayAPI.interface;
    
        const parsedLogs = receipt.logs.map(log => {
            try {
                return flightDelayInterface.parseLog(log);
            } catch (error) {
                return null;
            }
        }).filter(log => log !== null);
    
        const requestSentEvent = parsedLogs.find(log => log.name === "RequestSent");
        if (!requestSentEvent) {
            throw new Error("RequestSent event not found or invalid.");
        }
    
        const requestId = requestSentEvent.args[0];
    
        // Fetch the oracle address
        const currentOracle = await flightDelayAPI.getOracle();
        console.log("Current Oracle Address:", currentOracle);  // Debug to ensure it's the correct oracle
    
        // Ensure oracle address matches the mock oracle address before fulfilling
        expect(currentOracle).to.equal(mockOracleAddress);
    
        const mockFlightDelay = ethers.toBigInt("30");
        await mockOracle.fulfillOracleRequest(requestId, mockFlightDelay, flightDelayAPI.getAddress());
    
        const flightDelayStatus = await flightDelayAPI.flightDelayStatus();
        expect(flightDelayStatus).to.equal(mockFlightDelay);
    });
    
    
    
});
