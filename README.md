# AI Invoice Processing App

An intelligent invoice processing application that extracts data from PDF invoices, validates and corrects information, and seamlessly sends it to Xero accounting software.

## Features

- **Drag & Drop Upload**: Easy PDF invoice upload with drag-and-drop interface
- **AI Processing**: Automated invoice data extraction and validation
- **Real-time Progress Tracking**: Live updates as your invoice is processed
- **Data Review**: Review extracted invoice data before sending to Xero
- **Upload History**: Track all your uploaded invoices and their status
- **Xero Integration**: Direct integration with Xero for seamless accounting

## How to Use

### 1. First Time Setup

Before using the app, ensure you have:
- A Xero account with API access
- Webhook endpoints configured in `src/config/webhooks.ts`
- Supabase project configured (connection details in `.env`)

### 2. Starting the Application

```bash
npm install
npm run dev
```

The app will open in your browser.

### 3. Uploading an Invoice

1. **Welcome Screen**: Click "Upload New Invoice" to begin
2. **Upload Page**:
   - Drag and drop your PDF invoice file onto the upload area, or click to browse
   - Only PDF files are accepted
   - The file will be uploaded to secure storage automatically

### 4. Processing

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

### 5. Reviewing Invoice Data

On the Review page, you'll see:
- **Contact Information**: Supplier/customer details
- **Invoice Details**: Invoice number, date, due date
- **Line Items**: Products/services with quantities and prices
- **Totals**: Subtotal, tax, and total amount

**Options:**
- **Send to Xero**: Confirms data is correct and sends to Xero
- **Go Back**: Return to make changes or upload a different invoice

### 6. Sending to Xero

When you click "Send to Xero":
1. You'll be asked to choose the download type:
   - **Draft**: Save as draft in Xero for later review
   - **Submit for Approval**: Send for approval workflow
   - **Authorize**: Post directly to Xero
2. The invoice is sent via the Xero API
3. You'll see a success confirmation

### 7. Upload History

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

### Webhooks

Edit `src/config/webhooks.ts` to configure your webhook endpoints:

```typescript
export const WEBHOOKS = {
  pdf: {
    dropbox: 'YOUR_PDF_PROCESSING_WEBHOOK',
  },
  review: {
    result: 'YOUR_REVIEW_RESULT_WEBHOOK',
  },
  choice: {
    receiveChoice: 'YOUR_CHOICE_WEBHOOK',
  },
}
```

### Environment Variables

The `.env` file contains Supabase connection details (automatically configured).

## Troubleshooting

**Upload not working?**
- Check that PDF is valid and not corrupted
- Ensure file size is reasonable (under 10MB recommended)

**Processing stuck?**
- Verify webhook endpoints are accessible
- Check browser console for errors

**Xero integration issues?**
- Ensure Xero authentication is configured
- Verify API credentials are valid

**Can't see upload history?**
- Check browser console for database connection errors
- Ensure Supabase is properly configured

## Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database + Storage + Edge Functions)
- **Icons**: Lucide React
- **Routing**: React Router

## Support

For issues or questions, check the browser console for detailed error messages.
