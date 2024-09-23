const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with Chainlink Oracle", function () {
  let insurancePolicy;
  let linkToken;
  let bytesSwap;  // Declare bytesSwap here to capture its address
  let mockOracle;  // Mock oracle for testing
  const fee = ethers.parseEther("0.1");
  const jobId = ethers.encodeBytes32String("ca98366cc7314957b8c012c72f05aeeb"); // Use encodeBytes32String for ethers.js v6
  
  beforeEach(async function () {
    // Deploy the mock LINK token
    const LinkToken = await ethers.getContractFactory("MockLinkToken");
    linkToken = await LinkToken.deploy();
    await linkToken.waitForDeployment();

    // Deploy the Mock Oracle
    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy(await linkToken.getAddress());
    await mockOracle.waitForDeployment();

    // Set up the correct constructor arguments
    const oracleAddress = await mockOracle.getAddress();
    const linkTokenAddress = await linkToken.getAddress();

    // Deploy the InsurancePolicy contract without linking the bytesSwap library
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
    
    // Deploy the InsurancePolicy contract with proper arguments
    insurancePolicy = await InsurancePolicy.deploy(
      oracleAddress,
      jobId,  // Pass the correctly encoded jobId here
      fee,
      linkTokenAddress
    );
    await insurancePolicy.waitForDeployment();

    // Transfer LINK tokens to the InsurancePolicy contract to pay for the oracle request
    await linkToken.transfer(await insurancePolicy.getAddress(), ethers.parseEther("10"));

    // Console logs for deployment addresses
    console.log("LinkToken deployed at:", linkTokenAddress);
    console.log("MockOracle deployed at:", oracleAddress);
    console.log("InsurancePolicy deployed at:", await insurancePolicy.getAddress());
  });

  it("Should create a policy and emit PolicyCreated event", async function () {
    const [owner, insured] = await ethers.getSigners();

    // Create a policy
    await expect(
      insurancePolicy.createPolicy(
        insured.address,
        ethers.parseEther("1"),
        ethers.parseEther("5"),
        "FL123"
      )
    ).to.emit(insurancePolicy, "PolicyCreated")
    .withArgs(1, insured.address, ethers.parseEther("1"), ethers.parseEther("5"), "FL123");

    const policy = await insurancePolicy.policies(1);
    expect(policy.insured).to.equal(insured.address);
    expect(policy.premium).to.equal(ethers.parseEther("1"));
    expect(policy.payoutAmount).to.equal(ethers.parseEther("5"));
    expect(policy.flightNumber).to.equal("FL123");
  });

  it("Should simulate a Chainlink response", async function () {
    const [owner, insured] = await ethers.getSigners();

    // Create a policy
    await insurancePolicy.createPolicy(
      insured.address,
      ethers.parseEther("1"),
      ethers.parseEther("5"),
      "FL123"
    );

    const tx = await linkToken.transferAndCall(
      insurancePolicy.address,
      ethers.parseEther("0.1"),
      ethers.encodeBytes32String("FL123") // Correct encoding for ethers.js v6
    );

    const receipt = await tx.wait();

    const event = receipt.events.find(event => event.event === "ChainlinkRequested");
    expect(event).to.not.be.undefined;
    const requestId = event.args[0];

    await mockOracle.fulfillOracleRequest(requestId, 2);

    expect(await insurancePolicy.flightStatus()).to.equal(2);
  });
});
