# WhatsApp Message Templates

This document defines WhatsApp message templates for Rangtal Workflows that require approval from Meta via Twilio Console before use in production.

## Template Definitions

### Template 1: payment_confirmation

- **Template Name:** `payment_confirmation`
- **Category:** UTILITY
- **Language:** en (English)
- **Body:**
  ```
  Hi {{1}}, we've received your Zelle payment of {{2}} for {{3}}. Your registration is confirmed!
  ```
- **Variables:**
  - `{{1}}` = name
  - `{{2}}` = amount
  - `{{3}}` = period

---

### Template 2: onboarding_welcome

- **Template Name:** `onboarding_welcome`
- **Category:** UTILITY
- **Language:** en (English)
- **Body:**
  ```
  Hi {{1}}, welcome to Rangtal Garba! Your onboarding for {{2}} is complete. We'll share class schedule and details shortly. See you on the dance floor!
  ```
- **Variables:**
  - `{{1}}` = name
  - `{{2}}` = period

---

### Template 3: cash_reminder

- **Template Name:** `cash_reminder`
- **Category:** UTILITY
- **Language:** en (English)
- **Body:**
  ```
  Hi {{1}}, thanks for registering for Rangtal Garba ({{2}})! Your payment method is marked as cash — {{3}}. Please bring your payment to the next class. Questions? Reply to this message.
  ```
- **Variables:**
  - `{{1}}` = name
  - `{{2}}` = period
  - `{{3}}` = amount

---

### Template 4: team_zelle_notification

- **Template Name:** `team_zelle_notification`
- **Category:** UTILITY
- **Language:** en (English)
- **Body:**
  ```
  New Zelle registration: {{1}} — {{2}} for {{3}}. Check your bank and approve: {{4}}
  ```
- **Variables:**
  - `{{1}}` = name
  - `{{2}}` = amount
  - `{{3}}` = period
  - `{{4}}` = approve_link

---

## Submission Instructions

These templates must be submitted to Meta for approval before they can be used in production. Follow these steps:

### Prerequisites

1. You must have a Twilio account with WhatsApp Business API enabled
2. Your WhatsApp Business Account must be connected to Twilio
3. Access to the Twilio Console

### Step-by-Step Submission Process

1. **Log in to Twilio Console**
   - Navigate to [Twilio Console](https://console.twilio.com)
   - Authenticate with your credentials

2. **Access Messaging Templates**
   - In the left sidebar, navigate to: **Messaging** > **WhatsApp**
   - Click on **Templates**

3. **Create New Template**
   - Click the **Create Template** button
   - Fill in the following information:

4. **Template Configuration**
   - **Template Name:** Use the exact template name from above (e.g., `payment_confirmation`)
   - **Language:** Select **English** from the dropdown
   - **Category:** Select **UTILITY**
   - **Body:** Copy the exact body text from the template definition above
   - **Variables:** Map the numbered variables ({{1}}, {{2}}, etc.) to their corresponding descriptions

5. **Submit for Approval**
   - After creating each template, Twilio will submit it to Meta for approval
   - Approval typically takes 24-48 hours
   - You will receive notifications when approval status changes

6. **Monitor Status**
   - In the Templates section, view the status of each template
   - Statuses include: `PENDING`, `APPROVED`, `REJECTED`, or `PAUSED`

### Important Notes

- All four templates must be in UTILITY category (transactional/operational messages)
- Do not modify template text after submission
- If a template is rejected, review Meta's guidelines and resubmit with corrected text
- Only use templates in production once they show `APPROVED` status
- Variables must be consistently numbered and used in order

### Using Templates in Production

Once approved, use templates via Twilio API or Console:

```
POST /Accounts/{AccountSid}/Messages.json

{
  "From": "whatsapp:+1234567890",
  "To": "whatsapp:+1234567890",
  "ContentSid": "<approved_template_sid>",
  "ContentVariables": "{
    \"1\": \"John Doe\",
    \"2\": \"$50.00\",
    \"3\": \"Spring 2026\"
  }"
}
```

### Support

- For Twilio-related issues: [Twilio Support](https://support.twilio.com)
- For Meta approval guidelines: [Meta Business Messages Policies](https://developers.facebook.com/docs/whatsapp)
