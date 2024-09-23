const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with Chainlink Data Feed", function () {
  let insurancePolicy;
  let mockAggregator; // Mock Chainlink Aggregator for testing flight delay data
  let deployer, insured;
  
  const delayThreshold = 120; // Set a delay threshold of 120 minutes for testing

  beforeEach(async function () {
    // Get signers
    [deployer, insured] = await ethers.getSigners();
  
    // Deploy the Mock Aggregator for flight delay feed
    const MockAggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockAggregator = await MockAggregator.deploy(8, ethers.parseUnits("150", 8));  // Mock delay of 150 minutes
  
    // Deploy the InsurancePolicy contract with the mock aggregator
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
    insurancePolicy = await InsurancePolicy.deploy(mockAggregator.address);
    await insurancePolicy.deployed();  // Only the insurance policy requires .deployed()
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

    // Mock flight delay of 150 minutes (already set in beforeEach)
    const latestDelay = await insurancePolicy.getLatestFlightDelay();
    expect(latestDelay).to.equal(150);  // Ensure mock delay is working correctly

    // Trigger payout based on delay
    await expect(insurancePolicy.triggerPayout(1))
      .to.emit(insurancePolicy, "PayoutTriggered")
      .withArgs(1, insured.address, payoutAmount);

    const policy = await insurancePolicy.policies(1);
    expect(policy.isActive).to.equal(false);  // Policy should now be inactive after payout
  });

  it("Should not trigger payout if delay is below threshold", async function () {
    const premium = ethers.parseEther("1");  // 1 ETH premium
    const payoutAmount = ethers.parseEther("10");  // 10 ETH payout

    // Create a policy with a higher threshold of 180 minutes
    await insurancePolicy.createPolicy(insured.address, premium, payoutAmount, "FL124", 180);

    // Trigger payout should fail since delay is 150 minutes (below the threshold)
    await expect(insurancePolicy.triggerPayout(1)).to.be.revertedWith("Policy is not eligible for payout");
  });
});
