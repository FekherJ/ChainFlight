
# 🚀 ChainFlight - Decentralized Flight Delay Insurance Platform

ChainFlight is a decentralized platform built on Ethereum that offers flight delay insurance policies. It utilizes smart contracts and Chainlink Any API to automate policy management and payouts based on real-time flight delay data retrieved from external APIs.

---

## 📄 Project Overview

This platform leverages blockchain technology to provide decentralized, transparent insurance for flight delays. Through the use of smart contracts, payouts are automatically triggered when a flight delay is detected, ensuring a trustless, reliable, and transparent claims process.

### Key Features

- **Blockchain-Powered Insurance**: Policies are managed on the Ethereum blockchain using smart contracts, ensuring a transparent, trustless system.
- **Automated Payouts**: When a flight delay is detected via Chainlink Any API, payouts are triggered automatically without the need for manual approval.
- **Real-Time Data Integration**: Flight delay data is fetched from external APIs via Chainlink's oracle system, ensuring reliable data.
- **Flexible Policy Management**: Users can create, track, and manage insurance policies directly on-chain.

---

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Running Locally](#running-locally)
4. [Deploying Contracts](#deploying-contracts)
5. [Smart Contract Overview](#smart-contract-overview)
6. [Testing](#testing)
7. [Contributing](#contributing)

---

## 🛠️ Getting Started

To get started with ChainFlight, follow the instructions below to set up your environment and interact with the smart contracts.

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (v6 or later)
- [Hardhat](https://hardhat.org/) (v2 or later)
- [Solidity](https://soliditylang.org/) (v0.8.x or later)
- A local Ethereum network (e.g., using [Ganache](https://www.trufflesuite.com/ganache))

### Installing Dependencies

To install all dependencies required for the project:

```bash
npm install
```

---

## 📂 Project Structure

- `contracts/`: Contains the Solidity smart contracts.
  - `FlightDelayAPI.sol`: Main contract for interacting with flight delay data.
  - `InsurancePolicy.sol`: Manages insurance policy logic, including claims and payouts.
  - `MockLinkToken.sol` & `MockOracle.sol`: Mock contracts used for testing (Chainlink tokens and oracles).
- `scripts/`: Contains deployment scripts.
  - `deploy.cjs`: Script to deploy the smart contracts to a local or live Ethereum network.
- `router/`: Contains backend logic in Node.js.
  - `auth_users.cjs`: Manages user authentication.
  - `external-adapter.cjs`: Handles fetching flight delay data from external APIs.
  - `policiesdb.cjs`: Manages insurance policy data in the database.
- `test/`: Contains unit and integration tests for the smart contracts.
  - `InsurancePolicy.test.cjs`: Tests for the `InsurancePolicy.sol` contract.

---

## 🚀 Running Locally

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ChainFlight.git
cd ChainFlight
```

### 2. Compile the Smart Contracts

```bash
npx hardhat compile
```

### 3. Deploy the Contracts Locally

Ensure you have a local Ethereum network running (e.g., with Ganache), then deploy the contracts:

```bash
npx hardhat run scripts/deploy.cjs --network localhost
```

### 4. Run the Backend

Once the contracts are deployed, start the Node.js backend:

```bash
npm start
```

---

## 📜 Deploying Contracts

You can deploy the smart contracts to Sepolia testnet by editing the `hardhat.config.cjs` to include Sepolia network configurations.

To deploy to Sepolia, ensure you have set up your private keys and Chainlink credentials in the `.env` file.

```bash
npx hardhat run scripts/deploy.cjs --network sepolia
```

---

## 🧠 Smart Contract Overview

### `FlightDelayAPI.sol`

This contract interacts with an external API to fetch flight delay data via Chainlink. It is responsible for receiving and validating flight status updates that will trigger insurance payouts.

### `InsurancePolicy.sol`

Handles the core insurance logic, including the creation, management, and payouts of policies. When a flight delay is detected, this contract will execute the payouts to eligible users.

---

## 🧪 Testing

Unit tests for the `InsurancePolicy` contract can be run using Hardhat's built-in testing framework:

```bash
npx hardhat test
```

This will run the tests located in `test/InsurancePolicy.test.cjs` to ensure that the insurance logic, policy creation, and payouts are functioning correctly.

For more details on how to test using Remix IDE, refer to the [REMIX_TESTING.md](REMIX_TESTING.md) file.

---

## 🤝 Contributing

Contributions are welcome! Please fork this repository and submit pull requests with your changes.

---

## 📄 License

This project is licensed under the MIT License.

---

### Future Improvements

- **Add More Tests**: Expanding the test coverage for edge cases and other contracts.
- **Integrate Frontend**: Develop a frontend to allow users to interact with the insurance policies.
- **Improve Security**: Conduct audits and improve the security of the smart contracts.
