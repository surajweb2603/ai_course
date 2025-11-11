# EmailJS Setup Guide

## Why EmailJS?

✅ **No Domain Verification Required** - Works immediately  
✅ **Free Tier** - 200 emails/month (perfect for most apps)  
✅ **Simple Setup** - No complex configuration  
✅ **Works with Gmail/Outlook** - Connect your existing email  
✅ **No Backend Required** - But we use it from backend for security  

## Quick Setup (5 minutes)

### Step 1: Create EmailJS Account

1. Go to [emailjs.com](https://www.emailjs.com)
2. Click **"Sign Up"** (free account)
3. Verify your email address

### Step 2: Add Email Service

1. In EmailJS Dashboard, go to **"Email Services"**
2. Click **"Add New Service"**
3. Choose your email provider:
   - **Gmail** (recommended for testing)
   - **Outlook**
   - **Custom SMTP**
4. Follow the setup instructions:
   - For Gmail: Enable "Less secure app access" or use App Password
   - For Outlook: Use App Password
5. Click **"Create Service"**
6. **Copy the Service ID** (you'll need it)

### Step 3: Create Email Template

1. Go to **"Email Templates"** in dashboard
2. Click **"Create New Template"**
3. Choose a template or start from scratch
4. Set up your template with these variables:

**Template Variables (use these exact names):**
```
{{to_email}}     - Recipient email (auto-filled)
{{to_name}}       - Recipient name
{{user_name}}     - User's name
{{reset_url}}     - Password reset link
{{message}}       - Plain text message
```

**Example Template:**
```
Subject: Reset Your Password

Hi {{user_name}},

We received a request to reset your password. Click the link below to create a new password:

{{reset_url}}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
```

5. Click **"Save"**
6. **Copy the Template ID** (you'll need it)

### Step 4: Get API Keys (Public + Private)

**Important:** The EmailJS Node SDK requires the **Public Key** and we also use the **Private Key** for secure server-side access.

1. Go to **"Account"** → **"API Keys"**
2. Copy the **Public Key** (looks like `public_xxxxx`) – required for every API call
3. Copy the **Private Key** (looks like `private_xxxxx`) – required for server-side usage

**Why both?**
- **Public Key** identifies your EmailJS account.
- **Private Key** acts as a secure access token when sending from the backend.

### Step 4.5: Enable Server-Side API Access ⚠️ CRITICAL

**This step is REQUIRED for server-side email sending!**

1. Go to **"Account"** → **"Security"** in EmailJS Dashboard
2. Find the option: **"Allow EmailJS API for non-browser applications"**
3. **Enable/Check this option** ✅
4. Click **"Save"**

**Why?** EmailJS blocks server-side API calls by default for security. Enabling this setting allows your Node.js backend to send emails.

**Without this setting, you'll get:** `403 Forbidden - API calls are disabled for non-browser applications`

### Step 5: Configure Environment Variables

Add these to your `.env` file:

```bash
# EmailJS Configuration (Server-Side)
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=your_public_key_here
EMAILJS_PRIVATE_KEY=your_private_key_here
```

**Important:** 
- Replace `service_xxxxxxx` with your Service ID
- Replace `template_xxxxxxx` with your Template ID
- Replace `your_public_key_here` with your **Public Key**
- Replace `your_private_key_here` with your **Private Key**

### Step 6: Restart Server

```bash
npm run dev
```

## Testing

1. Go to `/forgot-password`
2. Enter an email address
3. Check your email inbox!
4. Check server logs for confirmation

## Template Variables Reference

The email service sends these variables to your EmailJS template:

| Variable | Description | Example |
|----------|-------------|---------|
| `to_email` | Recipient email | `user@example.com` |
| `to_name` | Recipient name | `John Doe` |
| `user_name` | User's name | `John` or `there` |
| `reset_url` | Password reset link | `http://localhost:3000/reset-password?token=...` |
| `message` | Plain text message | Full reset instructions |

## Troubleshooting

### Email Not Sending?

1. **Check Environment Variables:**
   ```bash
   # Make sure all four are set:
   EMAILJS_SERVICE_ID=...
   EMAILJS_TEMPLATE_ID=...
   EMAILJS_PUBLIC_KEY=...   # Starts with public_
   EMAILJS_PRIVATE_KEY=...  # Starts with private_
   ```

2. **Check Server Logs:**
   Look for:
   - `✅ [EMAIL-SERVICE] Password reset email sent successfully!`
   - `❌ [EMAIL-SERVICE] Failed to send...`

3. **Verify EmailJS Dashboard:**
   - Go to EmailJS Dashboard → **"Logs"**
   - See if emails were attempted
   - Check for error messages

4. **Check Email Service:**
   - Make sure your email service (Gmail/Outlook) is connected
   - Verify "Less secure app access" is enabled (Gmail)
   - Or use App Password

### Common Errors

**"API calls are disabled for non-browser applications" (403 Forbidden)**
- ⚠️ **MOST COMMON ISSUE** - Server-side API access is disabled
- **Solution:** Go to EmailJS Dashboard → Account → Security
- Enable **"Allow EmailJS API for non-browser applications"**
- Save and try again
- This setting MUST be enabled for server-side email sending

**"Service ID not found"**
- Check `EMAILJS_SERVICE_ID` is correct
- Verify service exists in EmailJS dashboard

**"Template ID not found"**
- Check `EMAILJS_TEMPLATE_ID` is correct
- Verify template exists in EmailJS dashboard

**"Invalid Private Key"**
- Check `EMAILJS_PRIVATE_KEY` is correct
- Make sure you're using **Private Key** (not Public Key)
- Get it from Account → API Keys → Private Key

**"Invalid Public Key"**
- Check `EMAILJS_PUBLIC_KEY` is correct (starts with `public_`)
- Get it from Account → API Keys → Public Key

**"Email service error"**
- Check your email service (Gmail/Outlook) connection
- Verify App Password or Less Secure Access

## Free Tier Limits

- **200 emails/month** (free tier)
- **Upgrade** for more: [emailjs.com/pricing](https://www.emailjs.com/pricing)

## Security Notes

- ✅ Both API keys stay on the backend (never exposed to browser)
- ✅ Email sending happens on backend (secure)
- ✅ No sensitive data exposed
- ✅ Works with any email address (no domain verification needed)
- ⚠️ **Important:** Public Key can be shared in client apps, but keep the Private Key secret

## Production Checklist

- [ ] EmailJS account created
- [ ] Email service connected (Gmail/Outlook)
- [ ] Email template created with correct variables
- [ ] Environment variables set in `.env`
- [ ] Tested password reset flow
- [ ] Checked EmailJS dashboard logs
- [ ] Verified emails arrive in inbox

## Need Help?

- EmailJS Docs: [emailjs.com/docs](https://www.emailjs.com/docs)
- EmailJS Support: support@emailjs.com
- Check EmailJS Dashboard → Logs for detailed error messages
