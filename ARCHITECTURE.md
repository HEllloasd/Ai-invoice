# SmartInvoice System Architecture

## Overview

SmartInvoice is an AI-powered invoice processing application that extracts data from PDF invoices and sends them to Xero accounting software. The system uses a combination of frontend (React), backend (Supabase), external AI processing (n8n), and third-party integration (Xero API).

---

## High-Level Flow

```
User Upload → Supabase Storage → n8n AI Processing → Review Page → Xero Integration
```

---

## System Components

### 1. Frontend (React + TypeScript + Vite)

**Technology Stack:**
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons

**Key Pages:**
- **Welcome** (`/`) - Landing page
- **Upload** (`/upload`) - File upload and history
- **Progress** (`/progress`) - Real-time processing status
- **Review** (`/review`) - Invoice data validation
- **Success** (`/success`) - Confirmation after sending to Xero

**State Management:**
- AppContext provides global state for:
  - Uploaded file
  - Authentication status
  - Xero connection status
  - Webhook responses

---

### 2. Backend (Supabase)

**Database Tables:**

**`reviews` table:**
- Stores invoice processing records
- Fields:
  - `id` (primary key)
  - `review_id` (unique identifier like REV-XXXXX-XXXXX)
  - `file_name` (original PDF filename)
  - `file_url` (URL to PDF in storage)
  - `status` (uploaded, processing, reviewed, final)
  - `invoice_data` (extracted JSON data)
  - `download_type` (draft, submit, authorize)
  - `created_at`

**`xero_tokens` table:**
- Stores Xero OAuth tokens
- Fields:
  - `id` (primary key)
  - `access_token`
  - `refresh_token`
  - `expires_at`
  - `tenant_id` (Xero organization ID)

**Storage Buckets:**
- **`invoices`** - Stores uploaded PDF files with public access

**Edge Functions:**
- **`send-to-xero`** - Sends invoice data to Xero API
- **`xero-auth`** - Handles Xero OAuth authentication

---

### 3. External AI Processing (n8n Workflows)

Three webhook endpoints handle AI processing:

**1. PDF Processing Webhook**
- Receives: `review_id` and `pdf_url`
- Extracts text from PDF
- Uses AI to identify invoice fields
- Returns structured invoice data

**2. Review Result Webhook**
- Receives extracted invoice data
- Stores results in database
- Updates review status

**3. Choice Webhook**
- Receives: User's choice (draft/submit/authorize) and `review_id`
- Applies final corrections
- Returns Xero-formatted invoice JSON

---

### 4. Third-Party Integration (Xero API)

**Authentication:**
- OAuth 2.0 flow via `xero-auth` edge function
- Tokens stored in `xero_tokens` table
- Automatic token refresh

**Invoice Submission:**
- Edge function `send-to-xero` handles API calls
- Supports three modes:
  - **DRAFT** - Save as draft
  - **SUBMITFORAPPROVAL** - Submit for approval
  - **AUTHORISED** - Post directly

---

## Data Flow

### Invoice Upload Process

```
1. User uploads PDF file
   ↓
2. Frontend validates file (PDF only)
   ↓
3. Upload to Supabase Storage (invoices bucket)
   ↓
4. Create record in reviews table
   ↓
5. Send webhook to n8n (PDF Processing)
   {
     review_id: "REV-XXXXX-XXXXX",
     pdf_url: "https://storage.supabase.co/..."
   }
   ↓
6. Navigate to Progress page
```

### AI Processing Flow

```
1. n8n receives PDF webhook
   ↓
2. Extract text from PDF
   ↓
3. AI identifies invoice fields:
   - Contact (name, email, phone, address)
   - Invoice number, date, due date
   - Line items (description, quantity, price, tax)
   - Totals (subtotal, tax, total)
   ↓
4. Send results to Review Result webhook
   ↓
5. Update reviews table with invoice_data
   ↓
6. Frontend polls database, detects status change
   ↓
7. Navigate to Review page
```

### Review and Send to Xero Flow

```
1. User reviews extracted data
   ↓
2. User clicks "Send to Xero"
   ↓
3. User selects download type (Draft/Submit/Authorize)
   ↓
4. Frontend sends webhook to n8n (Choice webhook)
   {
     route: "xero",
     review_id: "REV-XXXXX-XXXXX"
   }
   ↓
5. n8n returns Xero-formatted invoice JSON
   ↓
6. Frontend calls send-to-xero edge function
   {
     invoiceJson: {...},
     downloadType: "DRAFT"
   }
   ↓
7. Edge function authenticates with Xero
   ↓
8. POST invoice to Xero API
   ↓
9. Navigate to Success page
```

---

## Security

### Row Level Security (RLS)
- Anonymous users can read/write reviews table
- Public access to invoices storage bucket
- No authentication required (simplified for team use)

### API Keys
- Supabase credentials in `.env` file
- Xero client ID/secret in edge function environment
- n8n webhooks are publicly accessible URLs

---

## Configuration Files

**Frontend Config:**
- `src/config/webhooks.ts` - n8n webhook URLs

**Environment Variables:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase public key

**Edge Function Secrets:**
- `XERO_CLIENT_ID` - Xero OAuth client ID
- `XERO_CLIENT_SECRET` - Xero OAuth secret

---

## Technology Decisions

### Why Supabase?
- Instant backend (database, storage, edge functions)
- PostgreSQL database with real-time capabilities
- Built-in file storage
- Serverless edge functions for API integrations

### Why n8n for AI Processing?
- Visual workflow builder for complex logic
- Easy AI model integration
- Webhook-based architecture
- Separate from main application (microservices)

### Why React Router?
- Simple page navigation
- Client-side routing for smooth UX
- Query parameter support for OAuth callbacks

### Why Edge Functions for Xero?
- Secure API key management (not exposed to frontend)
- OAuth token refresh logic
- CORS handling
- Error handling and logging

---

## Database Schema

```sql
-- reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id text UNIQUE NOT NULL,
  file_name text,
  file_url text NOT NULL,
  status text NOT NULL,
  invoice_data jsonb,
  download_type text,
  created_at timestamptz DEFAULT now()
);

-- xero_tokens table
CREATE TABLE xero_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  tenant_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## API Endpoints

### Supabase Storage
- `POST /storage/v1/object/invoices` - Upload PDF
- `GET /storage/v1/object/public/invoices/{filename}` - Download PDF

### Supabase Database (via client)
- `supabase.from('reviews').insert()` - Create review
- `supabase.from('reviews').select()` - Fetch reviews
- `supabase.from('reviews').update()` - Update review

### Edge Functions
- `POST /functions/v1/send-to-xero` - Send invoice to Xero
- `GET /functions/v1/xero-auth` - Xero OAuth callback

### n8n Webhooks (External)
- `POST {WEBHOOK_URL}/pdf/dropbox` - PDF processing
- `POST {WEBHOOK_URL}/review/result` - Review result
- `POST {WEBHOOK_URL}/choice/receiveChoice` - User choice

### Xero API (via edge function)
- `POST https://api.xero.com/api.xro/2.0/Invoices` - Create invoice

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (Vite Dev Server)                         │
│                   http://localhost:5173                      │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Supabase Client
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                       Supabase Cloud                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL │  │   Storage    │  │  Edge Functions  │  │
│  │   Database  │  │   (invoices) │  │  - send-to-xero  │  │
│  │  - reviews  │  │              │  │  - xero-auth     │  │
│  │  - tokens   │  │              │  │                  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Webhooks
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                      n8n Instance                            │
│                   (AI Processing)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Workflows:                                            │ │
│  │  - PDF extraction + AI analysis                       │ │
│  │  - Review result processing                           │ │
│  │  - Choice handling + Xero formatting                  │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Xero API calls (via edge function)
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                        Xero API                              │
│                  (Accounting System)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Frontend
- File validation (PDF only)
- Network error handling
- Webhook connection errors
- User-friendly error messages

### Backend
- Database constraints (unique review_id)
- Storage upload failures
- RLS policy checks

### Edge Functions
- OAuth token expiration and refresh
- Xero API error responses
- JSON parsing errors
- CORS headers for frontend requests

### n8n Workflows
- PDF parsing failures
- AI model errors
- Invalid data format
- Webhook timeout handling

---

## Future Improvements

1. **Authentication** - Add proper user accounts
2. **Multi-tenant** - Separate data per organization
3. **Batch Processing** - Upload multiple invoices
4. **Data Validation** - Frontend validation before sending to Xero
5. **Audit Trail** - Track all changes to invoice data
6. **Retry Logic** - Auto-retry failed webhook calls
7. **Real-time Updates** - WebSocket for live status updates
8. **Export Options** - CSV, Excel exports of invoice history
9. **Search & Filter** - Advanced filtering in upload history
10. **Mobile App** - Native mobile application

---

## Monitoring & Debugging

**Frontend Debugging:**
- Browser console logs
- Network tab for API calls
- React DevTools for state inspection

**Backend Debugging:**
- Supabase Dashboard logs
- Edge Function logs in Supabase
- Database query performance

**External Service Debugging:**
- n8n execution logs
- Webhook request/response logs
- Xero API error messages

**Key Metrics to Monitor:**
- Upload success rate
- AI processing time
- Webhook response times
- Xero API success rate
- Database query performance
