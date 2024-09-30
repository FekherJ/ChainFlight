const { ethers } = require("ethers");
const hre = require("hardhat");

async function main() {
    // Use Ethers.js provider instead of Hardhat's specific provider
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545"); // Hardhat node

    // Get the first signer from the provider
    const signer = provider.getSigner();

    // Step 1: Deploy MockLinkToken contract using the signer
    const MockLinkTokenFactory = await hre.artifacts.readArtifact("MockLinkToken");
    const MockLinkToken = new ethers.ContractFactory(MockLinkTokenFactory.abi, MockLinkTokenFactory.bytecode, signer);
    const mockLinkToken = await MockLinkToken.deploy();
    await mockLinkToken.deployed();
    const mockLinkTokenAddress = mockLinkToken.address;
    console.log("MockLinkToken deployed to:", mockLinkTokenAddress);

    // Step 2: Deploy MockOracle contract
    const MockOracleFactory = await hre.artifacts.readArtifact("MockOracle");
    const MockOracle = new ethers.ContractFactory(MockOracleFactory.abi, MockOracleFactory.bytecode, signer);
    const mockOracle = await MockOracle.deploy(mockLinkTokenAddress);
    await mockOracle.deployed();
    const mockOracleAddress = mockOracle.address;
    console.log("MockOracle deployed to:", mockOracleAddress);

    // Step 3: Prepare parameters for FlightDelayAPI contract
    const jobId = ethers.utils.formatBytes32String("mock-job-id");
    const fee = ethers.utils.parseEther("0.1");

    // Step 4: Deploy FlightDelayAPI contract
    const FlightDelayAPIFactory = await hre.artifacts.readArtifact("FlightDelayAPI");
    const FlightDelayAPI = new ethers.ContractFactory(FlightDelayAPIFactory.abi, FlightDelayAPIFactory.bytecode, signer);
    const flightDelayAPI = await FlightDelayAPI.deploy(mockOracleAddress, jobId, fee, mockLinkTokenAddress);
    await flightDelayAPI.deployed();
    const flightDelayAPIAddress = flightDelayAPI.address;
    console.log("FlightDelayAPI deployed to:", flightDelayAPIAddress);

    // Step 5: Deploy InsurancePolicy contract
    const InsurancePolicyFactory = await hre.artifacts.readArtifact("InsurancePolicy");
    const InsurancePolicy = new ethers.ContractFactory(InsurancePolicyFactory.abi, InsurancePolicyFactory.bytecode, signer);
    const insurancePolicy = await InsurancePolicy.deploy(flightDelayAPIAddress, mockLinkTokenAddress);
    await insurancePolicy.deployed();
    const insurancePolicyAddress = insurancePolicy.address;
    console.log("InsurancePolicy deployed to:", insurancePolicyAddress);

    // Output deployed contract addresses
    console.log("Deployed Contracts:");
    console.log(`MockLinkToken: ${mockLinkTokenAddress}`);
    console.log(`MockOracle: ${mockOracleAddress}`);
    console.log(`FlightDelayAPI: ${flightDelayAPIAddress}`);
    console.log(`InsurancePolicy: ${insurancePolicyAddress}`);
}

main().catch((error) => {
    console.error("Error deploying contracts:", error);
    process.exitCode = 1;
});
