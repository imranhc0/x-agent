const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());

app.post('/api/browser-history', (req, res) => {
  const historyData = req.body;
  // Process history data as needed
  console.log('Received browser history data:', historyData);
  res.send('Data received successfully');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

//http://localhost:4000/api/browser-history


