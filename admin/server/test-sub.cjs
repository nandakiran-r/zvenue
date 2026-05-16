require('dotenv').config({ path: '/home/jerytom33/Downloads/Zvenue-main/zvenue/admin/server/.env' });
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

razorpay.subscriptions.all({ count: 1 })
  .then(res => {
    if (res.items.length > 0) {
      console.log("Subscription short_url:", res.items[0].short_url);
      console.log("Full Subscription Object:", JSON.stringify(res.items[0], null, 2));
    } else {
      console.log("No subscriptions found.");
    }
  })
  .catch(err => {
    console.error("Failed to fetch subscriptions. Error:", err);
  });
