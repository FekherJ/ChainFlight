const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("InsurancePolicy with Chainlink Oracle", function () {
  let insurancePolicy;
  let linkToken;
  let bytesSwap;  // Declare bytesSwap here to capture its address
  let mockOracle;  // Mock oracle for testing
  const jobId = "ca98366cc7314957b8c012c72f05aeeb";  // Pass it as a string
  const fee = ethers.parseEther("0.1");
  

  beforeEach(async function () {
    // Deploy the mock LINK token
    const LinkToken = await ethers.getContractFactory("MockLinkToken");
    linkToken = await LinkToken.deploy();
    await linkToken.waitForDeployment();

    // Deploy the bytesSwap library and capture its address
    const BytesSwap = await ethers.getContractFactory("bytesSwap");
    bytesSwap = await BytesSwap.deploy();
    await bytesSwap.waitForDeployment();  // Ensure that the library is deployed properly

    // Deploy the Mock Oracle
    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy(linkToken.target);
    await mockOracle.waitForDeployment();
    
    // Set up the correct constructor arguments
    const oracleAddress = mockOracle.target;  // Use the mock oracle address
    const linkTokenAddress = linkToken.target;  // Mock LINK token address

    // Link the bytesSwap library to the InsurancePolicy contract
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy", {
      libraries: {
        bytesSwap: bytesSwap.target,  // Use the correct bytesSwap address
      },
    });
    
    // Deploy the InsurancePolicy contract with proper arguments
    insurancePolicy = await InsurancePolicy.deploy(
      oracleAddress,
      jobId,
      fee,
      linkTokenAddress
    );
    await insurancePolicy.waitForDeployment();

    // Console logs
    console.log("LinkToken deployed at:", linkToken.target);
    console.log("bytesSwap deployed at:", bytesSwap.target);
    console.log("MockOracle deployed at:", mockOracle.target);
    console.log("InsurancePolicy deployed at:", insurancePolicy.target);
  });

  it("Should create a policy and simulate a Chainlink response", async function () {
    const [owner, insured] = await ethers.getSigners();

    // Create a policy
    await insurancePolicy.createPolicy(
      insured.address,
      ethers.parseEther("1"),
      ethers.parseEther("5"),
      "FL123"
    );

    const policy = await insurancePolicy.policies(1);
    expect(policy.insured).to.equal(insured.address);
    expect(policy.premium).to.equal(ethers.parseEther("1"));
    expect(policy.payoutAmount).to.equal(ethers.parseEther("5"));
    expect(policy.flightNumber).to.equal("FL123");

    // Simulate Chainlink flight status response
    const tx = await insurancePolicy.requestFlightStatus("FL123");
    const receipt = await tx.wait();

    // Retrieve the event emitted by Chainlink (usually RequestId is emitted)
    const event = receipt.events.find(event => event.event === "ChainlinkRequested");
    const requestId = event.args[0];  // Get the request ID from the event

    // Now simulate the fulfillment of the oracle's response
    await mockOracle.fulfillOracleRequest(requestId, 2);  // 2 -> Simulate flight delayed status

    // Check if flight status was updated to 'delayed'
    expect(await insurancePolicy.flightStatus()).to.equal(2);
  });
  
});
