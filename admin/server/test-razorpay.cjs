require('dotenv').config({ path: '/home/jerytom33/Downloads/Zvenue-main/zvenue/admin/server/.env' });
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const planId = "plan_Sph4tfi1RrzuEK";

razorpay.plans.fetch(planId)
  .then(plan => console.log("Plan successfully fetched:", plan))
  .catch(err => {
    console.error("Failed to fetch plan. Error from Razorpay:");
    console.error(err);
  });
