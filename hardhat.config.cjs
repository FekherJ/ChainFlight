require("@nomicfoundation/hardhat-toolbox");


module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY", // Replace with your Alchemy Sepolia URL
      accounts: ["6fa9e592a125e7a6de0fbce7d11e41de188bffea8dfeb33e1c9648c9e5d7a575"],  // Add your private key here
    },
  },
  etherscan: {
    apiKey: "YOUR_ETHERSCAN_API_KEY",  // Etherscan API key
  },
};
