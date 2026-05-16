# Razorpay Payment Integration Setup Guide

## Step-by-Step Setup Instructions

### 1. Razorpay Account Setup

1. **Sign up / Log in to Razorpay**
   - Go to [razorpay.com](https://razorpay.com)
   - Create an account or log in to your existing account

2. **Get Your API Keys**
   - In Razorpay Dashboard, go to **Settings** → **API Keys**
   - You'll find:
     - **Key ID** (e.g., `rzp_test_SpDyznKPQ9nviQ`)
     - **Key Secret** (e.g., `LMWGsU2457jFCYYdiVzzmJUM`)
   - Keep these secure, they're already in your `.env` files

3. **Enable Payment Methods**
   - Go to **Settings** → **Payment Methods**
   - Enable:
     - ✅ Credit/Debit Cards
     - ✅ UPI (GPay, PhonePe, Paytm)
     - ✅ Netbanking
   - Configure as needed

### 2. Webhook Configuration (IMPORTANT)

Webhooks allow Razorpay to notify your backend about payment events automatically.

1. **Get your ngrok/public URL**

   ```bash
   # If using ngrok, start it:
   ngrok http 3001
   ```

   - Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

2. **Configure Webhook in Razorpay**
   - In Razorpay Dashboard, go to **Settings** → **Webhooks**
   - Click **Add New Webhook**
   - **Webhook URL**: `https://your-domain.com/api/webhooks/razorpay`
     - For local dev: `https://your-ngrok-url.ngrok-free.app/api/webhooks/razorpay`
   - **Secret**: Create a strong secret (e.g., `YourWebhookSecretHere123`)
     - Update this in `admin/server/.env` as `RAZORPAY_WEBHOOK_SECRET`
   - **Events to subscribe**:
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `refund.processed`
   - Click **Save**

3. **Update Environment Variables**

   In `admin/server/.env`:

   ```env
   RAZORPAY_KEY_ID=rzp_test_SpDyznKPQ9nviQ
   RAZORPAY_KEY_SECRET=LMWGsU2457jFCYYdiVzzmJUM
   RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere123
   ```

   In `.env` (root):

   ```env
   EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app
   ```

### 3. Database Migration

The schema has been updated with new payment fields. Run migrations:

```bash
cd admin/server
npm run migrate  # or whatever your migration command is
```

If you need to manually add the columns, run this SQL in your Neon/PostgreSQL database:

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'razorpay';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS order_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS signature VARCHAR(500);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
```

### 4. Install Frontend Dependencies

Already done:

```bash
npm install react-native-razorpay
```

A type declaration file `react-native-razorpay.d.ts` has been created.

### 5. Start the Backend Server

```bash
cd admin/server
npm install
npm start
```

The server should run on `http://localhost:3001` (or the port in `.env`).

### 6. Start the Frontend App

```bash
# In the project root
npm start
```

Then:

- Press `a` for Android
- Press `i` for iOS
- Or scan QR code with Expo Go app

### 7. Test the Integration

#### Test Flow:

1. **User Registration & Login**
   - Create a test user or log in
   - Ensure user has active trial/subscription

2. **Select a Venue**
   - Browse venues and tap "Book This Venue"
   - Fill in booking details (date, time, guests)

3. **Make Payment**
   - Tap "Confirm Booking"
   - Razorpay checkout will open
   - Use Razorpay test credentials:
     - Card: `4111 1111 1111 1111`
     - CVV: `123`
     - Expiry: Any future date
     - Name: Any
     - 3D Secure: Password `123456`

4. **Verify Payment**
   - After successful payment, you'll be redirected
   - Booking status should change to "confirmed"
   - Admin panel should show the booking with payment details

5. **Check Admin Panel**
   - Log in to admin panel (usually `http://localhost:5173`)
   - Go to **Bookings** section
   - You should see:
     - Payment method (Razorpay)
     - Order ID
     - Payment ID
     - Paid timestamp
     - Status: Confirmed

6. **Test Webhook**
   - In Razorpay Dashboard, go to **Payments**
   - Find your test payment
   - Check that webhook events are being sent and received
   - View logs in your backend console

### 8. Handling Unavailable Venues

The system now properly checks for booking conflicts:

- When a user tries to book a venue that's already confirmed for that date/time:
  - Backend returns `venue_unavailable` error with conflict details
  - Frontend shows a professional modal with:
    - Conflict date and time
    - Suggestions for next steps
    - Clear call-to-action

### 9. Admin Panel Features

The admin panel now displays:

- **Payment Method** column in bookings table
- **Order ID** and **Payment ID** in booking details
- **Paid At** timestamp
- Real-time updates every 5 seconds

### 10. Important Notes

#### Security:

- Never expose `RAZORPAY_KEY_SECRET` in frontend
- Always verify payment signature on backend
- Use HTTPS in production

#### Testing:

- Use Razorpay test mode keys (provided)
- Test various scenarios:
  - Successful payment
  - Failed payment
  - User cancelling payment
  - Webhook delivery failures

#### Production Deployment:

1. Get live API keys from Razorpay
2. Update `.env` files with live keys
3. Set up proper webhook URL (not ngrok)
4. Configure CORS properly
5. Enable required payment methods in Razorpay dashboard

### 11. Troubleshooting

**Payment not confirming:**

- Check backend logs for signature verification errors
- Verify webhook is configured and receiving events
- Ensure `RAZORPAY_WEBHOOK_SECRET` matches

**Webhook not working:**

- Check ngrok is running and URL is correct in Razorpay
- Verify your backend is accessible publicly
- Check Razorpay webhook delivery logs

**Booking conflict false positives:**

- The system checks for exact date + status=confirmed
- Time overlap detection is basic (string matching)
- For advanced overlap, consider using timestamps

**TypeScript errors:**

- The `react-native-razorpay.d.ts` file provides basic types
- Adjust types if needed based on actual library behavior

### 12. Next Steps

- [ ] Test end-to-end booking flow
- [ ] Verify admin panel shows payment info correctly
- [ ] Test webhook events (payment captured, failed)
- [ ] Implement refund handling if needed
- [ ] Add payment failure retry mechanism
- [ ] Set up proper error monitoring

---

## Summary of Changes Made

### Backend (`admin/server/`)

- ✅ Added `/api/bookings/create-order` - Creates Razorpay order
- ✅ Added `/api/bookings/verify-payment` - Verifies payment signature
- ✅ Enhanced `/api/webhooks/razorpay` - Handles payment events
- ✅ Updated bookings schema with payment fields
- ✅ Added conflict detection before creating order

### Frontend (`app/`)

- ✅ Installed `react-native-razorpay`
- ✅ Updated `booking-detail.tsx` with Razorpay integration
- ✅ Added professional unavailability modal
- ✅ Created type declarations

### Admin Panel (`admin/src/`)

- ✅ Updated bookings table to show payment method
- ✅ Enhanced booking details with payment info
- ✅ Real-time refresh every 5 seconds

---

**You're all set! Follow the steps above to configure Razorpay and start accepting payments.**
