const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with Chainlink Oracle", function () {
  let insurancePolicy;
  let linkToken;
  const oracleAddress = "0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD";  // Chainlink Oracle Address
  //const jobId = ethers.utils.formatBytes32String("ca98366cc7314957b8c012c72f05aeeb");  // Chainlink Job ID for flight status
  const jobId = "ca98366cc7314957b8c012c72f05aeeb";  // Already in bytes32 format
  const fee = ethers.utils.parseEther("0.1");  // Chainlink fee in LINK tokens

  beforeEach(async function () {
    // Deploy the LinkToken contract (mock LINK token for Chainlink)
    const LinkToken = await ethers.getContractFactory("@chainlink/contracts/src/v0.8/mocks/MockLinkToken.sol");
    linkToken = await LinkToken.deploy();
    await linkToken.deployed();

    // Deploy the InsurancePolicy contract with the real Chainlink oracle and job ID
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
    insurancePolicy = await InsurancePolicy.deploy(oracleAddress, jobId, fee, linkToken.address);
    await insurancePolicy.deployed();
  });

  // Helper function to simulate Chainlink callback
  async function simulateChainlinkCallback(insurancePolicy, policyId, status) {
    // Simulate Chainlink Oracle fulfilling the request (e.g., flight is delayed with status = 2)
    await insurancePolicy.fulfillFlightStatus(policyId, status);
  }

  it("Should create a policy and simulate a Chainlink response", async function () {
    const [owner, insured] = await ethers.getSigners();

    // Create a new policy for flight "AA100"
    await insurancePolicy.createPolicy(insured.address, ethers.utils.parseEther("1"), ethers.utils.parseEther("10"), "AA100");

    // Verify that the policy is created successfully
    const policy = await insurancePolicy.policies(0);
    expect(policy.insured).to.equal(insured.address);
    expect(policy.premium).to.equal(ethers.utils.parseEther("1"));
    expect(policy.flightNumber).to.equal("AA100");

    // Simulate Chainlink callback with a delayed flight (status = 2)
    await simulateChainlinkCallback(insurancePolicy, 0, 2);  // Simulate flight delay
    
    // Verify payout and deactivation of the policy
    const updatedPolicy = await insurancePolicy.policies(0);
    expect(updatedPolicy.isActive).to.equal(false);  // Policy should be inactive after payout
  });

  it("Should trigger payout when flight is delayed", async function () {
    const [owner, insured] = await ethers.getSigners();
    const flightNumber = "AA100";  // Example flight number

    // Create a new policy
    await insurancePolicy.createPolicy(insured.address, ethers.utils.parseEther("1"), ethers.utils.parseEther("10"), flightNumber);

    // Simulate Chainlink callback with a delayed flight (status = 2)
    await simulateChainlinkCallback(insurancePolicy, 0, 2);  // Simulate flight delay

    // Verify the policy is deactivated and payout is triggered
    const updatedPolicy = await insurancePolicy.policies(0);
    expect(updatedPolicy.isActive).to.equal(false);  // Policy should be inactive after payout
  });

  it("Should not trigger payout if flight is on time", async function () {
    const [owner, insured] = await ethers.getSigners();
    const flightNumber = "AA100";  // Example flight number

    // Create a new policy
    await insurancePolicy.createPolicy(insured.address, ethers.utils.parseEther("1"), ethers.utils.parseEther("10"), flightNumber);

    // Simulate Chainlink callback with an on-time flight (status = 1)
    await simulateChainlinkCallback(insurancePolicy, 0, 1);  // Simulate flight on time

    // Verify that the policy remains active
    const updatedPolicy = await insurancePolicy.policies(0);
    expect(updatedPolicy.isActive).to.equal(true);  // Policy should remain active
  });
});
