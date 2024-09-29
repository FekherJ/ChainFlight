
Testing on Remix
Overview
This guide provides step-by-step instructions to deploy and test the decentralized insurance platform smart contracts using the Remix IDE. It covers the deployment of mock Chainlink contracts, interacting with the FlightDelayAPI and InsurancePolicy contracts, and simulating Chainlink oracle responses. This approach is tailored for local or test environments where mock contracts are used to replicate real-world Chainlink services.

Prerequisites
A basic understanding of Solidity development and the Remix IDE.
Familiarity with Chainlink oracles and smart contract interactions.
Knowledge of ETH, wei conversions, and deploying contracts in Remix.
Key Steps Recap
Deploy Contracts: Deploy MockLinkToken, MockOracle, and FlightDelayAPI.
Transfer LINK Tokens: Ensure that both FlightDelayAPI and MockOracle have enough LINK tokens.
Request Data: Use requestFlightData from FlightDelayAPI to generate a requestId.
Fulfill the Request: Use fulfillOracleRequest from MockOracle to simulate a Chainlink oracle response.
Verify Flight Delay: Retrieve the flight delay status from the FlightDelayAPI contract.
Deploying the Contracts
1. Deploy MockLinkToken
Deploy the MockLinkToken contract from your deployer account (account 1), which will receive the initial supply of LINK tokens.

Initial Supply: Upon deployment, the deployer account automatically receives 1,000,000 LINK tokens.
Balance Check: Verify the deployer account's LINK balance using the balanceOf function in the MockLinkToken contract. The balance should read 1000000000000000000000000 LINK (in wei).
2. Deploy MockOracle
Deploy the MockOracle contract. This contract will simulate a Chainlink oracle during testing.

3. Deploy FlightDelayAPI
Deploy the FlightDelayAPI contract, passing the deployed MockLinkToken address as the _linkToken parameter.

_linkToken: Use the address of the MockLinkToken contract deployed in step 1.
LINK Transfer: Once deployed, the FlightDelayAPI contract will be able to receive LINK tokens.
4. Transfer LINK Tokens to Contracts
Use the transfer function in MockLinkToken to send LINK tokens from the deployer account to both the FlightDelayAPI and MockOracle contracts.

Transfer Amount: For example, transfer 1 LINK (1000000000000000000 wei) to each contract.
Balance Verification: Use the balanceOf function to confirm that both contracts have received their LINK tokens.
Testing Flight Data
1. Request Flight Data
In the FlightDelayAPI contract, call the requestFlightData function with a flight number (e.g., "504").

Log the requestId: Keep track of the requestId from the transaction logs, as it will be used in the next steps.
2. Simulate Oracle Fulfillment
Navigate to the MockOracle contract and call the fulfillOracleRequest function to simulate fulfilling the request generated in the previous step.

_requestId: Use the requestId generated in the requestFlightData function.
_flightDelay: Input a simulated flight delay, for example, 60 minutes.
3. Verify Flight Delay Status
Return to the FlightDelayAPI contract and call the function that retrieves the flight delay status. This confirms whether the mock response has updated the delay status accurately.

Interacting with the InsurancePolicy Contract
1. Create a Policy
To create a policy in the InsurancePolicy contract, call the createPolicy function. Ensure you send the appropriate amount of ETH with the transaction, which corresponds to the premium amount.

ETH Value: In the "Value (ETH)" field, enter the amount of ETH you wish to send, matching the premium.
Function Parameters:
Premium Amount: 1 ETH = 1000000000000000000 wei.
Payout Amount: 10 ETH = 10000000000000000000 wei.
Flight Number: For example, "504".
The contract will emit a PolicyCreated event upon successful creation. You can check the logs for this event.

2. Request Flight Delay Data
In the InsurancePolicy contract, call the requestFlightDelayData function and input the flight number (e.g., "504").

In a real environment, the Chainlink Oracle would fulfill this request automatically.
Log the requestId: Retrieve the requestId from the transaction logs.
3. Simulate Oracle Fulfillment
To simulate the oracle response manually, go to the MockOracle contract and use the fulfillOracleRequest function.

Parameters:
_requestId: Use the requestId from the requestFlightDelayData transaction logs.
_flightDelayStatus: Input a number to simulate the delay in minutes (e.g., 60 for a 60-minute delay).
This simulates the Chainlink oracle fulfilling the request.

Additional Notes
Real Chainlink Oracle in Production: In a live environment (mainnet or testnet), the Chainlink Oracle will automatically fulfill requests, eliminating the need for manual fulfillOracleRequest calls. Ensure that you set the correct oracle address when deploying on testnets or mainnet.

Mock Contracts for Testing: The mock contracts (MockLinkToken, MockOracle) are only used for local testing and development. When deploying on testnet or mainnet, replace these mock contracts with real Chainlink services.

By following these instructions, you can effectively test your smart contracts using the Remix IDE. The setup will allow you to simulate real-world interactions in a controlled local environment, ensuring the platform's functionality before moving to a testnet or mainnet.

