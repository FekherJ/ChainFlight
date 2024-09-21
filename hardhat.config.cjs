require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/contracts");


module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/Gmhk1a1JbcZoVjYofo6_HDNtgQVXGnQM", // Replace with your Alchemy Sepolia URL
      accounts: ["kbsqngfvaqev48cn"],  // Add your private key here
    },
  },
  etherscan: {
    apiKey: "Gmhk1a1JbcZoVjYofo6_HDNtgQVXGnQM",  // Etherscan API key
  },
};
