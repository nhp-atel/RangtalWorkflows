# Garba Registration System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an event-driven registration system for Rangtal Garba classes that automates lead intake, Zelle payment approval, and cash follow-up using Google Forms, n8n Cloud, Google Sheets, and Twilio WhatsApp.

**Architecture:** Three n8n webhook-driven workflows. Google Form + Apps Script triggers intake. Approval via one-click secure link in WhatsApp. Cash leads get an immediate reminder. All data stored in a two-tab Google Spreadsheet.

**Tech Stack:** n8n Cloud, Google Forms, Google Sheets, Google Apps Script, Twilio WhatsApp API

---

## File Structure

```
workflows/
  wf1-lead-intake.json           # n8n workflow JSON for WF1
  wf2-zelle-approval.json        # n8n workflow JSON for WF2
scripts/
  form-webhook.gs                # Google Apps Script for form → n8n webhook
templates/
  whatsapp-templates.md          # WhatsApp message templates for Twilio/Meta approval
  approve-success.html           # HTML returned to approver after successful approval
  approve-error.html             # HTML returned for invalid/expired token
  approve-already-done.html      # HTML returned if already approved
docs/
  google-sheets-setup.md         # Column headers and sheet setup instructions
  google-form-setup.md           # Form field configuration guide
```

Note: n8n workflows are built in the n8n Cloud UI. The JSON files here are exports for version control and backup. WF3 (cash follow-up) is inline within WF1 — not a separate workflow file.

---

### Task 1: Google Sheets Setup

**Files:**
- Create: `docs/google-sheets-setup.md`

- [ ] **Step 1: Write the sheet setup guide**

Create `docs/google-sheets-setup.md` with exact column headers for both tabs:

```markdown
# Google Sheets Setup

## Spreadsheet Name
Rangtal Garba - Registration Tracker

## Tab 1: Pending Leads

Create these column headers in row 1, exactly as written:

| Col | Header |
|-----|--------|
| A | Lead ID |
| B | Timestamp |
| C | Name |
| D | Phone |
| E | Email |
| F | Payment Method |
| G | Amount |
| H | Subscription Period |
| I | Status |
| J | Payment Verified |
| K | Approved By |
| L | Approval Token |
| M | Payment Confirmation Sent |
| N | Onboarding Sent |
| O | Follow-up Sent |
| P | Confirmed Timestamp |
| Q | Notes |

## Tab 2: Confirmed Leads

Create these column headers in row 1, exactly as written:

| Col | Header |
|-----|--------|
| A | Lead ID |
| B | Name |
| C | Phone |
| D | Email |
| E | Amount |
| F | Payment Method |
| G | Subscription Period |
| H | Confirmed Timestamp |
| I | Confirmed By |
| J | Status |

## Setup Steps

1. Create a new Google Spreadsheet named "Rangtal Garba - Registration Tracker"
2. Rename the first tab to "Pending Leads"
3. Add a second tab named "Confirmed Leads"
4. Add column headers to both tabs as specified above
5. Freeze row 1 on both tabs (View → Freeze → 1 row)
6. Share the spreadsheet with the Google account used in n8n Cloud OAuth
```

- [ ] **Step 2: Create the spreadsheet manually**

Open Google Sheets, create the spreadsheet, and set up both tabs with the exact column headers from the guide. Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`). You will need this for n8n.

- [ ] **Step 3: Verify**

Confirm both tabs exist with correct headers. Note the Spreadsheet ID for later tasks.

- [ ] **Step 4: Commit**

```bash
git add docs/google-sheets-setup.md
git commit -m "docs: add Google Sheets setup guide with column headers"
```

---

### Task 2: Google Form Setup

**Files:**
- Create: `docs/google-form-setup.md`

- [ ] **Step 1: Write the form setup guide**

Create `docs/google-form-setup.md`:

```markdown
# Google Form Setup

## Form Name
Rangtal Garba - Registration

## Fields (in order)

| # | Field Label | Type | Required | Options/Validation |
|---|------------|------|----------|--------------------|
| 1 | Full Name | Short text | Yes | — |
| 2 | Phone | Short text | Yes | — |
| 3 | Email | Short text | Yes | Email validation |
| 4 | Amount | Dropdown | Yes | $40, $50, $60 (adjust as needed) |
| 5 | Payment Method | Dropdown | Yes | Zelle, Cash |
| 6 | Subscription Period | Dropdown | Yes | April 2026, May 2026, June 2026 (update monthly) |
| 7 | Notes | Long text (paragraph) | No | — |
| 8 | Zelle Proof Screenshot | File upload | No | Allow: Images only, Max: 10MB |

## Setup Steps

1. Go to Google Forms and create a new form
2. Set the title to "Rangtal Garba - Registration"
3. Add each field in order as specified above
4. For the File Upload field: enable "Allow only specific file types" → Images
5. Enable "Collect email addresses" in form settings (Settings → Responses)
6. Note the Form ID from the URL for the Apps Script setup
```

- [ ] **Step 2: Create the Google Form manually**

Build the form in Google Forms with all 8 fields matching the guide.

- [ ] **Step 3: Test with a dummy submission**

Submit the form once with test data. Confirm the response appears in the form's Responses tab.

- [ ] **Step 4: Commit**

```bash
git add docs/google-form-setup.md
git commit -m "docs: add Google Form setup guide with field definitions"
```

---

### Task 3: n8n Cloud Credentials Setup

**Depends on:** Task 1 (need Spreadsheet ID)

- [ ] **Step 1: Configure Google Sheets credential in n8n**

1. In n8n Cloud, go to **Credentials → Add Credential → Google Sheets OAuth2**
2. Click **Connect** — this opens the Google OAuth flow
3. Authorize with the Google account that owns the spreadsheet
4. Name the credential: `Rangtal Google Sheets`
5. Test by clicking **Test** — should show "Connection successful"

- [ ] **Step 2: Configure Twilio credential in n8n**

1. In n8n Cloud, go to **Credentials → Add Credential → Twilio**
2. Enter:
   - **Account SID:** (from Twilio Console → Account Info)
   - **Auth Token:** (from Twilio Console → Account Info)
3. Name the credential: `Rangtal Twilio`
4. Test the credential

- [ ] **Step 3: Verify WhatsApp sender**

1. In Twilio Console → Messaging → Senders → WhatsApp Senders
2. Confirm you have an active WhatsApp sender number
3. Note the sender number (format: `whatsapp:+1XXXXXXXXXX`) — you'll use this in n8n Twilio nodes

---

### Task 4: WhatsApp Message Templates

**Files:**
- Create: `templates/whatsapp-templates.md`

- [ ] **Step 1: Write template definitions**

Create `templates/whatsapp-templates.md`:

```markdown
# WhatsApp Message Templates for Twilio

These templates must be submitted to Meta via Twilio Console for approval
before they can be used in production WhatsApp messaging.

## Template 1: payment_confirmation

**Category:** UTILITY
**Language:** en

**Body:**
Hi {{1}}, we've received your Zelle payment of {{2}} for {{3}}. Your registration is confirmed!

**Variables:**
- {{1}} = Customer name
- {{2}} = Amount (e.g., $50)
- {{3}} = Subscription period (e.g., April 2026)

---

## Template 2: onboarding_welcome

**Category:** UTILITY
**Language:** en

**Body:**
Hi {{1}}, welcome to Rangtal Garba! Your onboarding for {{2}} is complete. We'll share class schedule and details shortly. See you on the dance floor!

**Variables:**
- {{1}} = Customer name
- {{2}} = Subscription period

---

## Template 3: cash_reminder

**Category:** UTILITY
**Language:** en

**Body:**
Hi {{1}}, thanks for registering for Rangtal Garba ({{2}})! Your payment method is marked as cash — {{3}}. Please bring your payment to the next class. Questions? Reply to this message.

**Variables:**
- {{1}} = Customer name
- {{2}} = Subscription period
- {{3}} = Amount

---

## Template 4: team_zelle_notification

**Category:** UTILITY
**Language:** en

**Body:**
New Zelle registration: {{1}} — {{2}} for {{3}}. Check your bank and approve: {{4}}

**Variables:**
- {{1}} = Customer name
- {{2}} = Amount
- {{3}} = Subscription period
- {{4}} = Approve link URL

---

## How to Submit

1. Go to Twilio Console → Messaging → Content Template Builder
2. Create each template with the name, category, and body above
3. Submit for Meta approval (takes 1-24 hours typically)
4. Once approved, note the Template SID for each — used in n8n Twilio nodes
```

- [ ] **Step 2: Submit templates to Twilio/Meta**

Follow the instructions in the file to submit all 4 templates. Note the Template SIDs after approval.

- [ ] **Step 3: Commit**

```bash
git add templates/whatsapp-templates.md
git commit -m "docs: add WhatsApp message templates for Twilio/Meta approval"
```

---

### Task 5: Approval Response Pages

**Files:**
- Create: `templates/approve-success.html`
- Create: `templates/approve-error.html`
- Create: `templates/approve-already-done.html`

- [ ] **Step 1: Create success page**

Create `templates/approve-success.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Approved</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0fdf4; color: #166534; }
    .card { text-align: center; padding: 3rem; max-width: 400px; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #4b5563; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Payment Approved</h1>
    <p>The Zelle payment has been verified. Confirmation and onboarding messages have been sent to the customer via WhatsApp.</p>
  </div>
</body>
</html>
```

- [ ] **Step 2: Create error page**

Create `templates/approve-error.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Approval Error</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fef2f2; color: #991b1b; }
    .card { text-align: center; padding: 3rem; max-width: 400px; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #4b5563; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>Invalid Approval Link</h1>
    <p>This approval link is invalid or has expired. Please check the Pending Leads sheet directly or contact the admin.</p>
  </div>
</body>
</html>
```

- [ ] **Step 3: Create already-done page**

Create `templates/approve-already-done.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Already Approved</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #eff6ff; color: #1e40af; }
    .card { text-align: center; padding: 3rem; max-width: 400px; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #4b5563; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">ℹ️</div>
    <h1>Already Approved</h1>
    <p>This payment has already been approved and the customer has been notified. No further action needed.</p>
  </div>
</body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add templates/approve-success.html templates/approve-error.html templates/approve-already-done.html
git commit -m "feat: add approval response HTML pages for WF2 webhook"
```

---

### Task 6: Build n8n Workflow 1 — Lead Intake

**Files:**
- Create: `workflows/wf1-lead-intake.json` (exported from n8n after building)

**Depends on:** Task 1, Task 3

This is the main workflow. Build it in the n8n Cloud UI, then export the JSON for version control.

- [ ] **Step 1: Create the webhook trigger node**

1. In n8n Cloud, create a new workflow named **"WF1 - Lead Intake"**
2. Add a **Webhook** node as the trigger:
   - HTTP Method: `POST`
   - Path: `lead-intake`
   - Response Mode: `Last Node` (so Apps Script gets a response)
3. Save and note the webhook URL — you'll need it for the Apps Script

- [ ] **Step 2: Add the Lead ID generator (Code node)**

Add a **Code** node after the Webhook:

```javascript
// Generate Lead ID: RG-YYYYMMDD-NNN
const now = new Date();
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

// Get current row count from input (we'll set this up in the next node)
// For now, use timestamp-based uniqueness
const seq = String(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()).padStart(3, '0');
const leadId = `RG-${dateStr}-${seq}`;

// Generate UUID v4 approval token
const token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);

return [{
  json: {
    leadId: leadId,
    timestamp: timestamp,
    name: $input.first().json.body['Full Name'] || $input.first().json['Full Name'],
    phone: $input.first().json.body['Phone'] || $input.first().json['Phone'],
    email: $input.first().json.body['Email'] || $input.first().json['Email'],
    paymentMethod: $input.first().json.body['Payment Method'] || $input.first().json['Payment Method'],
    amount: $input.first().json.body['Amount'] || $input.first().json['Amount'],
    subscriptionPeriod: $input.first().json.body['Subscription Period'] || $input.first().json['Subscription Period'],
    notes: $input.first().json.body['Notes'] || $input.first().json['Notes'] || '',
    approvalToken: token,
    status: 'NEW_LEAD'
  }
}];
```

- [ ] **Step 3: Add duplicate check (Google Sheets node)**

Add a **Google Sheets** node (Search/Look Up):
- Operation: **Search**
- Spreadsheet: select "Rangtal Garba - Registration Tracker"
- Sheet: `Pending Leads`
- Lookup Column: `Phone`
- Lookup Value: `{{ $json.phone }}`
- Credential: `Rangtal Google Sheets`

Then add an **IF** node after it:
- Condition: check if any results were found AND the Subscription Period matches
- True (duplicate): connect to a **Respond to Webhook** node that returns `{ "status": "duplicate", "message": "Already registered" }`
- False (new lead): continue to the next step

- [ ] **Step 4: Append to Pending Leads sheet (Google Sheets node)**

Add a **Google Sheets** node (Append Row) on the "new lead" branch:
- Operation: **Append Row**
- Spreadsheet: select "Rangtal Garba - Registration Tracker"
- Sheet: `Pending Leads`
- Map columns:
  - Lead ID → `{{ $json.leadId }}`
  - Timestamp → `{{ $json.timestamp }}`
  - Name → `{{ $json.name }}`
  - Phone → `{{ $json.phone }}`
  - Email → `{{ $json.email }}`
  - Payment Method → `{{ $json.paymentMethod }}`
  - Amount → `{{ $json.amount }}`
  - Subscription Period → `{{ $json.subscriptionPeriod }}`
  - Status → `NEW_LEAD`
  - Payment Verified → `No`
  - Approved By → (empty)
  - Approval Token → `{{ $json.approvalToken }}`
  - Payment Confirmation Sent → `No`
  - Onboarding Sent → `No`
  - Follow-up Sent → `No`
  - Confirmed Timestamp → (empty)
  - Notes → `{{ $json.notes }}`

- [ ] **Step 5: Add payment method branch (Switch node)**

Add a **Switch** node after the sheet append:
- Route by: `{{ $json.paymentMethod }}`
- Output 1: Value = `Zelle` → name it "Zelle"
- Output 2: Value = `Cash` → name it "Cash"

- [ ] **Step 6: Build the Zelle branch**

On the **Zelle** output of the Switch node:

**6a. Update status** — Add a **Google Sheets** node (Update Row):
- Operation: **Update Row**
- Sheet: `Pending Leads`
- Lookup Column: `Lead ID`
- Lookup Value: `{{ $json.leadId }}`
- Update: Status → `PENDING_ZELLE_VERIFICATION`

**6b. Send team notification** — Add a **Twilio** node:
- Resource: Message
- Operation: Send
- From: `whatsapp:+1XXXXXXXXXX` (your Twilio WhatsApp number)
- To: `whatsapp:+1XXXXXXXXXX` (team member's WhatsApp number)
- Message: Use the `team_zelle_notification` template or body text:

```
New Zelle registration: {{ $json.name }} — {{ $json.amount }} for {{ $json.subscriptionPeriod }}. Check your bank and approve: https://<your-n8n-instance>.app.n8n.cloud/webhook/approve?leadId={{ $json.leadId }}&token={{ $json.approvalToken }}
```

**6c. Respond to webhook** — Add a **Respond to Webhook** node:
- Response Body: `{ "status": "ok", "leadId": "{{ $json.leadId }}", "message": "Zelle registration received" }`

- [ ] **Step 7: Build the Cash branch**

On the **Cash** output of the Switch node:

**7a. Update status** — Add a **Google Sheets** node (Update Row):
- Operation: **Update Row**
- Sheet: `Pending Leads`
- Lookup Column: `Lead ID`
- Lookup Value: `{{ $json.leadId }}`
- Update: Status → `PENDING_CASH`

**7b. Send cash reminder** — Add a **Twilio** node:
- From: `whatsapp:+1XXXXXXXXXX` (your Twilio WhatsApp number)
- To: `whatsapp:{{ $json.phone }}`
- Message: Use the `cash_reminder` template or body text:

```
Hi {{ $json.name }}, thanks for registering for Rangtal Garba ({{ $json.subscriptionPeriod }})! Your payment method is marked as cash — {{ $json.amount }}. Please bring your payment to the next class. Questions? Reply to this message.
```

**7c. Update Follow-up Sent** — Add a **Google Sheets** node (Update Row):
- Sheet: `Pending Leads`
- Lookup Column: `Lead ID`
- Lookup Value: `{{ $json.leadId }}`
- Update: Follow-up Sent → `Yes`

**7d. Respond to webhook** — Add a **Respond to Webhook** node:
- Response Body: `{ "status": "ok", "leadId": "{{ $json.leadId }}", "message": "Cash registration received" }`

- [ ] **Step 8: Activate and test WF1**

1. Activate the workflow in n8n
2. Copy the webhook URL
3. Send a test POST from your terminal:

```bash
curl -X POST https://<your-n8n-instance>.app.n8n.cloud/webhook/lead-intake \
  -H "Content-Type: application/json" \
  -d '{
    "Full Name": "Test User",
    "Phone": "+14085551234",
    "Email": "test@example.com",
    "Amount": "$50",
    "Payment Method": "Zelle",
    "Subscription Period": "April 2026",
    "Notes": "Testing"
  }'
```

4. Verify: row appears in Pending Leads sheet with Status = `PENDING_ZELLE_VERIFICATION`
5. Verify: team WhatsApp notification received with approve link
6. Test again with `"Payment Method": "Cash"` — verify cash reminder sent and Follow-up Sent = Yes

- [ ] **Step 9: Export and commit**

1. In n8n, go to the workflow → ... menu → Download
2. Save as `workflows/wf1-lead-intake.json`

```bash
git add workflows/wf1-lead-intake.json
git commit -m "feat: add WF1 Lead Intake workflow (webhook, branching, sheet write, notifications)"
```

---

### Task 7: Build n8n Workflow 2 — Zelle Approval

**Files:**
- Create: `workflows/wf2-zelle-approval.json` (exported from n8n after building)

**Depends on:** Task 5 (HTML pages), Task 6 (WF1 must generate approve links)

- [ ] **Step 1: Create the webhook trigger node**

1. In n8n Cloud, create a new workflow named **"WF2 - Zelle Approval"**
2. Add a **Webhook** node as the trigger:
   - HTTP Method: `GET`
   - Path: `approve`
   - Response Mode: `Last Node`
3. Note: the approve link will be `https://<instance>.app.n8n.cloud/webhook/approve?leadId=XXX&token=YYY`

- [ ] **Step 2: Extract query parameters (Code node)**

Add a **Code** node:

```javascript
const leadId = $input.first().json.query.leadId;
const token = $input.first().json.query.token;

if (!leadId || !token) {
  return [{ json: { valid: false, reason: 'missing_params' } }];
}

return [{ json: { leadId, token, valid: true } }];
```

- [ ] **Step 3: Look up lead in Pending Leads**

Add a **Google Sheets** node (Search):
- Operation: **Search**
- Sheet: `Pending Leads`
- Lookup Column: `Lead ID`
- Lookup Value: `{{ $json.leadId }}`

- [ ] **Step 4: Validate token and status (Code node)**

Add a **Code** node:

```javascript
const lead = $input.first().json;
const inputData = $('Extract Query Params').first().json; // reference the earlier Code node

// Check if lead was found
if (!lead || !lead['Lead ID']) {
  return [{ json: { action: 'error', reason: 'lead_not_found' } }];
}

// Check if already confirmed
if (lead['Status'] === 'CONFIRMED') {
  return [{ json: { action: 'already_done', leadId: lead['Lead ID'] } }];
}

// Validate token
if (lead['Approval Token'] !== inputData.token) {
  return [{ json: { action: 'error', reason: 'invalid_token' } }];
}

// All good — pass lead data through
return [{
  json: {
    action: 'approve',
    leadId: lead['Lead ID'],
    name: lead['Name'],
    phone: lead['Phone'],
    email: lead['Email'],
    amount: lead['Amount'],
    paymentMethod: lead['Payment Method'],
    subscriptionPeriod: lead['Subscription Period']
  }
}];
```

- [ ] **Step 5: Add action branch (Switch node)**

Add a **Switch** node:
- Route by: `{{ $json.action }}`
- Output 1: `approve`
- Output 2: `error`
- Output 3: `already_done`

- [ ] **Step 6: Build the "approve" branch**

On the **approve** output:

**6a. Update Pending Leads — mark as verified** — Google Sheets (Update Row):
- Sheet: `Pending Leads`
- Lookup Column: `Lead ID`
- Lookup Value: `{{ $json.leadId }}`
- Update:
  - Payment Verified → `Yes`
  - Approved By → `Team`
  - Status → `PAID_VERIFIED`

**6b. Send payment confirmation WhatsApp** — Twilio node:
- From: `whatsapp:+1XXXXXXXXXX`
- To: `whatsapp:{{ $json.phone }}`
- Message:

```
Hi {{ $json.name }}, we've received your Zelle payment of {{ $json.amount }} for {{ $json.subscriptionPeriod }}. Your registration is confirmed!
```

**6c. Send onboarding WhatsApp** — Twilio node:
- From: `whatsapp:+1XXXXXXXXXX`
- To: `whatsapp:{{ $json.phone }}`
- Message:

```
Hi {{ $json.name }}, welcome to Rangtal Garba! Your onboarding for {{ $json.subscriptionPeriod }} is complete. We'll share class schedule and details shortly. See you on the dance floor!
```

**6d. Update Pending Leads — mark messages sent** — Google Sheets (Update Row):
- Sheet: `Pending Leads`
- Lookup Column: `Lead ID`
- Lookup Value: `{{ $json.leadId }}`
- Update:
  - Payment Confirmation Sent → `Yes`
  - Onboarding Sent → `Yes`
  - Status → `CONFIRMED`
  - Confirmed Timestamp → `{{ new Date().toISOString().replace('T', ' ').slice(0, 19) }}`

**6e. Append to Confirmed Leads** — Google Sheets (Append Row):
- Sheet: `Confirmed Leads`
- Map columns:
  - Lead ID → `{{ $json.leadId }}`
  - Name → `{{ $json.name }}`
  - Phone → `{{ $json.phone }}`
  - Email → `{{ $json.email }}`
  - Amount → `{{ $json.amount }}`
  - Payment Method → `{{ $json.paymentMethod }}`
  - Subscription Period → `{{ $json.subscriptionPeriod }}`
  - Confirmed Timestamp → `{{ new Date().toISOString().replace('T', ' ').slice(0, 19) }}`
  - Confirmed By → `Team`
  - Status → `CONFIRMED`

**6f. Return success page** — Respond to Webhook node:
- Response Code: `200`
- Response Content Type: `text/html`
- Response Body: paste the contents of `templates/approve-success.html`

- [ ] **Step 7: Build the "error" branch**

On the **error** output:

Add a **Respond to Webhook** node:
- Response Code: `400`
- Response Content Type: `text/html`
- Response Body: paste the contents of `templates/approve-error.html`

- [ ] **Step 8: Build the "already_done" branch**

On the **already_done** output:

Add a **Respond to Webhook** node:
- Response Code: `200`
- Response Content Type: `text/html`
- Response Body: paste the contents of `templates/approve-already-done.html`

- [ ] **Step 9: Activate and test WF2**

1. Activate the workflow
2. First, create a test lead using WF1 (Zelle payment)
3. Copy the approve link from the team WhatsApp notification
4. Open the approve link in a browser
5. Verify:
   - Browser shows the green success page
   - Pending Leads sheet: Status = `CONFIRMED`, Payment Verified = `Yes`
   - Confirmed Leads sheet: new row appears
   - Customer WhatsApp: received both confirmation and onboarding messages
6. Click the same approve link again — should show "Already Approved" page
7. Try a link with a wrong token — should show error page

- [ ] **Step 10: Export and commit**

```bash
git add workflows/wf2-zelle-approval.json
git commit -m "feat: add WF2 Zelle Approval workflow (token validation, sheet updates, WhatsApp notifications)"
```

---

### Task 8: Google Apps Script — Form Webhook

**Files:**
- Create: `scripts/form-webhook.gs`

**Depends on:** Task 6 (need the WF1 webhook URL)

- [ ] **Step 1: Write the Apps Script**

Create `scripts/form-webhook.gs`:

```javascript
/**
 * Fires when the Google Form is submitted.
 * Sends form data as JSON to the n8n webhook.
 *
 * Setup:
 * 1. Open the Google Form
 * 2. Click the three-dot menu → Script Editor
 * 3. Paste this code
 * 4. Replace N8N_WEBHOOK_URL with your actual n8n webhook URL
 * 5. Save
 * 6. Go to Triggers (clock icon) → Add Trigger:
 *    - Function: onFormSubmit
 *    - Event source: From form
 *    - Event type: On form submit
 * 7. Authorize when prompted
 */

var N8N_WEBHOOK_URL = 'https://<your-n8n-instance>.app.n8n.cloud/webhook/lead-intake';

function onFormSubmit(e) {
  var response = e.response;
  var items = response.getItemResponses();
  var data = {};

  items.forEach(function(item) {
    data[item.getItem().getTitle()] = item.getResponse();
  });

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };

  var result = UrlFetchApp.fetch(N8N_WEBHOOK_URL, options);
  Logger.log('n8n response: ' + result.getContentText());
}
```

- [ ] **Step 2: Install the Apps Script on the Google Form**

1. Open the Google Form
2. Click the three-dot menu → Script Editor
3. Delete the default code and paste the contents of `scripts/form-webhook.gs`
4. Replace `N8N_WEBHOOK_URL` with the actual WF1 webhook URL from Task 6
5. Save (Ctrl+S)
6. Go to **Triggers** (clock icon on the left sidebar)
7. Click **+ Add Trigger**:
   - Function: `onFormSubmit`
   - Deployment: `Head`
   - Event source: `From form`
   - Event type: `On form submit`
8. Click **Save** and authorize when prompted

- [ ] **Step 3: End-to-end test**

1. Submit the Google Form with Zelle payment test data
2. Verify:
   - Row appears in Pending Leads sheet (via n8n, not the native form responses)
   - Status = `PENDING_ZELLE_VERIFICATION`
   - Team WhatsApp notification received with approve link
3. Click the approve link
4. Verify:
   - Confirmed Leads sheet: row appended
   - Customer WhatsApp: both messages received
5. Submit the Google Form with Cash payment test data
6. Verify:
   - Row appears in Pending Leads with Status = `PENDING_CASH`
   - Cash reminder WhatsApp sent
   - Follow-up Sent = `Yes`

- [ ] **Step 4: Commit**

```bash
git add scripts/form-webhook.gs
git commit -m "feat: add Google Apps Script for form → n8n webhook integration"
```

---

### Task 9: Error Handling & Manual Review

**Depends on:** Task 6, Task 7

- [ ] **Step 1: Add error handling to WF1**

In n8n, edit WF1:
- On each Twilio node, add an **Error** output
- Connect each Twilio error output to a **Google Sheets** (Update Row) node:
  - Sheet: `Pending Leads`
  - Lookup Column: `Lead ID`
  - Lookup Value: `{{ $json.leadId }}`
  - Update: Status → `MANUAL_REVIEW`

- [ ] **Step 2: Add error handling to WF2**

In n8n, edit WF2:
- On each Twilio node, add an **Error** output
- Connect each Twilio error output to a **Google Sheets** (Update Row) node:
  - Sheet: `Pending Leads`
  - Lookup Column: `Lead ID`
  - Lookup Value: `{{ $json.leadId }}`
  - Update: Status → `MANUAL_REVIEW`
- After the error update, still append to Confirmed Leads (payment was verified, just messaging failed)
- Return the success page anyway (the approval itself succeeded)

- [ ] **Step 3: Test error handling**

1. Temporarily change a Twilio "To" number to an invalid number
2. Submit a test Zelle registration
3. Click the approve link
4. Verify: Pending Leads shows Status = `MANUAL_REVIEW` (or `CONFIRMED` with a note)
5. Revert the Twilio number

- [ ] **Step 4: Re-export both workflows**

```bash
git add workflows/wf1-lead-intake.json workflows/wf2-zelle-approval.json
git commit -m "feat: add error handling with MANUAL_REVIEW status to WF1 and WF2"
```

---

### Task 10: Full End-to-End Smoke Test

**Depends on:** All previous tasks

- [ ] **Step 1: Clean test data**

Delete any test rows from both Pending Leads and Confirmed Leads sheets.

- [ ] **Step 2: Test Zelle happy path**

1. Submit Google Form:
   - Full Name: `Priya Shah`
   - Phone: your real WhatsApp number
   - Email: `priya@test.com`
   - Amount: `$50`
   - Payment Method: `Zelle`
   - Subscription Period: `April 2026`
   - Notes: `End-to-end test`
2. Verify: Pending Leads row created, Status = `PENDING_ZELLE_VERIFICATION`
3. Verify: Team gets WhatsApp with approve link
4. Click approve link in browser
5. Verify: success page shown
6. Verify: Pending Leads row updated to `CONFIRMED`
7. Verify: Confirmed Leads row created
8. Verify: customer WhatsApp received both messages

- [ ] **Step 3: Test Cash happy path**

1. Submit Google Form with Payment Method = `Cash`, different phone/name
2. Verify: Pending Leads row created, Status = `PENDING_CASH`
3. Verify: Cash reminder WhatsApp received
4. Verify: Follow-up Sent = `Yes`
5. Verify: NO row in Confirmed Leads (cash is not confirmed)

- [ ] **Step 4: Test duplicate prevention**

1. Submit the exact same form data as step 2 (same phone + same period)
2. Verify: NO new row created in Pending Leads

- [ ] **Step 5: Test approve link security**

1. Copy an approve link and change the token to a random string
2. Open in browser
3. Verify: error page shown, no sheet changes

- [ ] **Step 6: Test double-approve**

1. Click the original approve link from step 2 again
2. Verify: "Already Approved" page shown, no duplicate in Confirmed Leads

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: final workflow exports after end-to-end testing"
```
