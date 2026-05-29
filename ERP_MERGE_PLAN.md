# ERP Merge Plan: CPR Physio Sales Agent + PhysioTrack CRM

## Current State

Downloaded CRM source:

- `external-crm/PhysioTrackCRM-full1.0`
- Source repo: `billy550/PhysioTrackCRM-full1.0`, branch `main`

Existing Sales Agent app:

- Stack: React + TypeScript + Vite, Bun server, Hono API.
- Main UI entry: `src/App.tsx`
- Backend/API entry: `server.ts`
- Current Admin modules:
  - Admin dashboard
  - Channel Partners
  - Transactions
  - Partner Earnings
  - Excel import
  - Appointments
  - Google Calendar API placeholders

Downloaded CRM app:

- Stack: React + TypeScript + Vite.
- Main UI entry: `App.tsx`
- CRM modules:
  - Client/lead dashboard
  - Client profile and treatment details
  - Lead Engine
  - Booking
  - Pain map
  - Scan viewer and posture reports
  - Questionnaire
  - Admin dashboard with CRM imports, CSV/XLSX, OCR, exports
- Data layer:
  - `services/mockSupabase.ts` contains mock data and a Supabase-backed service.
  - `services/supabaseClient.ts` currently uses `process.env.NEXT_PUBLIC_*`, which is not the right pattern for this Vite/Bun app without changes.
  - Gemini OCR/report parsing is currently called from the browser, which should be moved behind the backend before production.

## Recommended Merge Direction

Use the Sales Agent as the host ERP application.

Do not run the CRM as a second standalone frontend inside the ERP. Instead, migrate CRM screens, types, and services into the Sales Agent app as Admin-only modules. This keeps one login, one Admin navigation, one API surface, and one future database model.

## Target ERP Admin Modules

1. Sales Dashboard
   - Keep current Sales Agent dashboard.
   - Add CRM totals later: total clients, active cases, follow-up count, posture scan count.

2. Channel Partners
   - Keep existing distributor/channel partner management.
   - Add links from channel partners to referred clients/leads and generated transactions.

3. Transactions and Partner Earnings
   - Keep existing transactions and commission calculations.
   - Add optional `client_id`, `lead_id`, `appointment_id`, and `referred_by_partner_id` links.

4. Appointments
   - Merge current Sales Agent appointment system with CRM booking data.
   - Use one appointment model and one `/api/appointments` endpoint.
   - Keep Google Calendar sync behind backend API.

5. CRM Clients
   - New Admin route: `/crm/clients`
   - Source components to adapt:
     - `components/AdminDashboard.tsx`
     - `components/ClientProfilePage.tsx`
   - Features:
     - master client list
     - client profile
     - medical/clinical fields
     - contact actions
     - file attachments
     - CSV/XLSX import

6. Lead Engine
   - New Admin route: `/crm/lead-engine`
   - Source component:
     - `components/LeadEngine.tsx`
   - Link Lead Engine cards to client profile and partner/referral records.

7. Posture Reports
   - New Admin route: `/crm/posture`
   - Source components:
     - `components/PostureDashboard.tsx`
     - `components/ScanViewer.tsx`
     - `components/PainMap.tsx`
   - Store scan metrics against client records.

8. Patient/Client Intake
   - New Admin route: `/crm/intake`
   - Source components:
     - `components/Questionnaire.tsx`
     - `components/Booking.tsx`
   - Later expose selected intake flow to clients if needed.

## Unified Data Model

Minimum shared ERP entities:

- `users`
  - admin, channel_partner, sub_agent, therapist/staff later

- `channel_partners`
  - based on current `Distributor`
  - parent partner support
  - commission rate

- `corporate_clients`
  - existing Sales Agent corporate companies

- `clients`
  - migrated from CRM `Lead`
  - fields: name, phone, email, age, gender, occupation, address, status, tags, remarks
  - CRM clinical fields: diagnosis, complaint, symptoms, medical history, contraindications, treatment details, posture score
  - business fields: source, referred_by, referred_by_partner_id, referral_revenue

- `appointments`
  - unify Sales Agent appointment and CRM appointment shapes
  - fields: client_id, corporate_client_id, branch_id, service_item/type, date, time, status, notes, google_calendar_event_id

- `transactions`
  - existing Sales Agent transaction model
  - add links: client_id, appointment_id, partner_id

- `posture_scans`
  - migrated from CRM `Scan`
  - fields: client_id/profile_id, image URLs, angles, risk score, AI interpretation, scanned_at

- `attachments`
  - client files, scans, PDFs, documents
  - fields: client_id, name, url/path, type, size, uploaded_at

## API Merge Plan

Keep all application data access through `server.ts` / Hono APIs.

Add these API groups:

- `GET /api/admin/crm/clients`
- `POST /api/admin/crm/clients`
- `GET /api/admin/crm/clients/:id`
- `PUT /api/admin/crm/clients/:id`
- `POST /api/admin/crm/clients/import`
- `POST /api/admin/crm/clients/:id/attachments`
- `GET /api/admin/crm/lead-engine`
- `GET /api/admin/crm/posture-scans`
- `POST /api/admin/crm/posture-scans`
- `POST /api/admin/crm/ocr-import`

Also extend existing endpoints:

- `GET /api/admin/stats`
  - include CRM metrics.

- `GET /api/appointments`
  - include linked client and partner data.

- `POST /api/appointments`
  - optionally creates or links a CRM client.

- `POST /api/admin/transactions`
  - optionally links to client, appointment, and channel partner referral.

## Frontend Merge Plan

1. Create a CRM feature folder:
   - `src/features/crm`
   - `src/features/crm/components`
   - `src/features/crm/pages`
   - `src/features/crm/types.ts`
   - `src/features/crm/api.ts`

2. Move/adapt CRM types:
   - Start from CRM `types.ts`.
   - Rename `Lead` to `Client` or `CrmClient`.
   - Keep a compatibility alias temporarily if needed.

3. Replace CRM service calls:
   - Replace `mockSupabase.*` calls with fetch wrappers in `src/features/crm/api.ts`.
   - Reuse existing `cpr_token` auth header pattern.

4. Add Admin navigation:
   - Add CRM links to `AdminRoutes` in `src/App.tsx`.
   - Suggested Admin nav:
     - Sales Overview
     - CRM Clients
     - Lead Engine
     - Appointments
     - Transactions
     - Partner Earnings
     - Channel Partners
     - Imports
     - Posture Reports

5. Harmonize UI:
   - Keep Sales Agent layout/sidebar/topbar as the ERP frame.
   - Adapt CRM screens to fill the existing desktop admin layout.
   - Avoid importing the CRM mobile-shell layout directly for Admin pages unless used for a specific client-facing preview.

## Backend and Security Plan

1. Short-term demo phase:
   - Keep in-memory arrays in `server.ts`.
   - Add CRM mock arrays and APIs there.
   - Prove Admin flows work end to end.

2. Production data phase:
   - Move from in-memory arrays to a database.
   - Supabase is a reasonable fit because the CRM already has partial Supabase service logic.
   - Create migrations/schema for the unified entities above.

3. Secrets:
   - Do not call Gemini or privileged Supabase operations directly from the browser.
   - Move OCR/report parsing to backend endpoints.
   - Use server env vars for Gemini API key and Supabase service key.

4. Auth:
   - Keep the current Admin login for initial merge.
   - Later replace mock token auth with real JWT/session validation.
   - Enforce Admin-only access on all `/api/admin/crm/*` routes.

## Implementation Phases

### Phase 1: Local Integration Skeleton

- Keep CRM checkout in `external-crm/PhysioTrackCRM-full1.0` as source reference.
- Add `src/features/crm/types.ts`.
- Add `src/features/crm/api.ts`.
- Add placeholder CRM Admin routes/pages in Sales Agent.
- Add Admin sidebar links.

### Phase 2: Client CRM

- Port Client list and Client profile from CRM.
- Add backend in-memory `clients` and `attachments`.
- Implement list, create, update, profile view, and file metadata flow.
- Link clients to appointments.

### Phase 3: Lead Engine

- Port Lead Engine UI.
- Rebuild its filters against unified `clients`.
- Add partner/referral visibility:
  - top referred clients
  - high value clients
  - clients needing follow-up
  - churned/win-back list

### Phase 4: Appointments Linkup

- Merge appointment models.
- Add client selector/create-client flow in appointment modal.
- Add appointment history on client profile.
- Keep Google Calendar sync behind existing `/api/google-calendar/events` flow.

### Phase 5: Transaction and Commission Linkup

- Add `client_id` and `appointment_id` to transactions.
- Add `referred_by_partner_id` when a client came from a channel partner.
- Show partner-generated revenue inside CRM client profile.
- Show referred client count and revenue inside Channel Partner detail.

### Phase 6: Imports, OCR, and Reports

- Move CRM CSV/XLSX import into backend endpoint.
- Move Gemini OCR/document extraction into backend endpoint.
- Add posture scan report APIs.
- Add report export for clients, appointments, and commissions.

### Phase 7: Database Migration

- Create real tables.
- Seed from current mock Sales Agent data and CRM mock leads.
- Replace in-memory server arrays with database calls.
- Add backup/export strategy.

## Main Risks

- The Sales Agent currently uses in-memory data, so merged data will reset on server restart until database migration is done.
- CRM currently mixes mock Supabase and real Supabase logic with browser env access. This needs refactoring before production.
- CRM AdminDashboard is a large single component, so it should be split during porting instead of copied wholesale.
- The two apps use different appointment shapes and status names. Normalize this early to avoid confusing Admin workflows.
- Gemini OCR/report parsing from browser should be moved server-side before using real clinic data.

## Suggested First Build Task

Start with Phase 1 and Phase 2:

1. Add CRM feature folder.
2. Add unified `CrmClient` type.
3. Add `/crm/clients` Admin route.
4. Add server-side mock client APIs.
5. Port the CRM client list and profile into the Sales Agent Admin layout.

This creates the first visible ERP merge without disturbing the existing Sales Agent commission and transaction workflows.
