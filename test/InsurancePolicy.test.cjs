const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with Chainlink Oracle", function () {
  let insurancePolicy;
  let linkToken;
  let bytesSwap;  // Declare bytesSwap here to capture its address
  const jobId = "ca98366cc7314957b8c012c72f05aeeb";  // Pass it as a string

  beforeEach(async function () {
    // Deploy the LinkToken contract (mock LINK token for Chainlink)
    const LinkToken = await ethers.getContractFactory("MockLinkToken");
    linkToken = await LinkToken.deploy();
    await linkToken.waitForDeployment();

    // Deploy the bytesSwap library and capture its address
    const BytesSwap = await ethers.getContractFactory("bytesSwap");
    bytesSwap = await BytesSwap.deploy();
    await bytesSwap.waitForDeployment();  // Ensure that the library is deployed properly

    // Link the bytesSwap library to the InsurancePolicy contract
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy", {
      libraries: {
        bytesSwap: bytesSwap.target,  // Use the correct bytesSwap address
      },
    });

    // Deploy the InsurancePolicy contract with only the job ID
    insurancePolicy = await InsurancePolicy.deploy(jobId);  // Pass only jobId as string
    await insurancePolicy.waitForDeployment();  // Wait for deployment of the InsurancePolicy contract
  });

  it("Should create a policy and simulate a Chainlink response", async function () {
    const [owner, insured] = await ethers.getSigners();

    // Create a policy
    await insurancePolicy.createPolicy(insured.address, ethers.parseEther("1"), ethers.parseEther("5"), "FL123");

    const policy = await insurancePolicy.policies(1);
    expect(policy.insured).to.equal(insured.address);
    expect(policy.premium).to.equal(ethers.parseEther("1"));
    expect(policy.payoutAmount).to.equal(ethers.parseEther("5"));
    expect(policy.flightNumber).to.equal("FL123");

    // Simulate Chainlink flight status response (this would typically happen off-chain)
    await insurancePolicy.requestFlightStatus("FL123");
    await insurancePolicy.fulfill("0x", 2);  // Simulate delayed flight

    expect(await insurancePolicy.flightStatus()).to.equal(2);  // Check if flight is delayed
  });
});
