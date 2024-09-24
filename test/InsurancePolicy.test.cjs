const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MockProvider } = require("ethereum-waffle");

describe("InsurancePolicy with Mock Chainlink", function () {
    let insurancePolicy;
    let owner;
    let addr1;
    let mockChainlinkOracle;
    let linkToken;
    let jobId;
    let fee;
    const mockChainlinkPrice = ethers.parseUnits("1000", 18);

    beforeEach(async function () {
        // Deploy Mock LINK Token
        const LinkToken = await ethers.getContractFactory("LinkToken");
        linkToken = await LinkToken.deploy();
        await linkToken.deployed();

        // Deploy Mock Chainlink Oracle
        const MockChainlinkOracle = await ethers.getContractFactory("MockChainlinkOracle");
        mockChainlinkOracle = await MockChainlinkOracle.deploy(linkToken.address);
        await mockChainlinkOracle.deployed();

        // Set Chainlink parameters
        jobId = ethers.utils.formatBytes32String("jobId");
        fee = ethers.parseUnits("1", 18); // 1 LINK

        // Deploy the InsurancePolicy contract
        const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
        [owner, addr1] = await ethers.getSigners();
        insurancePolicy = await InsurancePolicy.deploy(
            mockChainlinkOracle.address,
            jobId,
            fee,
            linkToken.address
        );
        await insurancePolicy.deployed();
    });

    it("Should create a policy and emit PolicyCreated event", async function () {
        const policyAmount = ethers.parseUnits("10", 18); // 10 ether
        await expect(insurancePolicy.connect(addr1).createPolicy(policyAmount))
            .to.emit(insurancePolicy, "PolicyCreated")
            .withArgs(addr1.address, policyAmount);

        const policy = await insurancePolicy.policies(addr1.address);
        expect(policy.amount).to.equal(policyAmount);
    });

    it("Should request Chainlink data and emit PolicyUpdated event", async function () {
        const policyAmount = ethers.parseUnits("10", 18); // 10 ether

        // Create a policy
        await insurancePolicy.connect(addr1).createPolicy(policyAmount);

        // Mock the Chainlink price update response
        await mockChainlinkOracle.mockResponse(jobId, mockChainlinkPrice);

        await expect(insurancePolicy.connect(owner).requestPolicyUpdate(addr1.address))
            .to.emit(insurancePolicy, "PolicyUpdated")
            .withArgs(addr1.address, mockChainlinkPrice);

        const updatedPolicy = await insurancePolicy.policies(addr1.address);
        expect(updatedPolicy.amount).to.equal(mockChainlinkPrice);
    });
});
