require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol");

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY", // Replace with your Alchemy Sepolia URL
      accounts: ["YOUR_PRIVATE_KEY"],  // Add your private key here
    },
  },
  etherscan: {
    apiKey: "YOUR_ETHERSCAN_API_KEY",  // Etherscan API key
  },
};
