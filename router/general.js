// general.js
const express = require('express');
const policies = require("./policiesdb.js");  // Import the policies object
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Fetch all policies
const fetchPolicies = async () => {
    return new Promise((resolve) => {
        resolve(policies);
    });
};

// Register a new user
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;
    const userExists = users.some(user => user.username === username);

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    if (userExists) {
        return res.status(409).json({ message: "User already registered." });
    } else {
        users.push({ username, password });
        return res.status(201).json({ message: "User successfully registered." });
    }
});

// Get all insurance policies
public_users.get('/policies', async function (req, res) {
    try {
        const policiesData = await fetchPolicies();
        return res.json({ message: "Policies retrieved successfully", data: policiesData });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching policies", error: error.message });
    }
});

// Get policy details by ID
public_users.get('/policy/:id', async function (req, res) {
    const policyId = req.params.id;

    try {
        const policiesData = await fetchPolicies();
        if (policiesData[policyId]) {
            return res.json({ message: "Policy retrieved successfully", data: policiesData[policyId] });
        } else {
            return res.status(404).json({ message: "No policy found with this ID" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Error fetching policy details", error: error.message });
    }
});

// Create a new insurance policy
public_users.post('/policy/create', (req, res) => {
  const { insured, premium, event, trigger_condition, payout } = req.body;

  const newPolicy = {
      insured,
      premium,
      event,
      trigger_condition,
      payout,
      status: "active"
  };

  policies[Object.keys(policies).length + 1] = newPolicy;
  return res.status(201).json({ message: "Policy created successfully", data: newPolicy });
});

module.exports.general = public_users;
