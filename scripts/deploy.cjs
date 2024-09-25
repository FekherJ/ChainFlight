// scripts/deploy.js
const hre = require("hardhat");

async function main() {
    // Define the contract and parameters
    const oracle = "0xYourChainlinkOracleAddress"; // Replace with the actual Chainlink Oracle address
    const jobId = hre.ethers.encodeBytes32String("YourJobID"); // Replace with your job ID
    const fee = hre.ethers.parseEther("0.1"); // Chainlink fee for the request
    const linkToken = "0xYourLinkTokenAddress"; // Replace with LINK token address on your network

    // Deploy the FlightDelayAPI contract
    const FlightDelayAPI = await hre.ethers.getContractFactory("FlightDelayAPI");
    const flightDelayAPI = await FlightDelayAPI.deploy(oracle, jobId, fee, linkToken);

    await flightDelayAPI.waitForDeployment();
    console.log("FlightDelayAPI deployed to:", await flightDelayAPI.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
