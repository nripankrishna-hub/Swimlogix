# SwimLogix

Cross-platform swim-school platform: **Expo React Native** app + **Node.js/Express + MongoDB** API for SuperAdmin → Admin → Moderator → Student/Parent flows.

## Repo layout

```
SwimLogix/
├── backend/            # Express API (see backend/package.json scripts)
│   ├── src/
│   │   ├── config/     # env.js, db.js
│   │   ├── models/     # Institution, User, StudentProfile, Batch, Attendance, SwimTest, Notification, Otp
│   │   ├── middleware/ # auth (JWT/RBAC/temp-password), tenant, validate, error, rateLimit, upload
│   │   ├── services/   # auth, otp, pin, institution, notification, push (FCM), storage, progress
│   │   ├── controllers/# auth, superadmin, admin{Profile,Batch,Student,Moderator,Notification,Monitoring}, moderator, student
│   │   ├── validators/ # express-validator rule sets per portal
│   │   ├── routes/     # auth, superadmin, admin, moderator, student (+ index.js)
│   │   ├── utils/      # ApiError, asyncHandler, generators, logger, pagination, phone, token
│   │   ├── app.js      # Express app factory
│   │   └── server.js   # boot + FCM init
│   ├── scripts/seedSuperAdmin.js
│   └── tests/          # unit + integration (31 passing)
└── frontend/           # Expo app (App.js entry)
    └── src/
        ├── api/        # client.js (JWT, refresh) + endpoints.js (per-role APIs)
        ├── theme/      # aquatic palette (#004E64/#2563EB), gold accents, spacing/typography
        ├── components/ # Screen, AppButton, AppTextInput, OtpInput, PinCard, ConfirmModal, states, primitives
        ├── contexts/   # AuthContext (role routing, OTP/temp-password/institution state)
        ├── hooks/      # useAsync (+ useReloadOnFocus)
        ├── navigation/ # Root, Auth, SuperAdmin, Admin, Moderator, Student
        ├── screens/auth/      # Welcome, PasswordLogin, OtpLogin, InstitutionLink, RegistrationForm, PendingApproval, ChangePassword
        ├── screens/superadmin/# Dashboard, Institutions, CreateInstitution, InstitutionDetail, Profile
        ├── screens/admin/     # Dashboard, InstitutionProfile, RegistrationFields, Batches(+Form/Detail), StudentsApproval(+Detail), Moderators, Communication, Monitoring, MoreMenu
        ├── screens/moderator/ # Dashboard, Attendance (PIN+roster), SwimTest, Students, Progress, Announcements
        ├── screens/student/   # Dashboard (PIN card), Progress, Fees, Schedule, Notifications, Profile
        └── utils/      # validation (Formik/Yup), format, errors
```

## Quick start

### Backend
```bash
cd backend
cp .env.example .env   # set MONGO_URI + JWT secrets (+ Firebase vars for FCM)
npm install
npm run seed:superadmin # prints master credentials
npm run dev             # http://localhost:5000 (health: /health, API: /api/v1)
npm test                # 31 tests
```

### Frontend (Expo)
```bash
cd frontend
npm install
npx expo start          # set EXPO_PUBLIC_API_URL to the backend (default http://localhost:5000/api/v1)
```

## Core flows

| Flow | Path |
|---|---|
| SuperAdmin registers Institution + first Admin (one-time temp password) | `POST /api/v1/superadmin/institutions` → `frontend/src/screens/superadmin/CreateInstitutionScreen.js` |
| Admin forced password change on first login | `POST /api/v1/auth/change-password` → `ChangePasswordScreen` |
| Institution profile setup mints **Unique Institution Code** | `PUT /api/v1/admin/profile` → `InstitutionProfileScreen` |
| Student OTP login → enter code → **confirm Name/Tutor/Location modal** → dynamic form → Pending Approval | `OtpLoginScreen` → `InstitutionLinkScreen` → `RegistrationFormScreen` → `PendingApprovalScreen` |
| Admin approves + **auto/sequential 4-digit PIN** (+ batch) | `PATCH /api/v1/admin/students/:id/approve` → `StudentsApprovalScreen` |
| Moderator marks attendance by **PIN or roster**, grades swim tests, adds milestones | `AttendanceScreen`, `SwimTestScreen` |
| Member unlocks **PIN card dashboard**, progress %, fees, inbox, schedule | `StudentDashboardScreen` |

## Auth & RBAC

- JWT access + refresh (`Authorization: Bearer`), OTP mock in non-production logs a test code.
- Middleware chain per portal: `authenticate → authorize(role) → resolveTenant/requireInstitution → enforceTemporaryPassword`.
- Multi-tenant isolation: every query scoped by `institutionId` + Mongo indexes (`code` unique, `assignedPin` unique per institution, attendance/test/notification compounds).

## Push (FCM)

- `POST /api/v1/auth/fcm-token` registers device tokens; `notificationService` fans out to all/batch/student audiences and calls `pushService.sendToTokens()` (mockable — set `FCM_*` env for production).

## File index (deliverables)

- **Models + middleware:** `backend/src/models/*.js`, `backend/src/middleware/*.js`
- **Routes:** `backend/src/routes/{auth,superadmin,admin,moderator,student}.routes.js`
- **Login & role routing:** `frontend/src/screens/auth/*`, `RootNavigator.js`, `AuthContext.js`
- **Admin:** `frontend/src/screens/admin/*` (dashboard, profile setup, batches, approvals, moderators, communication, monitoring)
- **Moderator:** `frontend/src/screens/moderator/*` (attendance + swim-test grading)
- **Student:** `frontend/src/screens/student/*` (PIN card + progress metrics)
