const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with MockV3Aggregator", function () {
  let insurancePolicy;
  let mockAggregator;
  let deployer, insured;

  const delayThreshold = 120; // 120 minutes delay threshold for testing

  beforeEach(async function () {
    [deployer, insured] = await ethers.getSigners();

    // Fully qualified path to MockV3Aggregator contract
    const MockAggregator = await ethers.getContractFactory("contracts/MockV3Aggregator.sol:MockV3Aggregator");

    // Deploy the mock aggregator with 8 decimals and an initial value of 150
    mockAggregator = await MockAggregator.deploy(8, ethers.parseUnits("150", 8));

    // Wait for the contract to be deployed using waitForDeployment()
    await mockAggregator.waitForDeployment();

    // Check the mock aggregator address
    console.log("Mock Aggregator Address:", mockAggregator.target); // for ethers.js v6
    expect(mockAggregator.target).to.not.be.null; // Ensure it's not null

    // Deploy the InsurancePolicy contract using the mock aggregator address
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
    insurancePolicy = await InsurancePolicy.deploy(mockAggregator.target); // pass target address here
    await insurancePolicy.waitForDeployment();
  });

  it("Should create a policy and emit PolicyCreated event", async function () {
    const premium = ethers.parseEther("1"); // 1 ETH premium
    const payoutAmount = ethers.parseEther("10"); // 10 ETH payout

    // Expect the createPolicy call to emit the PolicyCreated event
    await expect(
      insurancePolicy.createPolicy(insured.address, premium, payoutAmount, "FL123", delayThreshold)
    ).to.emit(insurancePolicy, "PolicyCreated")
      .withArgs(1, insured.address, premium, payoutAmount, "FL123");
  });

  it("Should trigger payout when delay exceeds threshold", async function () {
    const premium = ethers.parseEther("1"); // 1 ETH premium
    const payoutAmount = ethers.parseEther("10"); // 10 ETH payout

    // Create a policy
    await insurancePolicy.createPolicy(insured.address, premium, payoutAmount, "FL123", delayThreshold);

    // Fetch the latest delay from the mock aggregator
    const latestDelay = await insurancePolicy.getLatestFlightDelay();

    // Ensure that the delay returned by the mock aggregator is correct (150 in mock)
    expect(latestDelay).to.equal(ethers.parseUnits("150", 8)); // Mock value

    // Now, trigger payout if the delay exceeds the threshold
    await expect(insurancePolicy.triggerPayout(1))
      .to.emit(insurancePolicy, "PayoutTriggered")
      .withArgs(1, insured.address, payoutAmount);
  });
});
