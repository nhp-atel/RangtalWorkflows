# Google Sheets Setup

## Spreadsheet Information

**Spreadsheet Name:** Rangtal Garba - Registration Tracker

**Purpose:** Central data store for the Garba class registration system. All n8n workflows read/write to this spreadsheet using the exact column headers specified below.

---

## Tab 1: Pending Leads

### Column Headers (A-Q)

| Column | Header |
|--------|--------|
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

---

## Tab 2: Confirmed Leads

### Column Headers (A-J)

| Column | Header |
|--------|--------|
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

---

## Setup Instructions

Follow these steps to create and configure the Google Spreadsheet:

### 1. Create the Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Create new spreadsheet**
3. Name the spreadsheet: **"Rangtal Garba - Registration Tracker"**

### 2. Rename the First Tab

1. Right-click on the default "Sheet1" tab at the bottom
2. Select **Rename**
3. Enter: **"Pending Leads"**
4. Press Enter

### 3. Create the Second Tab

1. Click the **+** button to add a new sheet
2. Right-click on the new sheet and select **Rename**
3. Enter: **"Confirmed Leads"**
4. Press Enter

### 4. Add Column Headers to "Pending Leads"

1. Click on the "Pending Leads" tab
2. Starting in cell A1, add the following headers in row 1:
   - A1: Lead ID
   - B1: Timestamp
   - C1: Name
   - D1: Phone
   - E1: Email
   - F1: Payment Method
   - G1: Amount
   - H1: Subscription Period
   - I1: Status
   - J1: Payment Verified
   - K1: Approved By
   - L1: Approval Token
   - M1: Payment Confirmation Sent
   - N1: Onboarding Sent
   - O1: Follow-up Sent
   - P1: Confirmed Timestamp
   - Q1: Notes

### 5. Add Column Headers to "Confirmed Leads"

1. Click on the "Confirmed Leads" tab
2. Starting in cell A1, add the following headers in row 1:
   - A1: Lead ID
   - B1: Name
   - C1: Phone
   - D1: Email
   - E1: Amount
   - F1: Payment Method
   - G1: Subscription Period
   - H1: Confirmed Timestamp
   - I1: Confirmed By
   - J1: Status

### 6. Freeze Header Row (Recommended)

1. On both tabs, select row 1 (click the row number "1")
2. Go to **View** > **Freeze** > **1 row**
3. This keeps the headers visible when scrolling

### 7. Share with n8n Google Account

1. Click the **Share** button (top right)
2. Add the n8n service account email:
   - Enter the n8n Google service account email address
   - Set permissions to **Editor**
3. Click **Share**

### 8. Copy the Spreadsheet URL

1. The URL format will be: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
2. Copy the **[SPREADSHEET_ID]** portion
3. Store this ID securely for n8n workflow configuration

---

## Important Notes

- **Column headers must match exactly** - n8n workflows reference columns by their exact header names
- **Header row must be row 1** - All workflows assume headers are in the first row
- **Freeze row 1** - This prevents accidental deletion or modification of headers while working with data
- **Do not reorder columns** - The column positions are fixed based on the specifications
- **Share with Editor permissions** - n8n needs write access to add/update records

---

## Verification Checklist

After setup, verify:

- [ ] Spreadsheet is named "Rangtal Garba - Registration Tracker"
- [ ] Tab 1 is named "Pending Leads" with headers A-Q
- [ ] Tab 2 is named "Confirmed Leads" with headers A-J
- [ ] All column headers match exactly as specified
- [ ] Row 1 is frozen on both tabs
- [ ] n8n service account has Editor access
- [ ] Spreadsheet ID is recorded for n8n configuration
