const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with MockV3Aggregator", function () {
  let insurancePolicy;
  let mockAggregator;
  let deployer, insured;

  const delayThreshold = 120; // Set a delay threshold of 120 minutes for testing

  beforeEach(async function () {
    [deployer, insured] = await ethers.getSigners();

    // Deploy the MockV3Aggregator contract directly
    const MockAggregator = await ethers.getContractFactory("MockV3Aggregator");

    // Deploy the mock aggregator with 8 decimals and an initial value of 150
    mockAggregator = await MockAggregator.deploy(8, ethers.parseUnits("150", 8));  // Mock delay of 150 minutes

    // Check the mock aggregator address
    console.log("Mock Aggregator Address:", mockAggregator.address);
    expect(mockAggregator.address).to.not.be.null;  // Ensure it's not null

    // Deploy the InsurancePolicy contract using the mock aggregator
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
    insurancePolicy = await InsurancePolicy.deploy(mockAggregator.address);
    await insurancePolicy.deployed();
  });

  it("Should create a policy and emit PolicyCreated event", async function () {
    const premium = ethers.parseEther("1");  // 1 ETH premium
    const payoutAmount = ethers.parseEther("10");  // 10 ETH payout

    await expect(insurancePolicy.createPolicy(insured.address, premium, payoutAmount, "FL123", delayThreshold))
      .to.emit(insurancePolicy, "PolicyCreated")
      .withArgs(1, insured.address, premium, payoutAmount, "FL123");

    const policy = await insurancePolicy.policies(1);
    expect(policy.insured).to.equal(insured.address);
    expect(policy.premium).to.equal(premium);
    expect(policy.payoutAmount).to.equal(payoutAmount);
    expect(policy.delayThreshold).to.equal(delayThreshold);
  });

  it("Should trigger payout when delay exceeds threshold", async function () {
    const premium = ethers.parseEther("1");  // 1 ETH premium
    const payoutAmount = ethers.parseEther("10");  // 10 ETH payout

    // Create a policy
    await insurancePolicy.createPolicy(insured.address, premium, payoutAmount, "FL123", delayThreshold);

    // Fetch the latest delay from the mock aggregator
    const latestDelay = await insurancePolicy.getLatestFlightDelay();
    expect(latestDelay).to.equal(150);  // Ensure mock delay is set to 150 minutes

    // Trigger payout if the delay exceeds the threshold
    await expect(insurancePolicy.triggerPayout(1))
      .to.emit(insurancePolicy, "PayoutTriggered")
      .withArgs(1, insured.address, payoutAmount);

    const policy = await insurancePolicy.policies(1);
    expect(policy.isActive).to.equal(false);  // Ensure policy becomes inactive after payout
  });

  it("Should not trigger payout if delay is below threshold", async function () {
    const premium = ethers.parseEther("1");  // 1 ETH premium
    const payoutAmount = ethers.parseEther("10");  // 10 ETH payout

    // Create a policy with a higher threshold of 180 minutes
    await insurancePolicy.createPolicy(insured.address, premium, payoutAmount, "FL124", 180);

    // Attempt to trigger payout; should fail since the delay is 150 minutes (below the threshold)
    await expect(insurancePolicy.triggerPayout(1)).to.be.revertedWith("Policy is not eligible for payout");
  });
});
