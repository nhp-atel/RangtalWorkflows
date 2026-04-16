# Garba Class Registration System — Design Spec

## Overview

Automated registration and payment tracking system for Rangtal Garba classes. Replaces manual data entry and follow-up processes with an event-driven architecture using Google Forms, Google Sheets, n8n Cloud, and Twilio WhatsApp.

## Business Context

- Monthly subscription Garba class
- ~100 max registrations per period
- Single approver for payment verification
- Two payment methods: Zelle (primary), Cash (deferred)
- Goal: eliminate manual data entry and automate payment follow-ups

## Architecture

### Full Webhook Architecture (Event-Driven)

All triggers are webhook-based. No polling.

**External Services:**
- Google Form — registration intake with Apps Script webhook
- Google Sheets — one spreadsheet with two tabs (Pending Leads, Confirmed Leads)
- Twilio — WhatsApp messaging (3 message templates)
- n8n Cloud — workflow orchestration

**Flow:**

```
Customer submits Google Form
  → Apps Script fires webhook to n8n
    → WF1: Lead Intake
      → Generates Lead ID (RG-YYYYMMDD-NNN)
      → Writes row to Pending Leads sheet
      → Branches by payment method:
        ├─ Zelle:
        │   → Status = PENDING_ZELLE_VERIFICATION
        │   → Generates approval token (UUID)
        │   → Stores token in Pending Leads sheet
        │   → Sends internal WhatsApp to team with approve link
        │   → Team member checks bank, clicks approve link
        │     → WF2: Zelle Approval
        │       → Validates token against Pending Leads sheet
        │       → Updates Pending Leads: Payment Verified = Yes, Status = PAID_VERIFIED
        │       → Sends payment confirmation WhatsApp to customer
        │       → Sends onboarding WhatsApp to customer
        │       → Appends row to Confirmed Leads sheet
        │       → Updates Pending Leads: Status = CONFIRMED
        │
        └─ Cash:
            → Status = PENDING_CASH
            → WF3: Cash Follow-up (inline from WF1)
              → Sends cash reminder WhatsApp to customer
              → Updates Pending Leads: Follow-up Sent = Yes
              → Status stays PENDING_CASH
```

### Workflow Breakdown

#### Workflow 1: Lead Intake

- **Trigger:** Webhook (POST from Google Form Apps Script)
- **Steps:**
  1. Parse form data (name, phone, email, amount, payment method, subscription period, notes)
  2. Generate Lead ID: `RG-YYYYMMDD-NNN` (date + daily sequence from row count)
  3. Append row to Pending Leads sheet with Status = NEW_LEAD
  4. Branch on Payment Method:
     - **Zelle:** Generate UUID approval token, store in sheet, update status to PENDING_ZELLE_VERIFICATION, send internal notification WhatsApp to team with approve link
     - **Cash:** Update status to PENDING_CASH, call WF3 inline

#### Workflow 2: Zelle Approval

- **Trigger:** Webhook (GET from approve link click)
- **Steps:**
  1. Extract lead ID and token from URL query parameters
  2. Look up lead in Pending Leads sheet by Lead ID
  3. Validate token matches stored Approval Token
  4. If invalid: return error page
  5. If valid:
     - Update Pending Leads: Payment Verified = Yes, Approved By = Team, Status = PAID_VERIFIED
     - Send payment confirmation WhatsApp to customer
     - Send onboarding WhatsApp to customer
     - Update Pending Leads: Payment Confirmation Sent = Yes, Onboarding Sent = Yes
     - Append row to Confirmed Leads sheet with Status = CONFIRMED, Confirmed Timestamp = now
     - Update Pending Leads: Status = CONFIRMED, Confirmed Timestamp = now
     - Return success page to approver's browser

#### Workflow 3: Cash Follow-up

- **Trigger:** Called inline from WF1 cash branch (not a separate cron)
- **Steps:**
  1. Send cash reminder WhatsApp to customer
  2. Update Pending Leads: Follow-up Sent = Yes
  3. Status remains PENDING_CASH (no confirmation for cash yet)

### Approve Link Design

- URL format: `https://<n8n-cloud-host>/webhook/approve?leadId=RG-20260415-001&token=<uuid>`
- Token is a UUID v4 generated per lead at intake time
- Stored in the Approval Token column of Pending Leads
- WF2 validates the token before processing
- One-time use: after approval, the token could be cleared or the status check prevents re-processing
- No expiry for now (can be added later if needed)

## Status Model

| Status | Meaning | Set By |
|--------|---------|--------|
| `NEW_LEAD` | Just submitted, not yet branched | WF1 (briefly, before branching) |
| `PENDING_ZELLE_VERIFICATION` | Awaiting Zelle payment approval | WF1 Zelle branch |
| `PENDING_CASH` | Cash payment, reminder sent | WF1 Cash branch |
| `PAID_VERIFIED` | Zelle payment confirmed by team | WF2 (intermediate) |
| `CONFIRMED` | Fully confirmed and onboarded | WF2 (final) |
| `MANUAL_REVIEW` | Something needs human attention | Any workflow on error |

## Data Model

### Google Form Fields

| Field | Type | Required |
|-------|------|----------|
| Full Name | Text | Yes |
| Phone | Text | Yes |
| Email | Email | Yes |
| Amount | Number/Dropdown | Yes |
| Payment Method | Dropdown (Zelle, Cash) | Yes |
| Subscription Period | Dropdown (e.g., April 2026) | Yes |
| Notes | Text | No |
| Zelle Proof Screenshot | File upload | No |

### Pending Leads Sheet (Tab 1)

| Column | Source | Example | Notes |
|--------|--------|---------|-------|
| Lead ID | n8n generated | `RG-20260415-001` | RG + date + daily sequence |
| Timestamp | n8n | `2026-04-15 20:30:00` | ISO format, UTC |
| Name | Form | Priya Shah | |
| Phone | Form | `+14085551234` | E.164 format for Twilio |
| Email | Form | priya@email.com | |
| Payment Method | Form | Zelle / Cash | Drives branching |
| Amount | Form | $50 | |
| Subscription Period | Form | April 2026 | Monthly |
| Status | n8n | `PENDING_ZELLE_VERIFICATION` | From status model |
| Payment Verified | n8n | Yes / No | Set via approve link |
| Approved By | n8n | Team | Who clicked approve |
| Approval Token | n8n | `a3f8c...` | UUID for approve link |
| Payment Confirmation Sent | n8n | Yes / No | WhatsApp sent flag |
| Onboarding Sent | n8n | Yes / No | WhatsApp sent flag |
| Follow-up Sent | n8n | Yes / No | Cash reminder flag |
| Confirmed Timestamp | n8n | `2026-04-15 21:00:00` | When fully confirmed |
| Notes | Form | First time attending | Optional |

### Confirmed Leads Sheet (Tab 2)

| Column | Example | Notes |
|--------|---------|-------|
| Lead ID | `RG-20260415-001` | Links to Pending row |
| Name | Priya Shah | |
| Phone | `+14085551234` | |
| Email | priya@email.com | |
| Amount | $50 | |
| Payment Method | Zelle | Only Zelle for now |
| Subscription Period | April 2026 | |
| Confirmed Timestamp | `2026-04-15 21:00:00` | |
| Confirmed By | Team | |
| Status | `CONFIRMED` | Always CONFIRMED here |

## WhatsApp Message Templates

### MSG 1: Payment Confirmation

- **Trigger:** Zelle approved (WF2)
- **Template:**

> Hi {{name}}, we've received your Zelle payment of {{amount}} for {{period}}. Your registration is confirmed!

### MSG 2: Onboarding

- **Trigger:** Immediately after payment confirmation (WF2)
- **Template:**

> Hi {{name}}, welcome to Rangtal Garba! Your onboarding for {{period}} is complete. We'll share class schedule and details shortly. See you on the dance floor!

### MSG 3: Cash Reminder

- **Trigger:** Immediately after cash registration (WF3, called from WF1)
- **Template:**

> Hi {{name}}, thanks for registering for Rangtal Garba ({{period}})! Your payment method is marked as cash — {{amount}}. Please bring your payment to the next class. Questions? Reply to this message.

### MSG 4: Internal Team Notification (Zelle)

- **Trigger:** New Zelle registration (WF1)
- **Template:**

> New Zelle registration: {{name}} — {{amount}} for {{period}}. Check your bank and approve: {{approve_link}}

## Google Apps Script (Form Webhook)

A small script (~10 lines) attached to the Google Form that fires on form submit:

```javascript
function onFormSubmit(e) {
  var response = e.response;
  var items = response.getItemResponses();
  var data = {};
  items.forEach(function(item) {
    data[item.getItem().getTitle()] = item.getResponse();
  });
  UrlFetchApp.fetch('https://<n8n-webhook-url>/webhook/lead-intake', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data)
  });
}
```

Attached via Google Form > Script Editor > Triggers > On Form Submit.

## Error Handling

- **Duplicate submission:** WF1 checks if phone+period combination already exists in Pending Leads. If so, skips and returns a message (does not create duplicate row).
- **Invalid approve token:** WF2 returns an error page to the browser. No sheet updates.
- **Already approved:** WF2 checks status before processing. If already CONFIRMED, returns "already approved" page.
- **Twilio failure:** If WhatsApp send fails, set status to MANUAL_REVIEW and log the error. Do not block the approval flow.
- **Apps Script failure:** Form data still lands in the native Google Form responses sheet as a fallback. Manual recovery possible.

## API Keys & Credentials

| Credential | Where to get it | Used by | Configured in |
|------------|----------------|---------|---------------|
| **Google OAuth2** (Sheets API) | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID | WF1, WF2, WF3 (read/write sheets) | n8n Cloud → Credentials → Google Sheets OAuth2 |
| **Twilio Account SID** | Twilio Console → Account Info | WF1, WF2, WF3 (send WhatsApp) | n8n Cloud → Credentials → Twilio |
| **Twilio Auth Token** | Twilio Console → Account Info | WF1, WF2, WF3 (send WhatsApp) | n8n Cloud → Credentials → Twilio |
| **Twilio WhatsApp Sender Number** | Twilio Console → Messaging → Senders → WhatsApp Senders | WF1, WF2, WF3 | n8n workflow config (From field) |
| **n8n Webhook URLs** (auto-generated) | n8n Cloud → each Webhook node generates its own URL | Apps Script (intake), Approve link (approval) | Apps Script code, WF1 approve link template |

### Google OAuth2 Scopes Required

- `https://www.googleapis.com/auth/spreadsheets` — read/write Pending & Confirmed Leads
- `https://www.googleapis.com/auth/drive.readonly` — access Zelle screenshot uploads (if stored in Drive)

### n8n Cloud Credential Setup Order

1. **Google Sheets OAuth2** — connect n8n to your Google account. n8n Cloud handles the OAuth flow — click "Connect" in the credential setup, authorize, done.
2. **Twilio** — enter Account SID + Auth Token. Test by sending a WhatsApp to your own number.
3. **Activate webhook URLs** — once WF1 and WF2 are built, n8n generates the webhook URLs. Copy the WF1 intake URL into the Apps Script.

### Notes

- No standalone API keys needed — Google uses OAuth2 (managed by n8n), Twilio uses SID+Token pair.
- The Apps Script does not need its own credentials — it runs under the form owner's Google account and calls the n8n webhook URL (public endpoint, no auth needed on the n8n side since form data is not sensitive enough to warrant webhook auth).
- If you want to secure the intake webhook, you can add a shared secret as a query parameter and validate it in WF1.

## Setup Prerequisites

1. **Google Form** created with fields matching the spec
2. **Google Spreadsheet** with Pending Leads and Confirmed Leads tabs, columns matching the spec
3. **Apps Script** attached to Google Form with onFormSubmit trigger
4. **n8n Cloud** account with Google Sheets and Twilio integrations configured
5. **Twilio** account with WhatsApp Business sender and pre-approved message templates (Meta approval required)
6. **WhatsApp template approval** — templates must be submitted to Meta via Twilio console before going live

## Future Considerations (Not In Scope)

- Cash confirmation flow (when rules are decided)
- Approve link expiry
- Multiple approvers with role tracking
- Monthly renewal reminders
- Dashboard or reporting view
- Stripe or other payment gateway integration
