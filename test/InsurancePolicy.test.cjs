const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsurancePolicy with Mock Chainlink", function () {
    let insurancePolicy;
    let mockOracle;
    let mockLinkToken;
    const oracle = "0x0000000000000000000000000000000000000000";  // Mock address for oracle
    const jobId = ethers.encodeBytes32String("test-job-id");
    const fee = ethers.parseEther("0.1");
    const linkTokenAddress = "0x0000000000000000000000000000000000000000"; // Mock address for LINK token

    beforeEach(async function () {
        // Deploy the MockLinkToken contract
        const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
        mockLinkToken = await MockLinkToken.deploy();
        await mockLinkToken.waitForDeployment();
        console.log('mockLinkToken address:',mockLinkToken.getAddress());
        

        // Deploy the MockOracle contract
        const MockOracle = await ethers.getContractFactory("MockOracle");
        mockOracle = await MockOracle.deploy(mockLinkToken.getAddress());
        await mockOracle.waitForDeployment();
        console.log('mockOracle address:',mockOracle.getAddress());
        const MockOracleAddress = await mockOracle.getAddress

        // Deploy the InsurancePolicy contract
        const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
        insurancePolicy = await InsurancePolicy.deploy(MockOracleAddress , jobId, fee, mockLinkToken.address);
        await insurancePolicy.waitForDeployment();
        console.log('insurancePolicy address:',insurancePolicy.getAddress());
    });

    it("Should create a policy and emit PolicyCreated event", async function () {
        const premiumAmount = ethers.parseEther("1");
        const payoutAmount = ethers.parseEther("10");

        await expect(insurancePolicy.createPolicy(premiumAmount, payoutAmount, { value: premiumAmount }))
            .to.emit(insurancePolicy, "PolicyCreated")
            .withArgs(1, (await ethers.getSigners())[0].address, premiumAmount);
    });
});
