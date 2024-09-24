const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with Mock Chainlink", function () {
  let insurancePolicy;
  let deployer, insured;

  const delayThreshold = 120; // 120 minutes delay threshold for testing

  beforeEach(async function () {
    [deployer, insured] = await ethers.getSigners();

    // Deploy the InsurancePolicy contract
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");

    // Mock Oracle, Job ID, fee, and API Key for Chainlink Any API integration
    const oracle = "0xMockOracleAddress";  // Replace with your actual mock address or Chainlink Oracle address
    const jobId = ethers.encodeBytes32String("mockJobId");  // Updated for ethers.js v6
    const fee = ethers.parseEther("0.1");  // 0.1 LINK (ethers.js v6)
    const apiKey = "mockAPIKey";  // Replace with your actual mock API key

    insurancePolicy = await InsurancePolicy.deploy(oracle, jobId, fee, apiKey);
    await insurancePolicy.waitForDeployment();  // waitForDeployment for ethers.js v6

    // Fund the contract with 10 ETH to cover payouts
    await deployer.sendTransaction({
      to: insurancePolicy.getAddress(),  // Use getAddress() in ethers v6
      value: ethers.parseEther("10")  // Fund with 10 ETH (ethers.js v6)
    });
  });

  it("Should create a policy and emit PolicyCreated event", async function () {
    const premium = ethers.parseEther("1"); // 1 ETH premium (ethers.js v6)
    const payoutAmount = ethers.parseEther("10"); // 10 ETH payout (ethers.js v6)

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

    // Simulate Oracle fulfilling the request with delay exceeding threshold
    const requestId = ethers.encodeBytes32String("mockRequestId");  // Mock Request ID for ethers.js v6
    await insurancePolicy.fulfill(requestId, 150);  // Simulate a 150-minute delay response

    // Fetch the latest delay
    const latestDelay = await insurancePolicy.flightDelay();

    // Ensure the delay returned is correct (150 minutes)
    expect(latestDelay).to.equal(150);

    // Now, trigger payout if the delay exceeds the threshold
    await expect(insurancePolicy.triggerPayout(1))
      .to.emit(insurancePolicy, "PayoutTriggered")
      .withArgs(1, insured.address, payoutAmount);
  });
});
