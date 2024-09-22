Decentralized Insurance Platform
Overview
This project is a decentralized insurance platform built on Ethereum, designed to manage flight delay insurance policies using smart contracts. The platform uses Chainlink oracles to fetch real-time flight data and automatically triggers payouts to policyholders in case of flight delays. The project is powered by Solidity smart contracts and uses the Hardhat framework for development and testing.

Features
Smart Contract-Driven Policies: Insurance policies are handled through smart contracts, ensuring transparency and security.
Automated Payouts: Flight delay status is fetched via Chainlink oracles, and payouts are automatically triggered if a delay is confirmed.
User-Friendly Policy Creation: Policies can be created and managed easily through smart contract functions.
Integration with Chainlink: The project uses Chainlink oracles to retrieve flight data from external sources.
Project Structure
bash
Copier le code
.
├── contracts/                # Contains Solidity smart contracts
│   ├── InsurancePolicy.sol    # Main smart contract for insurance policies
│   ├── MockV3Aggregator.sol   # Mock contract for testing Chainlink data feeds
├── router/                   # Backend route management
├── chainlink-flight-adapter/  # Chainlink adapter for flight data
├── scripts/                  # Hardhat scripts for deployment and interactions
├── test/                     # Unit tests for smart contracts
├── index.cjs                 # Backend server entry point
├── package.json              # Node.js dependencies and project information
├── hardhat.config.cjs         # Hardhat configuration
└── README.md                 # Project documentation (this file)
Prerequisites
Before running the project, ensure you have the following installed:

Node.js: Download
Hardhat: Hardhat Documentation
Chainlink Node: Chainlink Documentation
Metamask: Download Metamask
Solidity: Version 0.8.x or above.
Setup and Installation
Clone the repository:

bash
Copier le code
git clone https://github.com/FekherJ/DeFi_insurance_platform.git
cd DeFi_insurance_platform
Install dependencies:

bash
Copier le code
npm install
Configure environment variables: Create a .env file with the following:

bash
Copier le code
PRIVATE_KEY=<your_metamask_private_key>
RPC_URL=<your_ethereum_rpc_url>
CHAINLINK_ORACLE=<chainlink_oracle_address>
JOB_ID=<chainlink_job_id>
LINK_TOKEN_ADDRESS=<link_token_address>
Compile the smart contracts:

bash
Copier le code
npx hardhat compile
Deploy the contracts:

bash
Copier le code
npx hardhat run scripts/deploy.js --network <network_name>
Chainlink Oracle Integration
The InsurancePolicy.sol contract integrates with Chainlink to fetch flight delay data. Chainlink nodes query external APIs to retrieve the status of flights and relay the data back to the smart contract.

Flight Status: The contract tracks whether the flight is on time or delayed.
Automatic Payouts: If a delay is detected, the contract automatically transfers the payout amount to the insured party.
Testing
To test the smart contracts locally:

Start the local Hardhat node:

bash
Copier le code
npx hardhat node
Run the tests:

bash
Copier le code
npx hardhat test
API Endpoints (Postman)
The project includes a Postman collection for testing the API. You can import postman_tests.txt into Postman to quickly test policy creation and other functionalities.

Future Improvements
UI Integration: A front-end interface can be developed to allow users to interact with the platform more easily.
Additional Insurance Types: Expand beyond flight insurance to offer other forms of decentralized insurance.
Enhanced Oracle Integration: Further customization of the Chainlink oracle to support different data sources.
License
This project is licensed under the MIT License.

Feel free to customize the README further based on your project's current state and specific requirements. This should provide clarity for users and developers interested in contributing or using the platform.
