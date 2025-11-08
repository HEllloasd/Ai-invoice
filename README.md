# AI Invoice Processing App

An intelligent invoice processing application that extracts data from PDF invoices using AI, validates and corrects the information, and seamlessly sends it to Xero accounting software.

## What This App Does

This application streamlines your invoice processing workflow by:

1. **Accepting PDF Invoices**: Upload any PDF invoice through a simple drag-and-drop interface
2. **AI-Powered Extraction**: Automatically extracts key information from invoices including:
   - Supplier/customer contact details
   - Invoice numbers and dates
   - Line items with descriptions, quantities, and prices
   - Tax information and totals
3. **Smart Validation**: Uses AI to validate and correct extracted data for accuracy
4. **Xero Integration**: Sends validated invoices directly to your Xero accounting system as bills or sales invoices
5. **Progress Tracking**: Monitor each invoice through the processing pipeline in real-time
6. **History Management**: View and resend any previously processed invoice

The app eliminates manual data entry, reduces errors, and speeds up your accounts payable/receivable workflow.

## Features

- **Drag & Drop Upload**: Easy PDF invoice upload with drag-and-drop interface
- **AI Processing**: Automated invoice data extraction and validation
- **Real-time Progress Tracking**: Live updates as your invoice is processed
- **Data Review**: Review extracted invoice data before sending to Xero
- **Upload History**: Track all your uploaded invoices and their status
- **Xero Integration**: Direct integration with Xero for seamless accounting

## First Time Setup

When setting up this app for the first time, follow these steps in order:

### Prerequisites

Before you begin, make sure you have:
- **Node.js** (version 18 or higher) installed
- **npm** or **yarn** package manager
- An **n8n instance** with invoice processing workflows set up
- A **Xero account** with API access (if sending to Xero)

### Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This installs all required packages including React, Supabase client, and other dependencies.

### Step 1.5: Copy Environment File

**IMPORTANT**: Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

This file contains the shared Supabase connection details needed for the app to work. Without this file, the app will not load.

### Step 2: Configure Supabase (Already Done - Shared Database)

✅ **Good news**: The Supabase database and storage are already configured and ready to use!

**📌 Important: This is a shared database setup**
- All users connect to the **same Supabase instance**
- The `.env` file contains the shared connection details
- Everyone using this app will see the same invoices and upload history
- All data is stored in one centralized location

**What's included:**

The `.env` file contains the Supabase connection details:
- `VITE_SUPABASE_URL` - Shared Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public API key for frontend access

**Database tables** are already created via migrations:
- `reviews` - Stores invoice processing records (shared by all users)
- `xero_tokens` - Stores Xero authentication tokens

**Storage bucket** is ready:
- `invoices` - Stores uploaded PDF files with public access (shared)

**Edge functions** are deployed:
- `send-to-xero` - Sends invoices to Xero API
- `xero-auth` - Handles Xero OAuth authentication

**Benefits of this setup:**
- ✅ Zero configuration needed - just install and run
- ✅ No Supabase account required
- ✅ Centralized data management
- ✅ Team collaboration - everyone sees all invoices
- ✅ No database setup or migration needed

**Trade-offs:**
- ⚠️ All users share the same data (no data isolation)
- ⚠️ Everyone can view and resend any invoice
- ⚠️ Suitable for team/internal use, not for distributing to external users

### Step 3: Configure n8n Webhooks (REQUIRED)

This is the **most important step**. Without webhook configuration, invoices won't be processed.

1. **Get your n8n webhook URLs**:
   - Open your n8n workflow
   - Click on each Webhook node
   - Copy the webhook URL (e.g., `https://n8n.example.com/webhook/...`)

2. **Edit the configuration file**:
   - Open `src/config/webhooks.ts`
   - Replace the placeholder URLs with your actual n8n webhooks:

   ```typescript
   export const WEBHOOKS = {
     pdf: {
       dropbox: 'YOUR_PDF_PROCESSING_WEBHOOK_URL',
     },
     review: {
       result: 'YOUR_REVIEW_RESULT_WEBHOOK_URL',
     },
     choice: {
       receiveChoice: 'YOUR_CHOICE_WEBHOOK_URL',
     },
   } as const;
   ```

3. **Save the file**

See the "Setting Up n8n Webhooks" section below for detailed instructions.

### Step 4: Configure Xero (Already Done)

✅ **Good news**: Xero integration is already configured in Supabase!

- `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` are set in edge function environment variables
- OAuth tokens are stored in the `xero_tokens` table
- The app automatically refreshes expired tokens

### Step 5: Start the Application

```bash
npm run dev
```

The app will open in your browser at `http://localhost:5173`

### Step 6: Test the Setup

1. Click "Upload New Invoice"
2. Upload a test PDF invoice
3. Watch the progress page - it should show processing status
4. If it gets stuck, check the Troubleshooting section

---

## How to Use

### 1. Starting the Application (After Setup)

```bash
npm run dev
```

The app will open in your browser.

### 2. Uploading an Invoice

1. **Welcome Screen**: Click "Upload New Invoice" to begin
2. **Upload Page**:
   - Drag and drop your PDF invoice file onto the upload area, or click to browse
   - Only PDF files are accepted
   - The file will be uploaded to secure storage automatically

### 3. Processing

Once uploaded, the app will:
1. Store your invoice securely
2. Send it to the AI processing webhook
3. Extract invoice data (contact details, line items, amounts, dates)
4. Validate and correct any errors
5. Display real-time progress updates

**Progress Stages:**
- **Uploaded**: Invoice file received
- **Processing**: AI is extracting and validating data
- **Reviewed**: Data extraction complete
- **Final**: Ready for review

### 4. Reviewing Invoice Data

On the Review page, you'll see:
- **Contact Information**: Supplier/customer details
- **Invoice Details**: Invoice number, date, due date
- **Line Items**: Products/services with quantities and prices
- **Totals**: Subtotal, tax, and total amount

**Options:**
- **Send to Xero**: Confirms data is correct and sends to Xero
- **Go Back**: Return to make changes or upload a different invoice

### 5. Sending to Xero

When you click "Send to Xero":
1. You'll be asked to choose the download type:
   - **Draft**: Save as draft in Xero for later review
   - **Submit for Approval**: Send for approval workflow
   - **Authorize**: Post directly to Xero
2. The invoice is sent via the Xero API
3. You'll see a success confirmation

### 6. Upload History

View all your past uploads:
- Click "View Upload History" from the Welcome page
- See invoice status for each upload
- Click "Resend to Xero" for any invoice to send it again
- Review original invoice data

## Application Structure

### Pages

- **Welcome** (`/`): Landing page and navigation hub
- **Upload** (`/upload`): File upload interface
- **Progress** (`/progress`): Real-time processing status
- **Review** (`/review`): Invoice data review and confirmation
- **Success** (`/success`): Confirmation after sending to Xero

### Database Tables

- **reviews**: Stores invoice processing records with status tracking
- **xero_tokens**: Manages Xero API authentication tokens

### Storage

- **invoices**: Supabase storage bucket for uploaded PDF files

### Edge Functions

- **send-to-xero**: Handles sending invoice data to Xero API
- **xero-auth**: Manages Xero OAuth authentication

## Configuration

### Setting Up n8n Webhooks (Required Before Starting)

The application uses n8n workflows to process invoices with AI. You **must** configure these webhook URLs before the app will work properly.

#### What Are the Webhooks For?

This app connects to three n8n webhook endpoints:

1. **PDF Processing Webhook** (`pdf.dropbox`):
   - Receives the uploaded PDF invoice file
   - Extracts text and data from the PDF
   - Performs AI analysis to identify invoice fields
   - Returns structured invoice data

2. **Review Result Webhook** (`review.result`):
   - Receives the extracted invoice data
   - Stores the results in the database
   - Triggers UI updates to show processed data

3. **Choice Webhook** (`choice.receiveChoice`):
   - Receives the user's selection (Draft/Submit/Authorize)
   - Applies any final corrections or transformations
   - Returns Xero-formatted invoice data ready to send

#### How to Change the Webhook URLs

**Step 1: Locate Your n8n Webhook URLs**

In your n8n instance:
1. Open your invoice processing workflow
2. Click on each Webhook node
3. Copy the webhook URL shown (it will look like `https://your-n8n-instance.com/webhook/...`)

**Step 2: Update the Configuration File**

1. Open the file: `src/config/webhooks.ts` in your code editor
2. Replace the URLs with your own n8n webhook URLs:

```typescript
export const WEBHOOKS = {
  pdf: {
    dropbox: 'YOUR_PDF_WEBHOOK_URL_HERE',
  },
  review: {
    result: 'YOUR_REVIEW_WEBHOOK_URL_HERE',
  },
  choice: {
    receiveChoice: 'YOUR_CHOICE_WEBHOOK_URL_HERE',
  },
} as const;
```

**Example with real URLs:**

```typescript
export const WEBHOOKS = {
  pdf: {
    dropbox: 'https://n8n.mycompany.com/webhook/invoice-pdf-upload',
  },
  review: {
    result: 'https://n8n.mycompany.com/webhook/invoice-review-result',
  },
  choice: {
    receiveChoice: 'https://n8n.mycompany.com/webhook/invoice-choice',
  },
} as const;
```

**Step 3: Save and Restart**

1. Save the `src/config/webhooks.ts` file
2. If the app is running, stop it with `Ctrl+C` or `Cmd+C`
3. Restart the app: `npm run dev`
4. The app will now use your webhook URLs

#### Important Notes

- **Without valid webhook URLs**: Invoices will upload but will get stuck in "Processing" status
- **Webhook Requirements**: Your n8n workflows must be active and publicly accessible
- **Testing**: After changing webhooks, upload a test invoice to verify the connection works
- **Security**: Keep webhook URLs secure as they provide access to your n8n workflows
- **Localtunnel URLs**: If using localtunnel (like `*.loca.lt`), note that these URLs expire and need to be updated regularly

#### Webhook Data Format

Your n8n workflows should expect and return data in these formats:

**PDF Webhook** receives:
```json
{
  "review_id": "REV-XXXXX-XXXXX",
  "pdf_url": "https://storage.supabase.co/..."
}
```

**Choice Webhook** receives:
```json
{
  "route": "xero",
  "review_id": "REV-XXXXX-XXXXX"
}
```

**Choice Webhook** should return:
```json
[{
  "xeroInvoice": "{...JSON string with Xero-formatted invoice...}"
}]
```

The `xeroInvoice` must include all required Xero fields: `Type`, `Contact`, `Date`, `LineItems` (with `AccountCode` and `TaxType` for each item), etc.

### Environment Variables

The `.env` file contains Supabase connection details (automatically configured).

## Troubleshooting

**App won't load or shows blank page?**
- **Most Common Issue**: Missing `.env` file
- Copy `.env.example` to `.env`: `cp .env.example .env`
- Restart the development server: Stop with `Ctrl+C` and run `npm run dev` again
- Check browser console for error messages

**Upload not working?**
- Check that PDF is valid and not corrupted
- Ensure file size is reasonable (under 10MB recommended)
- Verify Supabase storage bucket permissions

**Processing stuck at "Processing" stage?**
- **Most Common Issue**: Webhook URLs are incorrect or expired
- Verify n8n webhook endpoints are accessible (test in browser or with curl)
- Check that n8n workflows are active and running
- Look at browser console for 404 or connection errors
- If using localtunnel URLs, they may have expired - generate new ones and update `src/config/webhooks.ts`

**Invoice sent to Xero but appears empty?**
- Check that your Choice webhook returns the correct data format
- Verify the `xeroInvoice` field contains a JSON string with all required Xero fields
- Each LineItem must have: `Description`, `Quantity`, `UnitAmount`, `AccountCode`, `TaxType`
- Check Supabase Edge Function logs for parsing errors

**Xero integration issues?**
- Ensure Xero authentication is configured via the `xero-auth` edge function
- Verify Xero OAuth tokens are not expired in the `xero_tokens` table
- Check that `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` are set in environment variables
- Verify the Xero organization (tenant) is connected

**Can't see upload history?**
- Check browser console for database connection errors
- Ensure Supabase is properly configured
- Verify RLS policies allow anonymous access to the `reviews` table

**Error: "No Xero tokens found"**
- You need to authenticate with Xero first
- Run the Xero OAuth flow using the `xero-auth` edge function
- Tokens are stored in the `xero_tokens` database table

### Debug Checklist

When something isn't working, check these in order:

1. **Browser Console**: Look for JavaScript errors or failed network requests
2. **Network Tab**: Check if webhook requests are returning 200 status codes
3. **Database**: Verify the `reviews` table has your upload record with correct status
4. **n8n Logs**: Check n8n execution logs to see if webhooks are being triggered
5. **Edge Function Logs**: View Supabase edge function logs for server-side errors

## Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database + Storage + Edge Functions)
- **Icons**: Lucide React
- **Routing**: React Router

## Support

For issues or questions, check the browser console for detailed error messages.
