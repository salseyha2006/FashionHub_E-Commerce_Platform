# FashionHub E-Commerce Platform

Project នេះត្រូវបានបំបែកជា **2 ផ្នែកដាច់ដោយឡែកពីគ្នា** ដើម្បីងាយស្រួល deploy ដាច់ដោយឡែក៖

```
FashionHub_E-Commerce_Platform/
├── frontend/                → React + Vite (Client)
│   ├── vercel.json           → Vercel deploy config (SPA routing)
│   └── .env.example
└── backend/                 → Node.js + Express + Prisma (API)
    ├── src/app.js             → Express app (used by both server.js and tests)
    ├── src/server.js          → starts the live server
    ├── tests/                 → Jest + Supertest API tests
    ├── render.yaml            → Render Blueprint deploy config
    ├── railway.json           → Railway deploy config
    ├── .env.example
    └── .env.test.example      → for running `npm test`
```

## អ្វីដែលបានកែប្រែពី project ដើម

1. **បំបែក frontend/backend ឲ្យស្អាត** — ដកឯកសារ backend ចំនួន 3 ដែលច្រឡំចូល
   `src/` របស់ frontend ដោយច្រឡំ (`order.controller.js`, `admin-order.routes.js`,
   `serializers.js`) — ឯកសារទាំងនេះមិនត្រូវបានប្រើដោយ frontend ទេ ព្រោះមាន
   copy ត្រឹមត្រូវនៅក្នុង `backend/` រួចហើយ។
2. **កែ `package.json`** — `@prisma/client` និង `prisma` ដែលដាក់ខុសកន្លែង
   (នៅ root/frontend) ត្រូវបានផ្លាស់ទៅ `backend/package.json` វិញ ព្រោះ Prisma
   ត្រូវការតែសម្រាប់ backend ប៉ុណ្ណោះ។
3. **បង្កើត `.env.example`** សម្រាប់ទាំង frontend និង backend ជំនួសឲ្យ `.env`
   ពិត (សូមមើលចំណុចសំខាន់ខាងក្រោម)។
4. **CORS** នៅ backend ត្រូវបានកែឲ្យអាចកំណត់ដោយ environment variable
   (`CORS_ORIGIN`) ដើម្បីអនុញ្ញាតតែ frontend domain ដែល deploy ជាក់ស្តែង។
5. **Phase 9 — Testing & Deployment Prep**:
   - បំបែក `server.js` ជា `app.js` (Express app) + `server.js` (entry point) ដើម្បីអាច test បានដោយមិនចាំបាច់ run port ពិត
   - បន្ថែម Jest + Supertest tests សម្រាប់ `auth` (register/login) និង `orders` (រួមទាំង stock validation edge case)
   - បន្ថែម `.env.test.example` សម្រាប់ test database ដាច់ដោយឡែក
   - បន្ថែម `JWT_EXPIRY` ដែលបាត់ពី `.env.example` (ត្រូវការដោយ `auth.controller.js`)
   - បន្ថែម `render.yaml`, `railway.json` (backend) និង `vercel.json` (frontend) សម្រាប់ deploy ស្វ័យប្រវត្តិ
6. **Phase 10 — Theme & Branding Engine**:
   - `StoreSetting` (backend) បន្ថែម columns ថ្មី: `theme_primary_color`, `theme_radius_style`, `theme_font`, `favicon_url` (migration: `20260724000000_add_theme_settings`)
   - `/api/settings` (public) និង `/api/admin/settings` ត្រូវ return/accept theme fields ទាំងនេះ ជាមួយ validation ខាង server (hex regex, enum check) — មិនទុកឲ្យតែ frontend validate ទេ
   - Frontend: `src/utils/theme.js` generate ពណ៌ scale ១០កម្រិត (50-900) ដោយស្វ័យប្រវត្តិពីពណ៌តែមួយ (HSL math, គ្មាន dependency បន្ថែម) និង `src/context/ThemeContext.jsx` apply ជា CSS custom properties លើ `:root` នៅ runtime — មិនចាំបាច់កែ className ណាមួយ ព្រោះ Tailwind v4 `@theme` tokens ជា real CSS variables រួចហើយ
   - `AdminSettings.jsx` បន្ថែម section "Branding & theme": color picker + preview scale, corner-radius picker (rounded/sharp/pill), font picker, favicon URL — save រួច preview ប្តូរភ្លាមដោយមិនចាំបាច់ reload page
   - Theme cache ក្នុង `sessionStorage` ដើម្បីកុំឲ្យ flash ពណ៌ default មុន network request resolve
7. **Phase 11 — Presets & Homepage Layout Manager**:
   - `StoreSetting` បន្ថែម `color_presets`, `size_presets`, `homepage_sections` ជា `Json` columns (migration: `20260724010000_add_presets_and_homepage_layout`) — backfill ដោយ defaults ដូចគ្នានឹង hard-code ចាស់ ដើម្បីកុំឲ្យ store ដែលមានស្រាប់ប្តូររូបរាងភ្លាមៗ
   - `AdminProductForm.jsx` លែង hard-code `SIZE_PRESETS`/`COLOR_PRESETS` ទៀតហើយ — fetch ពី `/api/admin/settings` (មាន fallback បើ fetch fail)
   - `AdminSettings.jsx` បន្ថែម section "Product presets" (បន្ថែម/លុប color & size preset) និង "Homepage layout" (បង្ហាញ/លាក់ + តម្រៀបលំដាប់ Hero/Categories/Featured ដោយប៊ូតុងឡើង-ចុះ គ្មាន drag-and-drop library ដើម្បីជៀសវាង dependency)
   - `Home.jsx` renders sections តាមលំដាប់ + visibility ដែល Admin កំណត់ (`/api/settings` public endpoint ត្រូវ return `homepageSections`); `colorPresets`/`sizePresets` នៅតែជា admin-only ព្រោះប្រើតែក្នុង Admin product form
8. **Phase 12 — Roles & Permissions**:
   - `Role` enum បន្ថែម `staff`; `User` បន្ថែម `permissions` (Json array) និង `is_active` (migration: `20260724020000_add_staff_roles_permissions`)
   - `src/utils/permissions.js` — registry មជ្ឈិមនៃ permission keys (`manage_products`, `manage_categories`, `manage_orders`, `manage_banners`, `manage_settings`, `view_dashboard`, `use_pos`) + `hasPermission()`
   - `auth.middleware.js`: `requireAdmin` ឥឡូវ verify role/isActive ពី DB ផ្ទាល់ (មិនទុកចិត្ត JWT payload ចាស់); `requirePermission(key)` ថ្មី សម្រាប់ route ដែល staff អាចទទួលបានសិទ្ធិ delegated
   - Route ទាំងអស់ (products/categories/banners/orders/dashboard/POS/settings) ប្តូរពី `requireAdmin` blanket ទៅ `requirePermission(key)` ជាក់លាក់
   - `team.controller.js` + `team.routes.js` (`/api/admin/team`) — **owner-only** (`requireAdmin` ជានិច្ច មិនដែលជា `requirePermission`) ដើម្បីការពារ staff ពី privilege escalation៖ មិនអាចផ្លាស់ប្តូរ role ខ្លួនឯង ឬបង្កើត admin ថ្មីបានទេ សូម្បីតែមាន `manage_settings`
   - Login block គណនី `is_active = false`; `AuthContext.jsx` បន្ថែម `isStaff`, `hasAdminAccess`, `hasPermission(key)`; `AdminLayout.jsx` filter nav តាម permission; `AdminSettings.jsx` section "Team & roles" សម្រាប់ owner invite/toggle staff
9. **Phase 13 — SEO, Notifications & System**:
   - `StoreSetting` បន្ថែម `seo_title`, `seo_description`, `og_image_url`, `ga_id`, SMTP fields, `maintenance_mode`, `default_language`, `timezone` (migration: `20260724030000_seo_notifications_system_audit`)
   - `src/utils/crypto.js` — AES-256-GCM encrypt SMTP password នៅ database (`SETTINGS_ENCRYPTION_KEY` env var); admin DTO return តែ `smtpPasswordSet: boolean`, មិនដែល return password ត្រឡប់មកវិញទេ
   - `AdminSettings.jsx` section "SEO", "Notifications", "System & data"; `App.jsx` បន្ថែម `MaintenanceGate` បិទ storefront សម្រាប់អ្នកទិញនៅពេល `maintenanceMode = true` (Admin/staff នៅតែចូលបាន)
10. **Phase 14 — Audit Log, Backup & Security Hardening**:
    - `SettingAuditLog` model — កត់ត្រារាល់ការកែប្រែ Settings (អ្នកកែ + field + old/new value); field រសើប (SMTP password, bank account number) log ជា `changed: true` តែប៉ុណ្ណោះ មិន log តម្លៃពិតទេ — មើលបាននៅ "Team → Audit log" (owner-only)
    - `GET/PUT /api/admin/settings/export|import` — Backup/restore ជា JSON (loại SMTP password ចេញ ព្រោះវា encrypt ដោយ key ជាក់លាក់នឹង environment មិន portable)
    - `src/utils/urlSafety.js` — reject `javascript:`/`data:` scheme លើគ្រប់ URL field ទាំងអស់ (logo, favicon, QR, OG image) ការពារ stored-XSS
    - `src/middleware/rateLimit.middleware.js` — rate-limit `PUT /admin/settings` (dependency-free, in-memory sliding window)

## ⚠️ សំខាន់ណាស់ — សូមធ្វើមុនអ្វីៗទាំងអស់

Zip ដើមមាន `backend/.env` ដែលផ្ទុក **DATABASE_URL និង JWT_SECRET ជាព័ត៌មានពិត**។
ខ្ញុំបានយកចេញពី package នេះ (មិនរួមបញ្ចូល `.env` ទេ មានតែ `.env.example`)។
**សូមប្តូរ password database និង JWT secret ថ្មីភ្លាមៗ** មុននឹង deploy ជាផ្លូវការ
ព្រោះព័ត៌មានចាស់អាចនឹងលេចធ្លាយរួចហើយ។

---

## Step by Step — Setup សម្រាប់ Development លើ Computer

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

បន្ទាប់មកបើក `.env` ហើយបំពេញ៖
- `DATABASE_URL` — connection string ពី PostgreSQL provider របស់អ្នក (Render, Railway, Supabase...)
- `JWT_SECRET` — random string វែងៗ (អាច generate ដោយ `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

បន្ទាប់មក run migration + seed data៖

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Backend នឹង run នៅ `http://localhost:5000`

---

## Testing (Backend API Tests)

មាន automated tests (Jest + Supertest) សម្រាប់៖
- `POST /api/auth/register` និង `POST /api/auth/login` (validation, duplicate email, wrong password, ...)
- `POST /api/orders` — ជាពិសេស **stock validation edge case** (order លើសពី stock ដែលមាន, order ត្រូវនឹង stock ជាក់ស្តែងបំផុត (boundary), stock មិនត្រូវប្តូរប្រសិនបើ order fail ព្រោះប្រើ `$transaction`)

⚠️ Tests ត្រូវការ **PostgreSQL database ដាច់ដោយឡែក** ពី dev/production ព្រោះ tests លុប data ក្នុង table មុន test ម្តងៗ។ កុំដែល point `DATABASE_URL` តេស្តទៅ database ពិតជាដាច់ខាត។

```bash
cd backend
npm install

# បង្កើត database ទទេមួយសម្រាប់តេស្តតែប៉ុណ្ណោះ (ឧ. fashionhub_test)
cp .env.test.example .env.test
# កែ DATABASE_URL ក្នុង .env.test ឲ្យចង្អុលទៅ database តេស្ត

# Push schema ទៅ test database (migrate deploy ត្រូវការ migration ដែលមានស្រាប់)
DATABASE_URL="<your test db url>" npx prisma migrate deploy

npm test
```

`npm test` នឹង run Jest ដោយ `NODE_ENV=test` ស្វ័យប្រវត្តិ ដែលធ្វើឲ្យ app load `.env.test` ជំនួស `.env` ធម្មតា។

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend នឹង run នៅ `http://localhost:5173` (Vite dev server មាន proxy `/api` → `localhost:5000` រួចហើយ ដូច្នេះមិនចាំបាច់កែ `.env` អ្វីទេពេល develop local)

---

## Step by Step — Deploy ជាផ្លូវការ (Production)

### 1. Deploy Backend មុន (ឧ. Render.com ឬ Railway.app)

**Render (មាន `backend/render.yaml` ជា Blueprint រួចហើយ)**
1. លើ Render dashboard → New → Blueprint → ភ្ជាប់ GitHub repo នេះ
2. Render នឹងអាន `render.yaml` ស្វ័យប្រវត្តិ ហើយបង្កើតទាំង Web Service និង PostgreSQL database ជូន (`DATABASE_URL`, `JWT_SECRET`, `DEVICE_API_KEY` នឹង generate ស្វ័យប្រវត្តិ)
3. បន្ទាប់ពី deploy លើកដំបូងរួច សូមចូលទៅកែ `CORS_ORIGIN` ដោយដៃឲ្យត្រូវនឹង URL របស់ frontend

**Railway (មាន `backend/railway.json`)**
1. New Project → Deploy from GitHub → កំណត់ **Root Directory = `backend`**
2. Railway នឹងអាន `railway.json` ស្វ័យប្រវត្តិ (build + start command)
3. Add PostgreSQL plugin ជូន `DATABASE_URL` ស្វ័យប្រវត្តិ
4. កំណត់ Environment Variables ដោយដៃ៖ `JWT_SECRET`, `JWT_EXPIRY`, `DEVICE_API_KEY`, `CORS_ORIGIN`

**ដោយដៃ (provider ណាមួយផ្សេង)**
- Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start command: `npm start`
- Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `DEVICE_API_KEY`, `CORS_ORIGIN`, `PORT`

Deploy រួច copy URL របស់ backend (ឧ. `https://fashionhub-api.onrender.com`)

### 2. Deploy Frontend (ឧ. Vercel ឬ Netlify)

**Vercel (មាន `frontend/vercel.json` រួចហើយ សម្រាប់ SPA routing)**
1. New Project → Import GitHub repo → កំណត់ **Root Directory = `frontend`**
2. Vercel នឹង detect Vite ស្វ័យប្រវត្តិតាម `vercel.json`
3. កំណត់ Environment Variable៖ `VITE_API_URL` = URL របស់ backend + `/api` (ឧ. `https://fashionhub-api.onrender.com/api`)
4. Deploy

**Netlify**
- Build command: `npm run build`
- Publish directory: `dist`
- ត្រូវបន្ថែម redirect rule ដូច `vercel.json` (SPA fallback ទៅ `index.html`) ក្នុង `netlify.toml` ឬ `_redirects` file ដើម្បីឲ្យ React Router ដំណើរការត្រឹមត្រូវ

### 3. ត្រឡប់ទៅកែ Backend CORS

ត្រឡប់ទៅកែ `CORS_ORIGIN` នៅ backend ឲ្យត្រូវនឹង URL ចុងក្រោយរបស់ frontend បន្ទាប់ពី deploy រួច ដើម្បីកុំឲ្យ browser block request។

---

## Tech Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express 5, Prisma ORM, PostgreSQL, JWT auth, bcrypt
