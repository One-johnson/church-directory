# 📧 SendGrid Email System Setup Guide

This guide will help you configure the email notification system for UD Professionals Directory using Convex environment variables.

## Overview

The email system sends automated notifications for:
1. **Registration** - Email to pastor when a new user registers
2. **Account Approval** - Email to user when their account is approved
3. **New Messages** - Email to recipient when they receive a new message

## Setup Instructions

### 1. Get Your SendGrid API Key

1. Go to [SendGrid](https://sendgrid.com/) and sign up for a free account
2. Navigate to **Settings > API Keys**
3. Click **Create API Key**
4. Give it a name (e.g., "UD Professionals Directory")
5. Select **Full Access** permissions
6. Click **Create & View**
7. Copy your API key (it starts with `SG.`)

### 2. Verify Your Sender Email

1. In SendGrid, go to **Settings > Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your email address (e.g., `noreply@udprofessionals.com`)
4. Complete the verification process
5. Check your email and verify the sender address

### 3. Configure Convex Environment Variables

You need to set **THREE** environment variables in Convex:

#### Option A: Using Convex Dashboard (Recommended)

1. Go to your [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your project
3. Navigate to **Settings > Environment Variables**
4. Add these three variables:

```
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@yourdomain.com
SENDGRID_FROM_NAME=UD Professionals Directory
```

5. Click **Save** for each variable

#### Option B: Using Convex CLI

If you prefer using the command line:

```bash
# Set SendGrid API Key
npx convex env set SENDGRID_API_KEY "SG.your_actual_api_key_here"

# Set sender email (must be verified in SendGrid)
npx convex env set SENDGRID_FROM_EMAIL "your-verified-email@yourdomain.com"

# Set sender name
npx convex env set SENDGRID_FROM_NAME "UD Professionals Directory"
```

### 4. Set Application URL (Optional for Production)

For production deployment, set your application URL:

**Using Dashboard:**
- Key: `NEXT_PUBLIC_APP_URL`
- Value: `https://your-production-domain.com`

**Using CLI:**
```bash
npx convex env set NEXT_PUBLIC_APP_URL "https://your-production-domain.com"
```

For local development, it defaults to `http://localhost:3000`.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | Your SendGrid API key (required) | `SG.abc123...` |
| `SENDGRID_FROM_EMAIL` | Verified sender email (required) | `noreply@udprofessionals.com` |
| `SENDGRID_FROM_NAME` | Sender display name (optional) | `UD Professionals Directory` |
| `NEXT_PUBLIC_APP_URL` | Your app URL (optional) | `https://udpro.com` |

## Email Templates

The system includes three professionally designed email templates:

### 1. Registration Approval Email
Sent to the pastor's email when a new user registers.

**Includes:**
- Member details (name, email, phone, denomination, branch)
- Direct one-click approval link (no login required)
- Alternative link to admin panel
- Branded HTML email with professional styling

### 2. Account Approved Email
Sent to the user when their account is approved.

**Includes:**
- Approval confirmation
- List of available features
- Direct login link
- Celebration design with checkmarks

### 3. New Message Notification
Sent to the recipient when they receive a new message.

**Includes:**
- Sender's name
- Message preview (first 100 characters)
- Direct link to messages page
- Clean, minimalist design

## Testing Emails

### Local Testing

1. Set up environment variables in Convex (use your personal email for testing)
2. Register a new user and check if pastor receives email
3. Approve the account and check if user receives email
4. Send a message and check if recipient receives email

### Verify Configuration

Check that your environment variables are set correctly:

```bash
npx convex env list
```

You should see:
- ✅ `SENDGRID_API_KEY` set
- ✅ `SENDGRID_FROM_EMAIL` set
- ✅ `SENDGRID_FROM_NAME` set (optional)

### Production Considerations

1. **Rate Limits**: SendGrid free tier allows 100 emails/day
2. **Deliverability**: Verify your domain for better email delivery
3. **Monitoring**: Check SendGrid dashboard for email activity
4. **Errors**: Email failures won't break the app - they're logged in Convex logs

## Email Flow

### Registration Flow
```
User Registers
    ↓
Convex: auth.registerWithDenomination
    ↓
Convex Action: emails.sendRegistrationEmail
    ↓
SendGrid API (direct from Convex)
    ↓
Pastor receives email with approval link
```

### Approval Flow
```
Pastor/Admin Approves Account
    ↓
Convex: userApprovals.approveUserAccount
    ↓
Convex Action: emails.sendAccountApprovedEmail
    ↓
SendGrid API (direct from Convex)
    ↓
User receives approval email
```

### Messaging Flow
```
User Sends Message
    ↓
Convex: messages.send
    ↓
Convex Action: emails.sendNewMessageEmail
    ↓
SendGrid API (direct from Convex)
    ↓
Recipient receives notification email
```

## Architecture

**Previous Setup (OLD):**
```
Convex Action → Next.js API Route → SendGrid
```

**Current Setup (NEW):**
```
Convex Action → SendGrid (Direct)
```

Benefits:
- ✅ Simpler architecture
- ✅ Fewer moving parts
- ✅ Better security (API key in Convex env)
- ✅ No Next.js API route needed
- ✅ Easier to deploy and maintain

## Troubleshooting

### Emails Not Sending?

1. **Check Environment Variables**: 
   ```bash
   npx convex env list
   ```
   Ensure `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` are set

2. **Check Convex Logs**:
   - Go to Convex Dashboard > Logs
   - Look for errors from email actions
   - Check for "SendGrid API key not configured" message

3. **Verify Sender**: Make sure your FROM_EMAIL is verified in SendGrid

4. **Check SendGrid Dashboard**: 
   - Go to SendGrid > Activity
   - Check for failed deliveries or errors

5. **API Key Permissions**: Ensure your API key has "Mail Send" permissions

### Common Issues

**Issue**: "SendGrid API key not configured" in logs
- **Solution**: Set `SENDGRID_API_KEY` environment variable in Convex

**Issue**: "Unauthorized" error from SendGrid
- **Solution**: Check that your API key is correct and has full access permissions

**Issue**: Emails going to spam
- **Solution**: Verify your domain with SendGrid and set up SPF/DKIM records

**Issue**: "Sender not verified" error
- **Solution**: Complete the sender verification process in SendGrid

**Issue**: Emails not received
- **Solution**: Check spam folder, verify email address, check SendGrid activity log

### View Email Logs

To see email sending logs:

1. Go to Convex Dashboard
2. Navigate to **Logs**
3. Filter by function: `emails/sendRegistrationEmail`, `emails/sendAccountApprovedEmail`, or `emails/sendNewMessageEmail`
4. Check for success/error messages

## Security Best Practices

⚠️ **Important Security Considerations:**

1. ✅ **Environment variables** - API keys stored securely in Convex
2. ✅ **No hardcoded secrets** - Everything in environment variables
3. ✅ **Version control safe** - No sensitive data in code
4. ✅ **Rotate keys regularly** - Update API keys periodically
5. ✅ **Monitor usage** - Check SendGrid dashboard for unusual activity
6. ✅ **Minimal permissions** - API key has only necessary permissions

## Support

For SendGrid-specific issues, refer to:
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [SendGrid Support](https://support.sendgrid.com/)

For Convex environment variables:
- [Convex Environment Variables Docs](https://docs.convex.dev/production/environment-variables)

## Next Steps

Once configured:
1. ✅ Set environment variables in Convex
2. ✅ Test all three email scenarios
3. ✅ Verify sender domain in SendGrid (optional but recommended)
4. ✅ Monitor email delivery rates
5. ✅ Consider upgrading SendGrid plan for production use
6. ✅ Set up domain authentication for better deliverability

---

**Your email system is now ready!** 🎉

The email system now runs entirely through Convex with direct SendGrid integration. Just set your environment variables and you're good to go!

## Quick Setup Checklist

- [ ] Created SendGrid account
- [ ] Generated SendGrid API key
- [ ] Verified sender email in SendGrid
- [ ] Set `SENDGRID_API_KEY` in Convex
- [ ] Set `SENDGRID_FROM_EMAIL` in Convex
- [ ] Set `SENDGRID_FROM_NAME` in Convex (optional)
- [ ] Tested registration email
- [ ] Tested approval email
- [ ] Tested message notification email
- [ ] Checked Convex logs for errors
- [ ] Verified emails arriving in inbox (not spam)

---

**Dummy Values for Testing:**

If you want to test the setup before getting a real SendGrid key, use these dummy values in Convex:

```
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY_HERE
SENDGRID_FROM_EMAIL=test@example.com
SENDGRID_FROM_NAME=UD Professionals Directory Test
```

Note: Emails won't actually send with dummy values, but the app will still work. Replace with real values to enable email functionality.
