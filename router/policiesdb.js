// policiesdb.js

let policies = {
      1: { 
          "insured": "0xUserAddress1", 
          "premium": 0.5, 
          "payout": 2, 
          "status": "active", 
          "event": "flight_delay", 
          "trigger_condition": "delay > 2 hours" 
      },
      2: { 
          "insured": "0xUserAddress2", 
          "premium": 1, 
          "payout": 3, 
          "status": "pending", 
          "event": "rainfall", 
          "trigger_condition": "rain > 50mm" 
      }
  };
  
  module.exports = policies;
  