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
    



    // Link the bytesSwap library to the InsurancePolicy contract
    const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy", {
      libraries: {
        bytesSwap: bytesSwap.target,  // Use the correct bytesSwap address
      },
    });
    


    // Deploy the InsurancePolicy contract with only the job ID
    insurancePolicy = await InsurancePolicy.deploy(jobId);  // Pass only jobId as string
    await insurancePolicy.waitForDeployment();  // Wait for deployment of the InsurancePolicy contract





    // Fund the InsurancePolicy contract with LINK tokens for making the request
    await linkToken.transfer(insurancePolicy.target, ethers.parseEther("1"));
  });

  it("Should create a policy and simulate a Chainlink response", async function () {
    const [owner, insured] = await ethers.getSigners();

 

    // Create a policy
    await insurancePolicy.createPolicy(
      insured.address,
      ethers.parseEther("1"),  // Fix: ensure proper reference to ethers.utils.parseEther
      ethers.parseEther("5"),
      "FL123"
    );

    console.log("LinkToken deployed at:", linkToken.target);
    console.log("bytesSwap deployed at:", bytesSwap.target);
    console.log("MockOracle deployed at:", mockOracle.target);
    console.log("insurancePolicy deployed at:", insurancePolicy.target);
    // ALL OK AT THIS POINT

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
