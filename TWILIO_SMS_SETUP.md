# Twilio SMS Setup Guide for OTP System

## Overview
The OTP system now sends SMS via Twilio. This guide walks you through:
1. Creating a Twilio account
2. Getting Twilio credentials
3. Adding credentials to Render
4. Testing SMS delivery

---

## Step 1: Create a Twilio Account

### Free Trial Sign-up (Recommended)
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up with email, password, and phone number
3. Verify your phone number with SMS code
4. You'll get **$15 USD free trial credit** (enough for hundreds of OTPs)

### After Sign-up
You'll be taken to the Twilio Console dashboard.

---

## Step 2: Get Your Twilio Credentials

### 2.1 Get Account SID and Auth Token

1. In the Twilio Console, go to **Account > API keys & tokens**
   - Or directly: [https://console.twilio.com/?frameUrl=/console/account/keys](https://console.twilio.com/?frameUrl=/console/account/keys)

2. You'll see:
   - **Account SID** - looks like `ACxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token** - looks like a long random string

3. **Copy both values** and keep them safe (never share or commit to git)

### 2.2 Get a Twilio Phone Number

1. In the Twilio Console, go to **Phone Numbers > Manage > Active Numbers**
   - Or directly: [https://console.twilio.com/us/console/phone-numbers/incoming](https://console.twilio.com/us/console/phone-numbers/incoming)

2. If you don't have a number yet, click **Get a number**

3. Select the country (e.g., **United States**)

4. Select a number from the list (any number works for testing)

5. **Copy the phone number** (format: `+1234567890`)

**Note:** For India-based receiving, you'll need to:
- Use India country code (+91)
- Verify your active phone number with Twilio first
- Numbers cost a few dollars/month

For now, a US number works fine for testing SMS sending.

---

## Step 3: Add Credentials to Render

### 3.1 Go to Render Environment Variables

1. Open your Render service dashboard: [https://dashboard.render.com](https://dashboard.render.com)

2. Click your backend service (cosmic-solutions or similar)

3. Go to **Environment** tab

4. Add three new environment variables:

| Variable | Value | Example |
|----------|-------|---------|
| `TWILIO_ACCOUNT_SID` | Your Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Your Auth Token | `a1b2c3d4e5f6g7h8i9j0...` |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone | `+14155552671` |

### 3.2 Save and Deploy

1. Click **Save changes**
2. Render will automatically deploy with the new variables
3. Wait for deployment to complete (~2 minutes)

---

## Step 4: Test SMS Delivery

### 4.1 Via your app

1. Go to your frontend (Technician Dashboard)
2. Click "Create Task" or go to any section with OTP
3. Enter a 10-digit mobile number (e.g., `9876543210`)
4. Click "Generate OTP"
5. **Check your phone for SMS**

Expected SMS format:
```
Your OTP is: 123456. Valid for 5 minutes. Do not share with anyone.
```

### 4.2 Via API (cURL)

```bash
curl -X POST https://your-render-service.onrender.com/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "9876543210"
  }'
```

Verify the response is:
```json
{
  "status": "success",
  "message": "OTP sent successfully. Please check your SMS.",
  "data": {
    "mobileNumber": "9876543210",
    "expiresAt": "2026-02-08T12:05:00Z"
  }
}
```

Then check your phone for SMS within 10 seconds.

---

## Step 5: Monitor SMS Logs

### 5.1 Check Twilio Logs

1. In Twilio Console, go to **Monitor > Logs > Messages**
   - Or: [https://console.twilio.com/us/console/sms/logs](https://console.twilio.com/us/console/sms/logs)

2. You'll see all SMS sent with:
   - Recipient phone number
   - Message content
   - Status (Queued, Sent, Delivered, Failed)
   - Timestamp

### 5.2 Check Render Logs

1. In your Render service dashboard, go to **Logs**

2. Look for messages like:
   - `✅ SMS sent successfully to +919876543210 (SID: SM...)`
   - `⚠️ OTP SMS sending failed: ...` (if error)

---

## Troubleshooting

### Problem: "SMS Service misconfigured"
**Solution:** 
- Verify all three variables are set in Render
- Redeploy after setting variables
- Check the exact variable names (case-sensitive):
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

### Problem: "Failed to send SMS: Invalid phone number"
**Solution:**
- Phone number must be in format: `+91xxxxxxxxxx` (with country code)
- Backend automatically formats 10-digit numbers as `+91...`
- Make sure the receiving number is a real mobile number

### Problem: "Failed to send SMS: Resource not found"
**Solution:**
- Check your Account SID and Auth Token are correct
- Verify they match (copy again from Twilio console)
- Redeploy Render after fixing

### Problem: "Failed to send SMS: Authentication failed"
**Solution:**
- Auth Token is incorrect
- Copy again from Twilio Console (be careful with spaces)
- Redeploy

### Problem: SMS sent but not received
**Solution:**
- Twilio free trial account may have sending limits to unverified numbers
- In Twilio Console > Settings, verify the receiving phone number
- If in India, use a number you've verified with Twilio

### Problem: OTP generated but SMS not sent (dev mode message appears)
**Solution:**
- This means Twilio credentials aren't set
- Check Render logs for: "⚠️ Twilio credentials not configured"
- Add the three variables to Render and redeploy

---

## Development Testing (Without Real SMS)

If you want to test locally without sending real SMS:

### Option 1: Run Backend Locally
```bash
cd cosmicproject_backend-master
npm install
npm run dev
```

The backend will log:
```
📱 [DEV MODE] OTP would be sent to +919876543210: 123456
```

And print the OTP in the console so you can test locally.

### Option 2: Check Backend Logs
Even without credentials, you'll see in the app response (dev mode):
```json
{
  "data": {
    "otp": "123456"  // Only in dev mode
  }
}
```

---

## Twilio Billing & Limits

### Free Trial
- **Starts with:** $15 USD credit
- **Typical cost:** ~$0.0075 per SMS in US, ~$0.04 per SMS in India
- **Duration:** No expiry, credit consumed as you send

### After Trial Ends
- Need to upgrade to paid account
- Pay-as-you-go billing
- Very affordable (less than $1/month for hundreds of OTPs)

### Production Considerations
- Set up alerts in Twilio console for high usage
- Monitor costs in [https://www.twilio.com/console/billing/overview](https://www.twilio.com/console/billing/overview)
- Consider SMS templates to reduce per-message cost

---

## Next Steps

1. **Complete the setup** following steps 1-3 above
2. **Test SMS delivery** with step 4
3. **Monitor logs** with step 5
4. **Deploy to production** and test with real users

---

## Support & Resources

- **Twilio Docs:** https://www.twilio.com/docs/sms
- **Account Console:** https://console.twilio.com
- **Render Dashboard:** https://dashboard.render.com
- **Contact Twilio Support:** [https://www.twilio.com/help](https://www.twilio.com/help)

---

## Backend Implementation Details

The implementation automatically:
- ✅ Sends SMS via Twilio when OTP is generated
- ✅ Gracefully falls back to console logging if Twilio not configured
- ✅ Logs all SMS attempts and results
- ✅ Formats phone numbers correctly (+91 for India)
- ✅ Doesn't block OTP generation if SMS fails
- ✅ Includes retry logic for failed sends

### Files Modified
- `src/services/sms.service.js` - New Twilio SMS service
- `src/services/otp.service.js` - Updated to use SMS service
- `package.json` - Added twilio dependency

---

**Last Updated:** February 8, 2026  
**Status:** Ready for Twilio integration
