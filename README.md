# LifeOS — Personal Command Center ⚡

<p align="center">
  <img src="https://img.shields.io/badge/React-19.3-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.3-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-5.3-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47a248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License MIT" />
</p>

<p align="center">
  <strong>Master your daily tasks, habit streaks, financial commitments, and deep work in one unified, distraction-free flow.</strong>
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [✨ Key Features](#-key-features)
  - [1. Landing Page & Secure Auth Guard](#1-landing-page--secure-auth-guard)
  - [2. Central Command Overview](#2-central-command-overview)
  - [3. Tasks & Priority Management](#3-tasks--priority-management)
  - [4. Habits & Streak Tracking](#4-habits--streak-tracking)
  - [5. Smart Finance & Subscriptions](#5-smart-finance--subscriptions)
  - [6. Deep Work Focus Studio](#6-deep-work-focus-studio)
  - [7. Time-Blocking Calendar](#7-time-blocking-calendar)
  - [8. Long-Term Goals & Milestones](#8-long-term-goals--milestones)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [📡 API Architecture](#-api-architecture)
- [📁 Project Structure](#-project-structure)
- [🎨 Design System & Theming](#-design-system--theming)
- [📄 License](#-license)

---

## 🧭 Overview

Most people manage their lives across five fragmented apps: one for to-dos, one for habits, another for finance tracking, a timer for focus, and yet another for calendar scheduling. Switching between them causes cognitive fatigue and broken routines.

**LifeOS** solves this by unifying your operational workflow into a cohesive, fast, and aesthetically pleasing command center. Built with **local-first principles** and seamless **MongoDB Atlas cloud sync**, your data is always private, resilient, and instantly accessible.

---

## ✨ Key Features

### 1. Landing Page & Secure Auth Guard
- **Aesthetic Landing Page:** Clean hero section, interactive live preview tabs (Tasks, Habits, Finance, Focus), and feature breakdown.
- **Strict Auth Guard:** Dashboard access is strictly guarded; without login, all workspace activities are protected.
- **Instant Redirect:** Fast JWT sign-in / registration with automatic redirection into the user's dashboard.
- **Multi-Device Cloud Sync:** Automatic background sync with MongoDB Atlas with offline fallback resilience.

### 2. Central Command Overview
- **Real-Time KPI Cards:** Instant glance at today's focus minutes, tasks due, active habit streaks, and monthly cash flow.
- **Unified Action Feed:** Prioritized urgent checklist, upcoming events, and recent activity timeline.
- **Global Command Palette:** Instant jump anywhere via keyboard shortcut <kbd>Ctrl</kbd> + <kbd>K</kbd>.

### 3. Tasks & Priority Management
- **Eisenhower Priority Tagging:** Classify tasks into P1 (High), P2 (Medium), P3 (Normal), and P4 (Low).
- **Subtask Checklists:** Track granular steps with dynamic progress bars.
- **Smart Due Dates & Overdue Badges:** Automatic visual alerts for pending and overdue items.
- **Categorization & Quick Filter:** Filter instantly by status, tags, and text search.

### 4. Habits & Streak Tracking
- **Momentum Building:** Track daily streaks, target frequencies (daily, weekdays, weekly), and total completions.
- **Visual Grid View:** 7-day interactive consistency matrix with one-click check-offs.
- **Custom Categorization:** Expressive icons, tailored colors, and category groupings.

### 5. Smart Finance & Subscriptions
- **Interactive Month Navigator:** Easily navigate and review historical or future months (`« Prev | Month Picker | Next »`).
- **Dynamic Category Separation:** Distinct, curated category lists for Expenses (Groceries, Dining, Rent, Shopping, Utilities, etc.) and Income (Salary, Freelance, Investments, etc.).
- **Category Budgets:** Set spending caps per category with visual health indicators and overspend warnings.
- **Subscriptions & Recurring Tracker:**
  - Track monthly and yearly recurring commitments (Netflix, Spotify, Gym, Rent, Internet, SIPs).
  - Next due date alerts and monthly commitment total.
  - **1-Click Toggle Paid / Unpaid:** Mark paid deducts money as an expense once (preventing duplicates), displays `✅ Paid (Undo)`, and clicking undo restores deducted balance.
- **Financial Analytics & Intelligence:**
  - **Savings Rate Metric:** Calculated as $\frac{\text{Income} - \text{Expenses}}{\text{Income}} \times 100$ with health badges.
  - **Daily Burn Rate & Monthly Projection:** Projects end-of-month spend based on current pace.
  - **6-Month Cash Flow Trend Chart:** Dual-bar comparison comparing income vs. expenses over time.
  - **Payment Method Breakdown:** Track payment mode distribution (UPI, Credit Card, Debit Card, Cash, Net Banking).
  - **Export to CSV:** One-click CSV export of filtered transactions for spreadsheet and tax reporting.

### 6. Deep Work Focus Studio
- **Dual Timing Modes:** Pomodoro cycle (25m work / 5m short break / 15m long break) and Stopwatch.
- **Soundscapes & Binaural Beats:** Integrated ambient audio generator (White noise, Lo-fi, Rain).
- **Focus Logging:** Automatically records completed sessions into your daily productivity analytics.

### 7. Time-Blocking Calendar
- **Schedule Directly:** Drag or assign tasks into specific time slots on your day.
- **Conflict Detection:** Visual indicators for overlapping events and meetings.
- **Multi-View Modes:** Day and week time-grid views.

### 8. Long-Term Goals & Milestones
- **Quarterly Checkpoints:** Break big life goals into manageable milestones.
- **Progress Tracking:** Automatic progress bar calculations based on milestone completions or numeric targets.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Custom CSS Design System |
| **Backend** | Express 5, TypeScript (`tsx`), Node.js |
| **Database** | MongoDB Atlas, Mongoose 9 |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs`, Bearer Token Authorization |
| **Styling** | Vanilla CSS Tokens, Glassmorphism, Dual Theme (Dark / Light) |
| **Tooling** | Concurrently, Oxlint |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) URI)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Samrat-Madake/Life_OS.git
   cd Life_OS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lifeos
JWT_SECRET=your_super_secret_jwt_key_here
```

*(Note: For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.)*

### Running Locally

Run both the frontend client and backend API concurrently:

```bash
npm run dev:all
```

Or run them in separate terminals:

```bash
# Terminal 1: Backend API Server (Port 5000)
npm run server

# Terminal 2: Vite Client (Port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 API Architecture

All endpoints under `/api/data/*` require a Bearer token in the `Authorization` header (`Authorization: Bearer <token>`).

### Auth Routes (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user and receive JWT token |
| `POST` | `/api/auth/login` | Authenticate user credentials and return JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile via Bearer token |

### Data Routes (`/api/data`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/data/state` | Fetch full user state (tasks, habits, finance, events, goals) |
| `POST` | `/api/data/sync` | Persist full client workspace state to MongoDB |

---

## 📁 Project Structure

```
Life_OS/
├── server/
│   ├── middleware/
│   │   └── auth.ts          # JWT authentication middleware
│   ├── models/
│   │   ├── User.ts          # User authentication schema
│   │   └── UserData.ts      # Workspace state data schema
│   ├── routes/
│   │   ├── auth.ts          # Registration, login & profile routes
│   │   └── data.ts          # State retrieval and sync routes
│   └── index.ts             # Express server setup and MongoDB connection
├── src/
│   ├── components/
│   │   ├── AuthModal.ts     # Standalone auth modal component
│   │   ├── CommandPalette.tsx # Global Ctrl+K navigation
│   │   ├── CommonUI.tsx     # Reusable cards, badges, and empty states
│   │   ├── FinanceAnalytics.tsx # Trend charts, savings rate, burn rate
│   │   └── TaskComponents.tsx # Task row and subtask checklist UI
│   ├── views/
│   │   ├── CalendarView.tsx # Time-blocking calendar
│   │   ├── FinanceView.tsx  # Finance, budgets, and recurring subscriptions
│   │   ├── FocusStudio.tsx  # Deep work timer and soundscapes
│   │   ├── GoalsView.tsx    # Long-term goals & milestones
│   │   ├── HabitsView.tsx   # Habit matrix and streak logging
│   │   ├── LandingView.tsx  # Public landing page with auth flow
│   │   ├── OverviewView.tsx # Main dashboard command center
│   │   └── TasksView.tsx    # Priority-based task manager
│   ├── api.ts               # Client API wrapper with timeout resilience
│   ├── App.tsx              # Root app component with auth guard
│   ├── index.css            # Design tokens, themes & utilities
│   ├── models.ts            # TypeScript interfaces and data models
│   ├── store.tsx            # State management, local-first cache & sync
│   └── utils.ts             # Date formatting, INR currency & helpers
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🎨 Design System & Theming

LifeOS features a bespoke Vanilla CSS design system built from CSS custom properties:
- **Dark Mode (`default`):** Deep indigo-tinted dark aesthetic (`--bg: #0a0a0f`) with glassmorphism overlays and accent gradients.
- **Light Mode:** High-contrast crisp paper style (`--bg: #f6f7fb`) with frosted-glass translucent headers.
- **Typography:** Uses Google's **Inter** for clean UI readability and **JetBrains Mono** for numerical accuracy and dates.
- **Zero Third-Party CSS Bloat:** Highly responsive, zero TailwindCSS dependencies for maximum speed and control.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use and adapt it for your personal or commercial productivity workflows.

---

<p align="center">
  Crafted with care for high-performers, builders, and mindful operators. ⚡
</p>
