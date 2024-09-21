const { ethers } = require('hardhat');


async function main() {
  const oracle = "ORACLE_ADDRESS";  // Replace with your Chainlink flight data oracle
  const jobId = ethers.utils.formatBytes32String("JOB_ID");  // Replace with the correct Job ID
  const fee = ethers.utils.parseEther("0.1");  // Chainlink fee in LINK tokens
  const linkToken = "LINK_TOKEN_ADDRESS";  // LINK token address on Sepolia

  const InsurancePolicy = await ethers.getContractFactory("InsurancePolicy");
  const insurance = await InsurancePolicy.deploy(oracle, jobId, fee, linkToken);
  await insurance.waitForDeployment();

  console.log("InsurancePolicy deployed to:", insurance.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
