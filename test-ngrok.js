const ngrok = require('@expo/ngrok');

ngrok.connect({ port: 8081 })
  .then(url => {
    console.log("Connected:", url);
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection failed.");
    console.error(err);
    if (err.response) {
      console.error("Response:", err.response);
      console.error("Response body:", err.response.body);
    }
    process.exit(1);
  });
