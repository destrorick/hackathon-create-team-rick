const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello from your project! Replace this with your actual app.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
