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

    // Transfer LINK tokens to the InsurancePolicy contract to pay for the oracle request
    await linkToken.transfer(insurancePolicy.target, ethers.parseEther("10"));  // Transfer 10 LINK tokens

    // Console logs for deployment addresses
    console.log("LinkToken deployed at:", linkToken.target);
    console.log("bytesSwap deployed at:", bytesSwap.target);
    console.log("MockOracle deployed at:", mockOracle.target);
    console.log("InsurancePolicy deployed at:", insurancePolicy.target);
  });

  it("Should create a policy and simulate a Chainlink response", async function () {
      
    const [owner, insured] = await ethers.getSigners(); // Retrieve two signers: 'owner' and 'insured' to act as different accounts

    // Create a policy
    await insurancePolicy.createPolicy(
      insured.address,
      ethers.parseEther("1"), // premium
      ethers.parseEther("5"), // payout
      "FL123" // flight number
    );

    
    const policy = await insurancePolicy.policies(1);   // retreive created policy by Id

    // Check if the policy details match the expected values.
    expect(policy.insured).to.equal(insured.address);     // Ensure the insured address is correct.
    expect(policy.premium).to.equal(ethers.parseEther("1"));    // Ensure the premium is 1 ether.
    expect(policy.payoutAmount).to.equal(ethers.parseEther("5"));   // Ensure the payout is 5 ether.
    expect(policy.flightNumber).to.equal("FL123");    // Ensure the flight number matches.

    // Transfer LINK tokens to the InsurancePolicy contract and initiate a flight status request via Chainlink.
      // Arguments:
      // - insurancePolicy.address: The address of the insurance contract to which LINK tokens are sent.
      // - ethers.parseEther("0.1"): The amount of LINK tokens to send (0.1 LINK for the request).
      // - ethers.encodeBytes32String("FL123"): Encode the flight number "FL123" in bytes32 format (required by Chainlink).
   
    const tx = await linkToken.transferAndCall(
      insurancePolicy.address,
      ethers.parseEther("0.1"),
      ethers.encodeBytes32String("FL123") // Correct encoding of the flight number
    );

    // Wait for the transaction to be mined and get the receipt of the transaction.
    const receipt = await tx.wait();

    // Retrieve the 'ChainlinkRequested' event from the transaction receipt.
    const event = receipt.events.find(event => event.event === "ChainlinkRequested");
    
    if (!event) {
      console.log("ChainlinkRequested event not found. Check transaction receipt for details:", receipt);
    }
    const requestId = event.args[0];      // Extract the request ID from the event arguments (this is usually the first argument).

    // Now simulate the fulfillment of the oracle's response
    // The response indicates that the flight is delayed (2 represents the 'delayed' status).

    await mockOracle.fulfillOracleRequest(requestId, 2);  // 2 -> Simulate flight delayed status

    // Check if flight status was updated to 'delayed'
    expect(await insurancePolicy.flightStatus()).to.equal(2);
  });
  
});
