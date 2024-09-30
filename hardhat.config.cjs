require("@nomicfoundation/hardhat-toolbox");


module.exports = {
  solidity: "0.8.24",
  networks: {
    // sepolia: {
    // url: "https://eth-sepolia.g.alchemy.com/v2/8RTkJjB7mP0LKKsYmDpgRCMenJ_TtKVC", // Replace with your Alchemy Sepolia URL
    // accounts: ["0x94272d6f64dBaFe09255C5Af4a83995cF34152e0"],  // Add your private key here

      localhost: {
        url: "http://127.0.0.1:8545", // Default local network settings for Hardhat
        chainId: 31337, 
      },

    },
};
