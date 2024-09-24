const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const InsurancePolicy = await hre.ethers.getContractFactory("InsurancePolicy");

    // Replace with your Oracle address, Job ID, fee, and API Key
    const oracle = "0xYourOracleAddress";
    const jobId = "YourJobID"; 
    const fee = hre.ethers.utils.parseEther("0.1"); // 0.1 LINK
    const apiKey = "YourAPIKey"; // Replace with your actual API key

    const insurancePolicy = await InsurancePolicy.deploy(oracle, jobId, fee, apiKey);
    await insurancePolicy.deployed();

    console.log("InsurancePolicy deployed to:", insurancePolicy.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
