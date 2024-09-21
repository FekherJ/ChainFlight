import "@nomicfoundation/hardhat-toolbox";
import "@chainlink/contracts";

export default {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY", // Alchemy Sepolia URL
      accounts: ["YOUR_PRIVATE_KEY"],  // Add your private key here
    },
  },
  etherscan: {
    apiKey: "your-etherscan-api-key",  // For contract verification on Etherscan
  },
};
