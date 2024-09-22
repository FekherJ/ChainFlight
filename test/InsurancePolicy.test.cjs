const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with Chainlink Oracle", function () {
  let insurancePolicy;
  let linkToken;
  let bytesSwap;  // Declare bytesSwap here to capture its address
  const oracleAddress = "0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD";  // Chainlink Oracle Address
  const jobId = "ca98366cc7314957b8c012c72f05aeeb";  // Pass it as a string
  const fee = ethers.parseEther("0.1");  // Chainlink fee in LINK tokens

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

    // Deploy the InsurancePolicy contract with the real Chainlink oracle and job ID
    insurancePolicy = await InsurancePolicy.deploy(oracleAddress, jobId, fee, linkToken.target);  // Pass jobId as string
    await insurancePolicy.waitForDeployment();  // Wait for deployment of the InsurancePolicy contract
  });

  it("Should create a policy and simulate a Chainlink response", async function () {
    const [owner, insured] = await ethers.getSigners();

    // Create a policy
    await insurancePolicy.createPolicy(insured.address, ethers.utils.parseEther("1"), ethers.utils.parseEther("5"), "FL123");

    const policy = await insurancePolicy.policies(1);
    expect(policy.insured).to.equal(insured.address);
    expect(policy.premium).to.equal(ethers.utils.parseEther("1"));
    expect(policy.payoutAmount).to.equal(ethers.utils.parseEther("5"));
    expect(policy.flightNumber).to.equal("FL123");

    // Simulate Chainlink flight status response (this would typically happen off-chain)
    await insurancePolicy.requestFlightStatus("FL123");
    await insurancePolicy.fulfill("0x", 2);  // Simulate delayed flight

    expect(await insurancePolicy.flightStatus()).to.equal(2);  // Check if flight is delayed
  });
});
