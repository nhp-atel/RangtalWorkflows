# Google Form Setup

## Form Information

**Form Name:** Rangtal Garba - Registration

**Purpose:** Collects registration data for Garba class participants. All form submissions are sent to n8n via Apps Script webhook using the exact field labels specified below as JSON keys.

---

## Form Fields

### Field Configuration Table

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

---

## Setup Instructions

Follow these steps to create and configure the Google Form:

### 1. Create the Form

1. Go to [Google Forms](https://forms.google.com)
2. Click **+ Create new form** (blank form icon)
3. At the top, name the form: **"Rangtal Garba - Registration"**
4. Optionally, add a form description (e.g., "Registration form for Rangtal Garba classes")

### 2. Add Field 1: Full Name

1. In the "Untitled Question" field, enter: **"Full Name"**
2. Select question type: **Short answer**
3. Toggle **Required** to ON
4. Click **Create** or move to the next field

### 3. Add Field 2: Phone

1. Click **+ Add question**
2. Enter: **"Phone"**
3. Select question type: **Short answer**
4. Toggle **Required** to ON

### 4. Add Field 3: Email

1. Click **+ Add question**
2. Enter: **"Email"**
3. Select question type: **Short answer**
4. Toggle **Required** to ON
5. Click the **More options** (three dots) and set validation:
   - Toggle **Data validation** to ON
   - Select: **Email address**
   - Toggle **Required** to ON

### 5. Add Field 4: Amount

1. Click **+ Add question**
2. Enter: **"Amount"**
3. Select question type: **Dropdown**
4. Toggle **Required** to ON
5. Add options (one per line):
   - $40
   - $50
   - $60
6. Note: Adjust options as needed for your pricing

### 6. Add Field 5: Payment Method

1. Click **+ Add question**
2. Enter: **"Payment Method"**
3. Select question type: **Dropdown**
4. Toggle **Required** to ON
5. Add options (one per line):
   - Zelle
   - Cash

### 7. Add Field 6: Subscription Period

1. Click **+ Add question**
2. Enter: **"Subscription Period"**
3. Select question type: **Dropdown**
4. Toggle **Required** to ON
5. Add options (one per line):
   - April 2026
   - May 2026
   - June 2026
6. Note: Update month/year monthly to match current and future periods

### 8. Add Field 7: Notes

1. Click **+ Add question**
2. Enter: **"Notes"**
3. Select question type: **Paragraph**
4. Toggle **Required** to OFF
5. This field is optional for additional comments

### 9. Add Field 8: Zelle Proof Screenshot

1. Click **+ Add question**
2. Enter: **"Zelle Proof Screenshot"**
3. Select question type: **File upload**
4. Toggle **Required** to OFF
5. Configure file upload settings:
   - Click the gear/settings icon
   - Set **File types**: Images only (PNG, JPG, GIF, etc.)
   - Set **Max file size**: 10 MB

### 10. Configure Form Settings

1. Click the **Settings** tab (gear icon)
2. Under **General**:
   - Confirm **Collect email addresses** is set appropriately (optional, but useful for follow-up)
   - If you want responses linked to user accounts, enable **Sign in required** (optional)
3. Under **Presentations**:
   - Optionally set a confirmation message for successful submissions

### 11. Set Up Apps Script Webhook

1. Click **Tools** > **Script Editor** (or **Extensions** > **Apps Script** depending on Google's interface)
2. Replace the default code with the webhook submission script that sends form data to n8n
3. The script will use the exact field labels as JSON keys when sending to n8n
4. Deploy the script as a web app with appropriate permissions
5. Test the webhook by submitting a test form response

### 12. Publish the Form

1. Click the **Send** button (top right)
2. Select how to share:
   - **Link**: Copy the shareable link and distribute to participants
   - **Email**: Send directly to participants
   - **Embed**: Embed on a website
3. Copy the form link and share with your Garba participants

---

## Important Notes

- **Field labels must match exactly** - The Apps Script sends field labels as JSON keys to n8n. Any deviation in spelling, capitalization, or punctuation will cause n8n to not recognize the fields.
- **Required fields** - Fields 1-6 are marked as required; ensure participants cannot submit without them.
- **Optional fields** - Fields 7-8 are optional; users can submit without completing them.
- **Dropdown options** - Make sure dropdown options match exactly what you configure (case-sensitive)
- **File upload limits** - The Zelle proof screenshot is limited to 10 MB and image files only to minimize storage and ensure appropriate file types
- **Monthly updates** - Remember to update the **Subscription Period** dropdown monthly to reflect current and upcoming months

---

## Field Label Reference for n8n Mapping

Use these exact labels when configuring n8n workflows to process form responses:

```
Full Name
Phone
Email
Amount
Payment Method
Subscription Period
Notes
Zelle Proof Screenshot
```

Each field label becomes a JSON key in the webhook payload sent to n8n. Ensure your n8n workflow expects these exact keys.

---

## Verification Checklist

After setup, verify:

- [ ] Form is named "Rangtal Garba - Registration"
- [ ] All 8 fields are added in the correct order
- [ ] Fields 1-6 are marked as **Required**
- [ ] Fields 7-8 are marked as **Not Required** (optional)
- [ ] Email field has email validation enabled
- [ ] All dropdown options are correctly configured
- [ ] File upload field accepts images only with 10 MB max
- [ ] Apps Script webhook is deployed and configured
- [ ] Test submission completes successfully and reaches n8n
- [ ] Form link is shareable and accessible to participants

---

## Troubleshooting

### Form submissions not reaching n8n

1. Check the Apps Script logs in Google Cloud Console
2. Verify the webhook URL in the script matches your n8n instance
3. Ensure all field labels match exactly (case-sensitive)
4. Test the webhook manually by submitting a test form response

### Dropdown values not appearing correctly

1. Check spelling and capitalization match the configuration
2. Ensure each option is on a separate line during setup
3. Preview the form to see how options appear to users

### File upload not working

1. Verify file type restrictions are set to **Images only**
2. Check that max file size is set to **10 MB**
3. Test upload with a small image file (under 5 MB) first
