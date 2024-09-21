const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.EA_PORT || 3000;

app.use(express.json());

// Endpoint for Chainlink node to query flight data
app.post('/flightstatus', async (req, res) => {
  const { id, data } = req.body;
  const flightNumber = data.flightNumber;

  try {
    const response = await axios.get(`http://api.aviationstack.com/v1/flights`, {
      params: {
        access_key: '975d6fc4ac001e8fb0ad8d7bbfd7ee18',  // Replace with your Aviationstack API key
        flight_iata: flightNumber
      }
    });

    const flightStatus = response.data.data[0].flight_status;

    // Respond with the flight status (on time, delayed, etc.)
    res.json({
      jobRunID: id,
      data: { flightStatus },
      result: flightStatus
    });

  } catch (error) {
    console.error('Error fetching flight data:', error);
    res.status(500).send('Error fetching flight data');
  }
});

app.listen(port, () => {
  console.log(`External adapter listening on port ${port}`);
});
