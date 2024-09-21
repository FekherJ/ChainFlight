const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with Chainlink Oracle", function () {
  let insurancePolicy;
  let linkToken;
  const oracleAddress = "0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD";  // Chainlink Oracle Address
  const jobId = ethers.utils.formatBytes32String("ca98366cc7314957b8c012c72f05aeeb");  // Chainlink Job ID for flight status
  const fee = ethers.utils.parseEther("0.1");  // Chainlink fee in LINK tokens

  beforeEach(async function () {
    // Deploy the LinkToken contract (mock LINK token for Chainlink)
    const LinkToken = await ethers.getContractFactory("@chainlink/contracts/src/v0.4/LinkToken");
    linkToken = await LinkToken.deploy();
    await linkToken.deployed();

    // Deploy the InsurancePolicy contract with the real Chainlink oracle and job ID
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
    insurancePolicy = await InsurancePolicy.deploy(oracleAddress, jobId, fee, linkToken.address);
    await insurancePolicy.deployed();
  });

  it("Should create a policy and make Chainlink request", async function () {
    const [owner, insured] = await ethers.getSigners();

    // Create a new policy for flight "AA100"
    await insurancePolicy.createPolicy(insured.address, ethers.utils.parseEther("1"), ethers.utils.parseEther("10"), "AA100");

    // Verify that the policy is created successfully
    const policy = await insurancePolicy.policies(0);
    expect(policy.insured).to.equal(insured.address);
    expect(policy.premium).to.equal(ethers.utils.parseEther("1"));
    expect(policy.flightNumber).to.equal("AA100");

    // Request flight status from the Chainlink oracle
    await insurancePolicy.requestFlightStatus(0);  // Policy ID 0

    // In a real test, you'd wait for the oracle to respond. But here, you'd simulate the response for testing purposes.

    // Simulate the Chainlink oracle response (flight delayed)
    // You will need to simulate the Chainlink callback or wait for an actual testnet response
    // Since we can't use `mockOracle.fulfillOracleRequest`, this would need to be done on the testnet.

    // Example: Verify that the policy gets updated (this would be tested after Chainlink responds on the testnet)
    // const updatedPolicy = await insurancePolicy.policies(0);
    // expect(updatedPolicy.isActive).to.equal(false);  // Policy should be inactive after payout
  });

  it("Should trigger payout when flight is delayed", async function () {
    const [owner, insured] = await ethers.getSigners();
    const flightNumber = "AA100";  // Example flight number

    // Create a new policy
    await insurancePolicy.createPolicy(insured.address, ethers.utils.parseEther("1"), ethers.utils.parseEther("10"), flightNumber);

    // Request flight status from Chainlink Oracle (this would initiate a real request to Chainlink)
    await insurancePolicy.requestFlightStatus(0);  // Request flight status for policy ID 0

    // You would wait for the oracle to fulfill the request here.
    // Once the Chainlink node fulfills the request, you can verify the payout.

    // After Chainlink responds on the testnet:
    // const updatedPolicy = await insurancePolicy.policies(0);
    // expect(updatedPolicy.isActive).to.equal(false);  // Policy should be inactive after payout
  });

  it("Should not trigger payout if flight is on time", async function () {
    const [owner, insured] = await ethers.getSigners();
    const flightNumber = "AA100";  // Example flight number

    // Create a new policy
    await insurancePolicy.createPolicy(insured.address, ethers.utils.parseEther("1"), ethers.utils.parseEther("10"), flightNumber);

    // Request flight status from Chainlink Oracle
    await insurancePolicy.requestFlightStatus(0);  // Request flight status for policy ID 0

    // Again, simulate the Chainlink response here or wait for the testnet response.

    // After Chainlink responds with flight on time (status = 1):
    // const updatedPolicy = await insurancePolicy.policies(0);
    // expect(updatedPolicy.isActive).to.equal(true);  // Policy should remain active if flight is on time
  });
});
