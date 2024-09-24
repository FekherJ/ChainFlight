🚀 Decentralized Insurance Platform

A decentralized flight delay insurance platform built on Ethereum, using smart contracts and Chainlink Any API to automate policy management and payouts based on external flight delay data.



📄 Project Overview

This platform offers decentralized, transparent insurance policies for flight delays. Smart contracts automatically trigger payouts to policyholders based on real-time flight delay data retrieved from external APIs via Chainlink's Any API feature.



🔑 Key Features

Blockchain-Powered Insurance: Policies are managed through smart contracts, ensuring trustless and transparent operations.
Automated Payouts: If a flight delay is detected through Chainlink Any API, payouts are triggered without manual intervention.
Real-Time Data: Flight delay data is fetched from an external API using Chainlink, offering reliable external data integration.
Flexible Policy Creation: New insurance policies can be easily created, tracked, and managed on-chain.



📂 Project Structure

├── contracts/                
│   ├── InsurancePolicy.sol     # Main contract managing insurance policies with Chainlink Any API
│   └── MockV3Aggregator.sol    # Mock contract for testing Chainlink data feeds
├── chainlink-flight-adapter/   # Chainlink adapter for fetching flight data (via Any API)
├── router/                     # API route management
├── scripts/                    # Hardhat scripts (e.g., deployment, interactions)
├── test/                       # Test scripts for smart contracts
├── hardhat.config.cjs          # Hardhat configuration
├── index.cjs                   # Backend server entry point
├── postman_tests.txt           # Postman collection for API testing
├── package.json                # Node.js dependencies
└── README.md                   # Project documentation (this file)



🚀 Getting Started

Prerequisites:

Ensure you have the following installed before running the project:
- Node.js
- Hardhat
- Metamask
- Chainlink Node (optional for local oracle setup)

  
Installation:

- Clone the repository: 
    git clone https://github.com/FekherJ/DeFi_insurance_platform.git
    cd DeFi_insurance_platform
  
- Install Node.js dependencies:
    npm install
  
- Set up environment variables by creating a .env file:
    PRIVATE_KEY=<your_metamask_private_key>
    RPC_URL=<your_ethereum_rpc_url>
    CHAINLINK_ORACLE=<chainlink_oracle_address>
    JOB_ID=<chainlink_job_id>
    LINK_TOKEN_ADDRESS=<link_token_address>
    FLIGHT_API_KEY=<your_flight_api_key>

    
Deployment:

- Compile the smart contracts:    npx hardhat compile
- Deploy the contracts:    npx hardhat run scripts/deploy.js --network <network_name>



🛠️ Testing

You can run the smart contract tests using Hardhat's local node:

- Start a local blockchain:  npx hardhat node
- Run the tests:  npx hardhat test



📡 Chainlink Any API Integration

This project integrates Chainlink Any API to retrieve real-time flight delay data from an external API. The oracle fetches flight status, and if a delay is detected, the contract triggers automatic payouts to the insured user.

Flight Status Codes: The flight data includes codes where 1 means "on-time" and 2 means "delayed."
Automated Payouts: If a flight is delayed, the policyholder receives the payout based on the policy terms.


💻 API Testing

The project includes a Postman collection for easy API testing. Import postman_tests.txt into Postman to test the policy creation and other endpoints.

🛠️ Future Enhancements

User Interface: A front-end interface for easier interaction with the platform.

More Insurance Types: Expansion to offer other types of insurance (e.g., health, property).

Improved Oracle Data: Enhanced data handling with more precise and diversified oracles.



📝 License

This project is licensed under the MIT License. See the LICENSE file for details.



👨‍💻 Contributing

Pull requests and contributions are welcome! For major changes, please open an issue first to discuss what you would like to change.
