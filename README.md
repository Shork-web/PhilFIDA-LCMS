# PhilFIDA Regional Office VII — Leave Credit Management System (PLCMS)

Enterprise-Grade Civil Service Leave Credit Management, Automation & Administrative System built exclusively for the **Philippine Fiber Industry Development Authority (PhilFIDA) Regional Office VII (Central Visayas)**.

![PhilFIDA Region VII LCMS](https://img.shields.shields.io/badge/PhilFIDA-Region%20VII%20LCMS-0F2C59?style=for-the-badge)
![Next.js 16](https://img.shields.shields.io/badge/Next.js-16%20App%20Router-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?style=for-the-badge&logo=firebase)
![Production Ready](https://img.shields.shields.io/badge/Production-Stabilized-00C853?style=for-the-badge)

---

## 🏛️ System Overview & Regional Scope

This application is an **internal Leave Credit Management System engineered specifically for PhilFIDA Regional Office VII** (Cebu HQ, Bohol Satellite Station, Negros Oriental Station, Siquijor Field Office).

It automates Civil Service Commission (CSC Form 6 compliant) leave credit accruals, multi-level supervisor approvals, compensatory time off (CTO) conversion, employee batch migration, document repositories, agency data exports, and printable landscape leave card generation.

---

## 🚀 Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Database**: Firebase Firestore (with out-of-the-box local seed store dual-mode fallback)
- **Authentication**: Firebase Authentication & Next.js Proxy Middleware
- **Storage**: Firebase Storage & Base64 Data URL fallback
- **Styling**: Vanilla CSS & Tailwind CSS (PhilFIDA Navy `#0F2C59` & Forest Green `#1B4D3E`)
- **Validation**: Zod & React Hook Form
- **Notifications & UI**: Lucide Icons & Sonner Toast Notifications

---

## 📁 Repository Folder Structure

```
plcms/
├── app/                        # Next.js App Router Structure
│   ├── api/                    # Server-side API Route Handlers
│   │   ├── audit/              # Audit trail log endpoints
│   │   ├── auth/login/         # Auth API login endpoint
│   │   ├── calendar/           # Calendar events & holiday endpoints
│   │   ├── cto/                # CTO claim filing & approval handlers
│   │   ├── documents/          # Agency document management API
│   │   ├── employees/          # Employee directory CRUD
│   │   ├── export/             # Data export generator (CSV)
│   │   ├── holidays/           # Public holiday CRUD
│   │   ├── import/             # CSV batch employee import & beginning balances
│   │   ├── leave-adjustments/  # Manual credit/debit adjustments
│   │   ├── leave-applications/ # Leave application submission & approval
│   │   ├── leave-balances/     # Balance retrieval & updates
│   │   ├── leave-transactions/ # Immutable banking ledger transactions
│   │   ├── leave-types/        # CSC Leave categories
│   │   ├── monthly-accrual/    # Automatic monthly credit engine
│   │   ├── notifications/      # Real-time notification endpoints
│   │   ├── reports/            # CSC Form 6 leave card & low balance reports
│   │   ├── roles/              # Role permissions matrix
│   │   ├── search/             # Global debounced search API
│   │   ├── settings/           # System settings & policy configuration
│   │   └── users/              # User account management
│   ├── dashboard/              # Protected Dashboard Pages
│   │   ├── audit-logs/         # Security audit log browser
│   │   ├── calendar/           # Interactive leave & holiday calendar
│   │   ├── cto/                # CTO claim filing & approval
│   │   ├── documents/          # Agency document management repository
│   │   ├── employees/          # Region VII employee directory & 8-tab profile
│   │   ├── export/             # Consolidated agency data export center
│   │   ├── holidays/           # Public holidays manager
│   │   ├── import/             # Employee batch CSV import & beginning balance tool
│   │   ├── leave-adjustments/  # Manual credit/debit adjustments UI
│   │   ├── leave-applications/ # Leave filing & tracking
│   │   ├── leave-approvals/    # Multi-level approval queue (Supervisor → HR Admin)
│   │   ├── leave-ledger/       # Immutable banking transaction ledger
│   │   ├── leave-types/        # CSC Leave category management
│   │   ├── monthly-accrual/    # End-of-month automatic accrual engine
│   │   ├── notifications/      # System notification center
│   │   ├── profile/            # Employee profile & balances
│   │   ├── reports/            # Printable CSC Form 6 leave card viewer
│   │   ├── roles/              # Role permissions matrix UI
│   │   ├── settings/           # Consolidated 6-tab settings hub
│   │   └── users/              # User account management UI
│   ├── error.tsx               # Global Next.js error fallback boundary
│   ├── not-found.tsx           # Custom 404 page
│   └── login/                  # Secure authentication portal
├── components/                 # Reusable UI & Layout Components
│   ├── layout/                 # TopNav & Region VII Sidebar
│   └── ui/                     # Badges, Buttons, Cards, Dialogs, Tables
├── features/                   # Core Feature Hooks & Zustand State Stores
│   └── auth/                   # Authentication store & authorization hooks
├── lib/                        # Core Utilities & Services
│   ├── firebase/               # Firebase Client & Admin SDK initialization
│   ├── services/               # Store DB, Accrual, Import, Export, Documents
│   ├── validations/            # Zod validation schemas
│   ├── logger.ts               # Centralized server-side application logger
│   ├── constants.ts            # Region VII offices, permissions, & defaults
│   └── utils.ts                # Formatting & helper utilities
├── types/                      # TypeScript Interface Definitions
├── firestore.rules             # Production Firebase Security Rules
├── storage.rules               # Production Firebase Storage Security Rules
├── proxy.ts                    # Next.js Authentication Proxy
└── .env.local                  # Environment Variable Configuration
```

---

## 🔐 Authentication & Role Permissions Matrix

| System Role | Scope & Permissions Description |
| :--- | :--- |
| **Super Admin** | Complete access to system settings, user creation, security audit logs, role management, and database configuration. |
| **HR Administrator** | Manage Region VII employees, credit adjustments, monthly accrual execution, CSC leave card generation, imports, exports, and final leave approvals. |
| **Supervisor** | Review and endorse leave applications and CTO claims for assigned unit/section staff. |
| **Employee** | File leave applications, submit CTO overtime hours, inspect accumulated credits, and print personal leave cards. |

---

## 📜 Civil Service Business Rules & Workflow

1. **Leave Credit Accrual**: Permanent employees earn **1.25 Vacation Leave** and **1.25 Sick Leave** credits per month.
2. **Approval Workflow**:
   - `Step 1`: Employee submits leave request (`Status: Pending`).
   - `Step 2`: Unit Supervisor reviews and endorses (`Status: Supervisor Approved`).
   - `Step 3`: HR Administrator performs final review (`Status: Approved`), executing an automated `LeaveTransaction` deduction from `LeaveBalance`.
3. **Banking Ledger Invariant**: `LeaveBalance.balance === Sum of all LeaveTransactions`.

---

## 🗄️ Firestore Database Collections

1. `employees` — PhilFIDA Region VII employee profiles.
2. `users` — System user accounts linked to employees.
3. `roles` — System role definitions and permission arrays.
4. `leaveTypes` — CSC leave categories (VL, SL, SPL, Maternity, Paternity, CTO).
5. `leaveBalances` — Employee leave credit balances (updated via transactions).
6. `leaveTransactions` — Permanent, immutable transaction history ledger (`Credit`, `Debit`, `Adjustment`, `Reversal`).
7. `leaveApplications` — Submitted leave requests with inclusive dates and attachments.
8. `ctoRequests` — Overtime hours claims and equivalent day credit conversions.
9. `leaveAdjustments` — Manual credit/debit adjustments.
10. `systemSettings` — Configurable policy rates, attachment rules, and switches.
11. `holidays` — Region VII public holidays.
12. `monthlyAccrualLogs` — Duplicate-safe monthly accrual run logs.
13. `documents` — Agency uploaded attachments, CTO files, and reports.
14. `notifications` — Automated user alerts.
15. `auditLogs` — Immutable security audit trail logs.

---

## 🌐 API Routes Reference

- `POST /api/import` — Employee CSV validation preview & batch import execution.
- `GET /api/export?target=...` — Consolidated CSV dataset exports.
- `GET /api/documents` / `POST /api/documents` / `DELETE /api/documents` — File repository management.
- `GET /api/search?q=...` — Debounced global search across employees and requests.
- `GET /api/settings` / `PUT /api/settings` — System settings configuration & update.
- `GET /api/monthly-accrual` / `POST /api/monthly-accrual` — Preview & execute monthly accrual.
- `GET /api/reports?type=leaveCard&employeeId=...` — Generate CSC Form 6 printable leave card.

---

## ⚙️ Environment Variables Setup

Create a `.env.local` file in the root directory:

```env
# Firebase Client SDK Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="philfida-lcms.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="philfida-lcms"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="philfida-lcms.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="268137887244"
NEXT_PUBLIC_FIREBASE_APP_ID="1:268137887244:web:b190176341493b0312a029"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-KJW505C1ED"

# Firebase Admin SDK Configuration (Private Server-Side)
FIREBASE_PROJECT_ID="philfida-lcms"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@philfida-lcms.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Application Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚢 Production Deployment Steps (Vercel)

1. Push repository to GitHub / GitLab.
2. Import project in Vercel Dashboard.
3. Configure environment variables in **Vercel → Project Settings → Environment Variables** using `.env.local`.
4. Build Command: `npm run build`.
5. Deploy! Next.js App Router will compile all 49 static & dynamic routes cleanly.

---

## 💾 Backup & Maintenance Recommendations

- **Daily Data Backup**: Use the **Export Center (`/dashboard/export`)** to download CSV extracts of the Employee Roster, Leave Ledger, Applications, and Audit Logs at the end of each payroll cycle.
- **Ledger Reconciliation**: Use `reconcileLeaveBalances()` in `lib/services/store-db.ts` to audit and reconcile balances against historical transaction logs.

---

## 📄 License & Attribution

Copyright © 2026 **Philippine Fiber Industry Development Authority (PhilFIDA) Regional Office VII**. All Rights Reserved.
