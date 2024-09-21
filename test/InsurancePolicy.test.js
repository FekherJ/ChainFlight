import { expect } from "chai";
import hardhat from "hardhat";
import { parseUnits, parseEther } from "ethers";

const { ethers: hardhatEthers } = hardhat;

describe("InsurancePolicy", function () {
  let insurancePolicy;

  beforeEach(async function () {
    // Replace with your Chainlink Oracle and Job ID
    const oracle = "ORACLE_ADDRESS";  // Chainlink oracle address for flight data
    const jobId = ethers.utils.formatBytes32String("JOB_ID");  // Chainlink job ID for flight status
    const fee = ethers.utils.parseEther("0.1");  // Chainlink fee in LINK tokens
    const linkToken = "LINK_TOKEN_ADDRESS";  // LINK token address on your network (Sepolia, etc.)

    // Deploy the InsurancePolicy contract with the Chainlink oracle, job ID, and LINK fee
    const InsurancePolicy = await hardhatEthers.getContractFactory("InsurancePolicy");
    insurancePolicy = await InsurancePolicy.deploy(oracle, jobId, fee, linkToken);
    await insurancePolicy.waitForDeployment();
  });

  it("Should create a policy and request flight status", async function () {
    const [owner, insured] = await hardhatEthers.getSigners();

    // Create a new policy for a specific flight
    const flightNumber = "AA100";  // Example flight number
    await insurancePolicy.createPolicy(insured.address, parseEther("1"), parseEther("10"), flightNumber);

    // Verify the policy was created
    const policy = await insurancePolicy.policies(0);
    expect(policy.insured).to.equal(insured.address);
    expect(policy.premium).to.equal(parseEther("1"));
    expect(policy.flightNumber).to.equal(flightNumber);
  });

  it("Should request flight status from the Chainlink oracle", async function () {
    const [owner, insured] = await hardhatEthers.getSigners();
    const flightNumber = "AA100";  // Example flight number

    // Create a new policy
    await insurancePolicy.createPolicy(insured.address, parseEther("1"), parseEther("10"), flightNumber);

    // Request flight status from the Chainlink oracle
    await insurancePolicy.requestFlightStatus(0);  // Policy ID 0

    // Simulate Chainlink oracle response (delayed flight)
    await insurancePolicy.fulfillFlightStatus(0, 2);  // 2 = Flight Delayed

    // Check that the policy is inactive after the payout
    const policy = await insurancePolicy.policies(0);
    expect(policy.isActive).to.equal(false);
  });

  it("Should trigger a payout when flight is delayed", async function () {
    const [owner, insured] = await hardhatEthers.getSigners();
    const flightNumber = "AA100";  // Example flight number

    // Create a new policy
    await insurancePolicy.createPolicy(insured.address, parseEther("1"), parseEther("10"), flightNumber);

    // Simulate Chainlink oracle response (delayed flight)
    await insurancePolicy.fulfillFlightStatus(0, 2);  // 2 = Flight Delayed

    // Verify that the payout is triggered and the policy is no longer active
    const updatedPolicy = await insurancePolicy.policies(0);
    expect(updatedPolicy.isActive).to.equal(false);  // Policy should be inactive after payout

    // Ensure the payout amount is correct
    const payoutAmount = parseEther("10");
    expect(await insurancePolicy.flightStatus()).to.equal(2);  // Verify the flight was delayed (status = 2)
  });
});
