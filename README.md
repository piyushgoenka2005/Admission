# NRSC Internship Portal

## Overview

The **NRSC Internship Portal** is a web application built to manage the internship application and screening workflow for students and administrators.

It provides:

- a student-facing portal for registration, sign-in, password reset, and application submission
- an admin dashboard for application review, guide allocation, intake control, and document review
- a structured screening workflow with status tracking
- persistent guide management with optional Excel synchronization

The application is designed to be simple to operate, easy to maintain, and clear enough for future technical handover.

## Technology Stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Frontend:** React 19
- **Styling:** Tailwind CSS 4
-- **Backend/Data:** MongoDB (local)
- **Icons:** Lucide React
- **Charts:** Custom React component for student marks visualization
- **Excel Sync:** Python + `openpyxl` for guide library updates

## Core Functional Areas

### Student Portal

- student registration using Aadhaar, email, and password
- sign-in with stored account credentials
- forgot-password flow using Aadhaar and registered email
- application form submission
- student ID generation in `YYMMSSS` format
- application intake control based on admin enable/disable status
- closed-intake message display when applications are disabled

### Admin Portal

- secure admin login
- application list view with filtering and sorting
- status handling:
  - `UNDER CONSIDERATION`
  - `ASSIGNED`
  - `ON HOLD`
- guide assignment workflow
- student record view with:
  - profile details
  - academic details
  - document viewer
  - marks visualization
  - notification history
- application intake control for opening or closing submissions

### Guide Management

- normal guide assignment through a dropdown list
- automatic population of:
  - guide area
  - reporting officer
  - guide email
- manual `+ Add Guide` option for new guide creation
- persistent guide storage in Supabase
- local Excel update to `guideDetails.xlsx` through Python

## Student ID Format

Student IDs follow this format:

`YYMMSSS`

Where:

- `YY` = last two digits of year
- `MM` = month
- `SSS` = serial number for that month

Example:

- `2603001` = first student record created in March 2026

The admin dashboard list is ordered by this student ID by default.

## Screening Workflow

The current application includes the **screening phase** only.

Typical flow:

1. Student registers and signs in
2. Student submits application
3. Admin reviews the application
4. Admin marks the student as:
   - `UNDER CONSIDERATION`
   - `ASSIGNED`
   - `ON HOLD`
5. If assigned, the admin selects or adds a guide and sets a reporting date

## Project Structure

```text
internship-portal/
├── app/
│   ├── application/
│   ├── forgot-password/
│   ├── signin/
│   ├── signup/
│   ├── api/
│   │   ├── guides/
│   │   └── notifications/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AdminDashboard.tsx
│   ├── PersonalDetails.tsx
│   ├── EducationTable.tsx
│   ├── Achievements.tsx
│   ├── Referral.tsx
│   └── StudentMarksChart.tsx
├── lib/
│   ├── portal.ts
│   ├── education.ts
│   ├── guides.ts
│   └── guideDetails.ts
├── public/
├── scripts/
│   └── append_guide_to_excel.py
├── types/
│   └── index.ts
├── database_setup.sql
├── database_updates.sql
└── README.md
```

## Key Files

### Frontend

- [app/page.tsx](/Users/aditi./internship-portal/app/page.tsx)  
  Landing page and homepage entry points

- [app/signin/page.tsx](/Users/aditi./internship-portal/app/signin/page.tsx)  
  Student sign-in

- [app/signup/page.tsx](/Users/aditi./internship-portal/app/signup/page.tsx)  
  Student registration

- [app/forgot-password/page.tsx](/Users/aditi./internship-portal/app/forgot-password/page.tsx)  
  Password reset flow

- [app/application/page.tsx](/Users/aditi./internship-portal/app/application/page.tsx)  
  Student application form and submission flow

- [components/AdminDashboard.tsx](/Users/aditi./internship-portal/components/AdminDashboard.tsx)  
  Main admin review and guide-allocation interface

### Shared Logic

- [lib/portal.ts](/Users/aditi./internship-portal/lib/portal.ts)  
  Utility helpers such as student ID generation, guide-name normalization, and date formatting

- [lib/guideDetails.ts](/Users/aditi./internship-portal/lib/guideDetails.ts)  
  Curated guide metadata used as the base guide library

- [lib/guides.ts](/Users/aditi./internship-portal/lib/guides.ts)  
  Guide list derivation

- [types/index.ts](/Users/aditi./internship-portal/types/index.ts)  
  Shared data types for students, academics, and notifications

### APIs

- [app/api/notifications/route.ts](/Users/aditi./internship-portal/app/api/notifications/route.ts)  
  Notification and email API

- [app/api/guides/route.ts](/Users/aditi./internship-portal/app/api/guides/route.ts)  
  Guide library read/create API

### Database

- [database_setup.sql](/Users/aditi./internship-portal/database_setup.sql)  
  Base schema setup

- [database_updates.sql](/Users/aditi./internship-portal/database_updates.sql)  
  Incremental updates required for the current version

### Excel Sync

- [guideDetails.xlsx](/Users/aditi./internship-portal/guideDetails.xlsx)  
  Local Excel file containing guide data

- [scripts/append_guide_to_excel.py](/Users/aditi./internship-portal/scripts/append_guide_to_excel.py)  
  Updates the Excel guide file when a new guide is added through the admin panel

## Database

The project uses a local MongoDB database. Collections include:

- `students`: student personal details, application metadata, guide assignment fields, notification history, reporting date, generated student ID
- `student_accounts`: Aadhaar number, email, password hash

### `academic_details`

Stores:

- academic entries linked to a student
- board/institution
- education type
- specialization
- percentage
- marksheet document links

### `portal_settings`

Stores:

- application intake state
- student-facing notice when intake is disabled

### `guides`

Stores:

- guide name
- normalized unique name
- guide area/division
- reporting officer
- email

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create or update `.env.local` with the required Supabase and email configuration.

Typical variables used in this project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_key
EMAIL_FROM=your_sender_email
GUIDE_PYTHON_EXECUTABLE=/absolute/path/to/.guides-venv/bin/python
```

Note:

- `GUIDE_PYTHON_EXECUTABLE` is used only for Excel synchronization when adding guides
- email sending may require a verified provider/domain depending on deployment setup

### 3. Prepare the database

Run:

- [database_setup.sql](/Users/aditi./internship-portal/database_setup.sql) for fresh setup
- [database_updates.sql](/Users/aditi./internship-portal/database_updates.sql) for existing databases

Recommended place to run this:

- Supabase SQL Editor

### 4. Create the local Python environment for guide Excel updates

```bash
cd /Users/aditi./internship-portal
python3 -m venv .guides-venv
./.guides-venv/bin/python -m pip install openpyxl
```

### 5. Start the application

```bash
npm run dev
```

Open:

[http://localhost:3000](http://localhost:3000)

## Guide Management Behavior

### Standard Flow

In the admin record view:

- choose a guide from the dropdown
- guide details fill automatically
- set reporting date
- assign the guide

### Manual Add Guide Flow

If the guide does not exist:

- click `+ Add Guide`
- enter:
  - guide name
  - guide area
  - reporting officer
  - guide email
- save the guide

This guide is then:

- stored in the `guides` table
- available for future dropdown use
- written into `guideDetails.xlsx`

## Intake Control

The admin can:

- enable applications
- disable applications
- set the student-facing notice shown when intake is closed

When intake is disabled:

- students can still sign in
- the application form is not available
- only the notice message is shown

## Password Reset

The forgot-password flow is available from:

- sign-in page
- sign-up page

Reset requires:

- Aadhaar number
- registered email
- new password

The password is updated in the `student_accounts` table.

## Sorting and Filtering in Admin Dashboard

The admin list supports:

- search by student name, email, or student ID
- filter by status
- filter by degree
- filter by specialization
- sort by average marks:
  - ascending
  - descending
- default ordering by student ID

## Notes for Future Maintainers

### Authentication

Current student authentication uses a custom `student_accounts` table.

Password handling is intentionally simple in the present version and uses a basic encoded value on the client side. For production-grade hardening, this should be migrated to a secure server-side hashing flow.

### Emails

Notification support exists, but live sending depends on valid provider configuration.

If email delivery is restricted:

- the UI can still log notification history
- administrative flow remains usable

### Guide Data Source

Guide data currently comes from:

1. curated base records in [lib/guideDetails.ts](/Users/aditi./internship-portal/lib/guideDetails.ts)
2. saved records in the Supabase `guides` table
3. local Excel synchronization to [guideDetails.xlsx](/Users/aditi./internship-portal/guideDetails.xlsx)

### Recommended Future Improvements

- move password hashing to a secure backend or Supabase Auth
- replace `<img>` tags with `next/image`
- reduce hook dependency warnings flagged by ESLint
- add audit logging for guide changes and status changes
- add role-based admin authentication
- add automated tests for application submission and guide assignment

## Validation and Verification

At the current stage, the project has been verified with:

```bash
npm run lint
npm run build
```

Build is passing. Lint currently reports warnings only.

## Contact and Handover Note

This repository is intended to be maintainable by future developers, administrators, or institutional technical teams. All changes should be made with care to preserve:

- student data integrity
- admin workflow clarity
- database compatibility
- consistency between guide records, UI, and Excel exports

For structural changes, it is recommended to update:

- database SQL files
- shared types
- admin dashboard behavior
- this README

