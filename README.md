# ManuDesk - BDA Team Workspace for Manufacturing Operations

ManuDesk is a specialized Business Development Associate (BDA) Team Workspace and Lead Pipeline designed for industrial manufacturing environments. By bridging CRM capabilities with manufacturing logistics and operational metrics (inspired by GoodDay, Jira, and HubSpot), ManuDesk coordinates the lifecycle of sales inquiries, custom part quotations, client communications, and team performance dashboards.

This workspace is designed to feel like an internal enterprise application, avoiding unnecessary design clutter and focusing on structured cards, a compact design, a muted professional palette, and clear visual graphs.

---

## Technical Stack

### Frontend
- **Framework:** React (v18) with Vite
- **Routing:** React Router DOM (v6)
- **Styling:** Tailwind CSS (configured with a professional slate/zinc shadcn/ui aesthetic)
- **Icons:** Lucide React
- **Analytics:** Recharts
- **State Management:** React Context (Authentication) and Axios defaults

### Backend
- **Server:** Node.js, Express.js (Monolith serves compiled frontend assets in production)
- **Database:** SQLite (file-based database contained directly inside the repository)
- **ORM:** Prisma Client
- **Authentication:** JSON Web Tokens (JWT) with bcryptjs password hashing
- **Security:** Express CORS middleware, Role-Based Access Control (RBAC)

---

## Core Features

1. **Enterprise Landing Dashboard:**
   - Operational KPIs (Total Inquiries, Active Opportunities, Quotation Metrics, Pipeline Values, Booked Revenue in Rupees `₹`).
   - Monthly Won Revenue trend areas (via Recharts).
   - Lead Pipeline Stage distribution bars.
   - Interactive activity feed tracking logs chronologically.

2. **Lead Pipeline Kanban Board:**
   - 8 manufacturing-specific stages: `New Inquiry`, `Requirement Discussion`, `Quotation Prepared`, `Quotation Sent`, `Negotiation`, `Purchase Order Received`, `Closed Won`, `Closed Lost`.
   - Native HTML5 drag-and-drop workflow syncing immediately with the database.
   - Stage indicators detailing total accumulated deal values.
   - Advanced search (Company, Contact Person, Industry) and priority filters.

3. **Manufacturing Account Workspace (Client Directory):**
   - Central database listing company profiles, procurement contacts, location, main product interests, and annual requirements.
   - **Account Workspace Panel:** A slide-out detailed summary showing linked active opportunities, quotation logs, and chronological activity timelines.

4. **Quotation Workflow & Automated Stages:**
   - Log item names, quantity, unit price, discounts, delivery timelines, and commercial terms.
   - Quotation states: `Draft`, `Sent`, `Under Review`, `Approved`, `Rejected`.
   - **Sales Automations:** Advancing a quote to *Sent* moves the pipeline lead to `Quotation Sent`. Approving a quote advances the lead to `Negotiation`, updates the deal value to match the final quote, and logs activity records automatically.

5. **Chronological Communication Workflow:**
   - Log calls, meetings, emails, site visits, and negotiation updates.
   - Form linking communication notes directly to client accounts and active lead inquiries.

6. **Team Performance Leaderboard:**
   - Ranked leaderboard measuring BDA performance: total leads, quotation output, closed deals, booked revenue volume, and win rate conversion percentages.
   - Personal stand-ins comparing individual progress against the team average.

7. **BDA Role Simulator Tool:**
   - An on-the-fly credential swapper built directly into the Settings tab. Swap between Suresh Mehta (Admin), Rahul Sharma (BDA 1), and Priya Patel (BDA 2) with a single click to test role restrictions.

---

## Project Structure

```
ManuDesk/
 ├── package.json             # Root monorepo configuration (coordinative scripts)
 ├── client/                  # Frontend Vite + React Project
 │    ├── src/
 │    │    ├── components/    # Reusable UI controls (Button, Card, Badge, etc.)
 │    │    ├── context/       # Auth & Toast state context & Axios configurations
 │    │    ├── layouts/       # Main sidebar workspace wrapper
 │    │    ├── pages/         # Dashboard, Pipeline, Clients, Performance, etc.
 │    │    ├── index.css      # Core styles & Tailwind directives
 │    │    └── main.jsx       # React entry point
 │    ├── package.json
 │    └── tailwind.config.js
 │
 └── server/                  # Backend Node.js API & Monolith Server
      ├── config/             # DB Prisma connections
      ├── controllers/        # Route logic (Auth, Lead, Client, Quote, Analytics)
      ├── middleware/         # JWT protection & RBAC role checks
      ├── prisma/             # Prisma Schema and migrations definitions
      │    ├── schema.prisma  # SQLite database model mappings
      │    └── dev.db         # Local development SQLite file
      ├── routes/             # Endpoint definitions
      ├── utils/              # Seeding scripts (seed.js)
      ├── .env                # Env variables (PORT, DATABASE_URL, JWT secret)
      └── server.js           # Server starter file (Serves frontend static build)
```

---

## Local Setup & Run Guide

### Prerequisites
- **Node.js:** v18.x or v22.x
- **PNPM:** Used for client & server dependencies (recommended for workspace isolation, though standard `npm` is supported)

### 1. Configure Environment Variables
In the `server/` folder, create a `.env` file containing:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET=manudesk_security_token_jwt_2026_key_9876
NODE_ENV=development
```

### 2. Install Dependencies & Build
You can bootstrap and build the entire monolithic app using the root coordinates:
```bash
# Install root workspace dependencies
pnpm install

# Build client assets and generate Prisma schemas
pnpm run build
```

### 3. Run Application Monolith
```bash
# Run migrations, database seed, and start the unified server
pnpm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

*Note: For hot-module-reloading (HMR) frontend development, you can run `pnpm --filter manudesk-client run dev` in a separate terminal to start Vite on port `3000` pointing to the backend on `5000`.*

---

## Database Seeding Accounts

To test the role-based dashboard, log in with these credentials or use the role simulator inside the **Settings** view:

| Account Name | Email | Password | Authorization Role |
| :--- | :--- | :--- | :--- |
| **Suresh Mehta** | `admin@manudesk.com` | `admin123` | **Admin** (Global visibility & actions) |
| **Rahul Sharma** | `bda1@manudesk.com` | `bda123` | **BDA Executive** (Manages Rahul's assigned leads) |
| **Priya Patel** | `bda2@manudesk.com` | `bda123` | **BDA Executive** (Manages Priya's assigned leads) |

---

## Production Deployment to Render (Single Service)

Since we serve the client directly from the Express backend, you only need to deploy **one** service on Render:

1. **Create Web Service:** Go to [Render](https://render.com/) and create a new **Web Service** linked to your Repository.
2. **Build Settings:**
   * **Build Command:** `npm run build`
   * **Start Command:** `npm start`
3. **Configure Environment Variables:**
   * `NODE_ENV` = `production`
   * `JWT_SECRET` = `your_super_secret_jwt_key`
   * `DATABASE_URL` = `file:/data/dev.db`
4. **Attach Persistent Disk:**
   * Go to the **Disks** tab of your Render Web Service.
   * Add a disk with **Mount Path** set to `/data` (size: `1 GB`). This ensures that your SQLite database is persistent across restarts and redeployments!
