<div align="center">

# 🎓 ExamOpt AI

### Intelligent • Explainable • Adaptive Examination Scheduling

**Generate. Optimize. Explain. Reschedule.**

**Built by Team Commit2Win for GLA HackVision 2.0 — Problem Statement C10**

![React](https://img.shields.io/badge/React-18-149ECA?style=for-the-badge&logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![HackVision](https://img.shields.io/badge/HackVision-2.0-8B5CF6?style=for-the-badge)

**🏫 University-wide data onboarding** · **📅 Conflict-aware scheduling** · **🧠 Explainable optimization** · **👩‍🎓 Student portal**

[Overview](#-overview) • [Features](#-features) • [Workflow](#-how-it-works) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Team](#-team-commit2win)

</div>

---
## 🏛️ Executive Summary

Universities conduct examinations for hundreds of courses, academic departments, student cohorts, and specialized venues. Preparing an examination timetable manually is an NP-complete Constraint Satisfaction Problem (CSP). In manual or naïve first-fit scheduling, student clashes occur across departments, rooms are underutilized or double-booked, specialized computer labs are misallocated, and administrative panic ensues whenever rooms or slots suddenly become unavailable.

**ExamOpt AI** by **Team Commit2Win** delivers an enterprise-grade, deterministic, explainable examination timetable optimization platform built on modern web standards, native relational storage, and graph-theoretic constraint optimization.

### 🌟 Key Pillars of ExamOpt AI
1. **University Master Data Hub:** Administrators ingest university-wide catalogues (Departments, Programs, Subjects, Students, Course Enrollments, Venues, Faculty, and Availability) via CSV, multi-sheet XLSX, or ZIP archives with Zip Slip protection, formula injection sanitization, column mapping, and staging previews.
2. **Deterministic Constraint-Based Scheduler:** Graph coloring & backtracking with Minimum Remaining Values (MRV) and Degree heuristics. AI never replaces deterministic scheduling invariants.
3. **Cross-Department Clash Prevention (Section 15):** Detects student course enrollments spanning multiple academic departments (e.g., student STU101 in Java Programming [BCA] and Mathematics Elective [Applied Mathematics]) and strictly prevents overlapping slots or reports infeasibility if alternatives are exhausted.
4. **Exam Session Builder:** Allows configuring scoped sessions (e.g., *BCA 3rd Sem Midterm Evaluations*) by academic term, departments, and semesters. Auto-populates examination records and student enrollments without repetitive manual data entry.
5. **Optimization Lab & Scientific Comparison:** Transparently benchmarks the Smart Constraint Solver against a baseline First-Fit heuristic under identical problem inputs (evaluating conflicts, seating utilization, span days, and execution time).
6. **Exam Rescue Mode (Emergency Disruption Recovery):** Minimum-disruption engine that reschedules only affected exams during unexpected room breakdowns or blackout windows while preserving 90%+ of the established timetable.
7. **Multi-Dimensional Timetable Filtering & Student Portal:** Administrators filter by Department, Program, Semester, and Room with formula-sanitized CSV exports and official examination notices. Students view personalized calendar/list schedules and download official Admit Passes (Hall Tickets).

---

## 👥 Demo User Accounts (Pre-Seeded)

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Sarah Mitchell | `admin@university.edu` | `Admin@123` | Controller of Examinations (Full Access) |
| **Student (Cross-Dept)** | Rahul Kumar | `rahul.kumar@student.university.edu` | `Student@123` | BCA Sem 3 (Roll: `STU101`) — Enrolled in BCA + MATH |
| **Student** | Priya Sharma | `priya.sharma@student.university.edu` | `Student@123` | BCA Sem 3 (Roll: `STU102`) |
| **Student** | Amit Verma | `amit.verma@student.university.edu` | `Student@123` | B.Tech CSE Sem 3 (Roll: `STU103`) |

*The login page includes a **1-Click Quick Demo Switcher** so hackathon evaluators can inspect any persona instantly.*

---

## 🛠️ System Architecture & Technology Stack

```
examopt-ai/
├── client/                          # React 18 + Vite + Tailwind CSS + Lucide Icons + Recharts
│   ├── src/
│   │   ├── components/             # Modal, Toast, StatCard, AICopilotDrawer
│   │   ├── context/                # AuthContext (JWT bearer management & role guards)
│   │   ├── layouts/                # AdminLayout & StudentLayout (Dark Navy SaaS theme)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx       # Dual-tab portal login with 1-click evaluator chips
│   │   │   ├── admin/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── UniversityDataHubPage.jsx   # Master Data Hub (CSV/XLSX/ZIP, Mappings, Templates)
│   │   │   │   ├── ExamSessionBuilderPage.jsx  # Scoped Session Builder & Paper Auto-population
│   │   │   │   ├── GenerateTimetablePage.jsx   # Multi-filter Timetable Generation & Verification
│   │   │   │   ├── ConflictAnalysisPage.jsx    # Plain-English Diagnostics & Root Causes
│   │   │   │   ├── OptimizationLabPage.jsx     # First-Fit vs Smart Solver Benchmarking
│   │   │   │   ├── ExamRescuePage.jsx          # Minimum-Disruption Rescheduling Engine
│   │   │   │   ├── PublishReportsPage.jsx      # Multi-Dimensional Filters, Sanitized CSV, Print Notice
│   │   │   │   ├── ExaminationsPage.jsx
│   │   │   │   ├── StudentGroupsPage.jsx
│   │   │   │   ├── RoomsPage.jsx
│   │   │   │   ├── DatesSlotsPage.jsx
│   │   │   │   └── SettingsPage.jsx
│   │   │   └── student/
│   │   │       ├── StudentDashboardPage.jsx    # Next exam countdown & recent notifications
│   │   │       ├── StudentTimetablePage.jsx    # Personal Timetable (Calendar & List Views)
│   │   │       ├── StudentExamDetailsPage.jsx  # Syllabus, venue maps, and instructions
│   │   │       ├── StudentNotificationsPage.jsx
│   │   │       ├── StudentDownloadPage.jsx     # Official Admit Pass (Hall Ticket) & CSV export
│   │   │       └── StudentProfilePage.jsx
│   │   └── services/api.js         # Centralized REST client
├── server/                          # Node.js + Express + Native Synchronous SQLite (Node v24)
│   ├── src/
│   │   ├── database/
│   │   │   ├── schema.sql          # 25 relational tables with strict foreign keys and WAL mode
│   │   │   ├── db.js               # Database connection and safe migration manager
│   │   │   └── seed.js             # Realistic University Master Dataset (BCA, CSE, MATH, ECE)
│   │   ├── services/
│   │   │   ├── import/             # CSV Parser, XLSX Parser, Safe Zip Extractor, Data Validator
│   │   │   └── scheduling/         # validator.js, smartScheduler.js, firstFitScheduler.js, rescueEngine.js
│   │   ├── controllers/            # REST controllers (auth, dataHub, sessions, schedules, rescue, student, ai)
│   │   ├── routes/                 # Express API routes mounted under /api
│   │   └── tests/                  # 7 automated master test suites
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v20+ or v24+ recommended)
- npm (v10+)

### 1. Installation
In workspace root:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Database Initialization & Seeding
```bash
cd ../server
npm run seed
```
This initializes `examopt.sqlite` with:
- 4 Academic Departments (CSE, BCA, MATH, ECE)
- Academic Programs & Subjects Catalogue
- Student Profiles with Roll Numbers (`STU101`, `STU102`, `STU103`)
- University Course Enrollments (including cross-department enrollments)
- Venues (Classrooms, Lecture Halls, Computer Labs L1/L2)
- Time Slots & Maintenance Blackout Windows

### 3. Run All Automated Test Suites
From `server/` directory:
```bash
npm test
```
Runs all **7 comprehensive test suites**:
1. `test_phase1.js` — Schema integrity, authentication, and role enforcement
2. `test_phase2_3.js` — Smart Backtracking vs First-Fit Baseline, Lab constraints, and Rescue simulation
3. `test_data_hub.js` — CSV formula sanitization, Zip Slip guard, domain validation, and staging
4. `test_cross_dept_clash.js` — Section 15 Critical Acceptance Test (STU101 cross-department clash prevention)
5. `test_session_builder.js` — Scope preview, session persistence, and scoped schedule generation
6. `test_full_workflow.js` — Complete end-to-end admin generation, publishing, and student portal access
7. `test_ai_copilot.js` — Deterministic LLM scheduling copilot explainability queries

### 4. Run Application Servers
**Terminal 1 (Backend Server):**
```bash
cd server
npm start
# Runs on http://127.0.0.1:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Runs on http://localhost:3000 (proxied to backend)
```

---

## 🏛️ University Master Data Hub: Ingestion & Safety

Under `/admin/data-hub`, university administrators can download official CSV templates, upload single or bulk university datasets, and inspect staging previews before committing:
- **Downloadable Templates:** `departments.csv`, `programs.csv`, `subjects.csv`, `students.csv`, `enrollments.csv`, `rooms.csv`, `faculty.csv`, `faculty_availability.csv`, or the **Master ZIP Bundle**.
- **Security Protections:**
  - **Zip Slip & Path Traversal Prevention:** Rejects entries containing `..` or leading slashes.
  - **Zip Bomb Decompression Limit:** Rejects uncompressed file sizes exceeding 25MB or entries > 1,000 files.
  - **Formula Injection Neutralization:** Prefixes `=`, `+`, `-`, or `@` with `'` in all CSV exports.
  - **Relational Integrity Checks:** Verifies foreign keys, room capacities ($> 0$), time slot syntax, and duplicate enrollments.

---

## 🧪 Section 15: Cross-Department Clash Prevention Proof

In the pre-seeded dataset, student **Rahul Kumar (`STU101`)** is enrolled in two distinct departmental papers:
1. `CS301` — Java Programming (*Department of Computer Applications — BCA*)
2. `MA305` — Mathematics Elective (*Department of Applied Mathematics — MATH*)

When generating timetables:
- If `MA305` is locked into Monday 09:00–12:00, the constraint solver identifies STU101's external commitment and schedules `CS301` into a non-overlapping slot (e.g., Monday 12:00–14:00).
- If all alternative slots are blocked, the engine flags `CS301` as unscheduled and explains the exact student clash rather than creating an invalid schedule.
- Run `node src/tests/test_cross_dept_clash.js` anytime to verify this mathematically.

---

## 🎤 GLA HackVision 2.0: 75-Second Presentation Pitch

> *"Respected Judges, university examination scheduling is a classical NP-complete challenge. Every semester, colleges wrestle with student overlaps across departments, misallocated computer labs, and chaotic last-minute room breakdowns.*
>
> *We built **ExamOpt AI** for Problem Statement C10. ExamOpt AI eliminates manual re-entry with a **University Master Data Hub** supporting safe CSV, XLSX, and ZIP imports. Instead of scheduling in the dark, our **Exam Session Builder** scopes specific terms and departments while automatically preserving cross-department student enrollments.*
>
> *Under the hood, our **Smart Constraint Engine** applies graph backtracking with Minimum Remaining Values heuristics, achieving 100% clash-free schedules, enforcing specialized lab venues, and optimizing room utilization. If a venue suddenly breaks down, our **Exam Rescue Mode** reschedules only the affected paper, keeping 90%+ of the timetable stable.*
>
> *Administrators get multi-dimensional filtering, sanitized CSV exports, and official notices; students get live personal timetables and downloadable Admit Passes.*
>
> *Zero mock APIs, zero AI hallucinations, and 100% deterministic constraint satisfaction. That is ExamOpt AI by Team Commit2Win. Thank you!"*

---

## 👨‍💻 Team Commit2Win

<div align="center">

### Built together at GLA HackVision 2.0 🚀

| Team Member | Contribution |
|:---:|---|
| **Praveen Gautam** | Team member · frontend/user experience and product presentation |
| **Shorya** | Team member · development and integration |
| **Vishaka** | Team member · development and testing |

**Three collaborators. One mission: make university examination scheduling simpler, safer and smarter.**

</div>

> **Team contribution labels are illustrative based on discussion, not a verified final division of work.** Update roles to reflect each teammate's actual contribution before publishing.

---

<div align="center">

### 💜 Made for GLA HackVision 2.0

**Problem Statement C10 · Web Development · Algorithms · Optimization**

**ExamOpt AI — One Import. Smarter Exams. Clearer Schedules.**

</div>
