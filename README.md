# 🌿 Nexgile–DecarbX: Enterprise Carbon Accounting & ESG Compliance Platform

> **Version 1.0 (Feature Complete)**  
> *An audit-grade, multi-tenant Enterprise Environmental Intelligence, Decarbonization Analytics, and Regulatory Compliance Engine.*

---

## 📌 Table of Contents
1. [What is the Project?](#-what-is-the-project)
2. [Why the Project? (The Problem Solved)](#-why-the-project-the-problem-solved)
3. [Target Users & Role-Based Access Control (RBAC)](#-target-users--role-based-access-control-rbac)
4. [Database Architecture & Design Specification](#-database-architecture--design-specification)
5. [End-to-End Data Flows by User Persona](#-end-to-end-data-flows-by-user-persona)
6. [Platform Module Breakdown (Modules 0–8)](#-platform-module-breakdown-modules-08)
7. [Step-by-Step Local Setup & Execution Guide](#-step-by-step-local-setup--execution-guide)
8. [Automated Test Suite Verification](#-automated-test-suite-verification)

---

## 💡 What is the Project?

**Nexgile–DecarbX** is a next-generation enterprise software platform designed to measure, analyze, reduce, and report greenhouse gas (GHG) emissions across complex global corporate structures. 

The platform integrates **Scope 1 (Direct Fuel/Gas)**, **Scope 2 (Indirect Electricity Grid)**, and **Scope 3 (Supply Chain & Product Life Cycle Analysis)** carbon accounting with AI-driven decarbonization analytics, carbon financial engineering, and automated regulatory disclosure generators (CSRD/ESRS, CBAM, TCFD, EU Taxonomy).

### Core Differentiator: Cryptographic Lineage Tracking
Unlike traditional ESG reporting software that relies on static spreadsheets, Nexgile-DecarbX features an **Audit Lineage Engine**. Every single calculated metric, executive KPI, and regulatory disclosure data point is bound to an immutable `LineageRecord` citation tracing back to the original utility invoice, specific emission factor edition (e.g. EPA eGRID 2026.1, DEFRA, IEA), mathematical formula, user ID, and timestamp.

---

## 🎯 Why the Project? (The Problem Solved)

### 1. The Enterprise Decarbonization Challenge
Large multinational corporations operate across hundreds of physical plants, thousands of products, and complex global supply chains. Manually tracking carbon emissions in spreadsheets leads to:
* **Data Fragmentation**: Utility bills, fuel logs, and vendor invoices scattered across departmental silos.
* **Lack of Transparency**: Inability to trace how high-level emission numbers were derived.
* **Greenwashing Risk**: Unverified claims leading to legal liabilities and reputational damage.

### 2. Strict Global Regulatory Mandates
Governments worldwide have shifted ESG reporting from voluntary disclosures to legally binding mandates:
* 🇪🇺 **CSRD / ESRS (Corporate Sustainability Reporting Directive)**: Requires European enterprises to disclose double materiality assessments, transition plans, and XBRL-tagged data points backed by third-party audit assurance.
* 🇪🇺 **CBAM (Carbon Border Adjustment Mechanism)**: Imposes carbon import tariffs on imported industrial goods (steel, aluminum, fertilizers) based on actual embedded product emissions.
* 🌐 **TCFD (Task Force on Climate-related Financial Disclosures)**: Mandates financial impact quantification of physical and transition climate risks.

**Nexgile–DecarbX** solves these challenges by providing a single, multi-tenant software system of record that converts raw operational data into audit-ready regulatory reports.

---

## 👥 Target Users & Role-Based Access Control (RBAC)

The platform enforces strict **Separation of Duties** and multi-tenant security across **9 specialized user personas**:

| User Persona | Access Scoping | Primary Platform Function |
|---|---|---|
| 👑 **SuperAdmin** | Full Platform Access | Manages multi-tenant Organizations, Legal Entities, Facilities, User accounts, and RBAC roles in the Administration Console. |
| 👔 **Chief Sustainability Officer (CSO)** | Executive View | Oversees net-zero targets, approves CSRD double materiality assessments, and locks regulatory reports for regulators. |
| 📊 **Sustainability Analyst** | Carbon & Quality Hub | Manages Scope 1/2/3 engines, selects grid emission factor libraries (EPA, DEFRA, IEA), and resolves Data Quality Console flags. |
| 🏭 **Facility Manager** | Site-Scoped View | Scoped to specific physical plants (e.g. *Austin Plant*) to enter meter readings, fuel logs, and utility bills. |
| 📦 **Procurement Manager** | Scope 3 & Supplier Hub | Runs vendor ESG campaigns, collects supplier Product Carbon Footprints (PCFs), and evaluates carbon-weighted bids. |
| 💰 **Finance Director** | Carbon Finance Hub | Sets Internal Carbon Prices ($/tCO2e), manages entity carbon budgets, verifies credit offsets, and calculates green investment ROI/NPV. |
| 🚚 **External Vendor / Supplier** | Restricted Supplier Portal | Log in to an isolated portal (`SupplierPortalPage.tsx`) to respond to questionnaires and submit product footprints. |
| 🔍 **Independent External Auditor** | Read-Only Audit Browser | Browses calculation `LineageRecord` primitive chains, inspects raw invoice proof, and issues digital `VERIFIED` audit seals. |
| 🧠 **Decarb Strategy Consultant** | AI & Scenario Analytics | Models reduction initiatives, builds Marginal Abatement Cost Curves (MACC), and runs Monte Carlo sensitivity simulations. |

---

## 🗄️ Database Architecture & Design Specification

Nexgile-DecarbX uses a **Polyglot Hybrid Database Architecture**:

```
┌─────────────────────────────────────────────────────────┐     ┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (Relational Store)              │     │                MongoDB (Document Store)                 │
│  • Multi-Tenant Hierarchy (Orgs, Entities, Facilities)  │     │  • Supplier ESG Questionnaire Responses                 │
│  • Governed Carbon Ledgers & Emission Factors           │ ◄───┼─►• Vendor Survey Field Schemas                          │
│  • BOM Trees, PCF Calculations & Financial Ledgers      │ DB  │  • Raw Utility Invoice Document OCR Extractions        │
│  • Compliance Filings, Lineage Records & Audit Logs     │ Link│  (Linked via postgres_ref_id / mongo_ref_id string)     │
└─────────────────────────────────────────────────────────┘     └─────────────────────────────────────────────────────────┘
```

### Core Schema Tables (PostgreSQL):
* **`organizations` / `entities` / `facilities`**: Multi-tenant organizational hierarchy and site metadata (`gross_floor_area_sqm`, `operational_control`).
* **`users` / `roles` / `permissions` / `user_org_roles`**: Granular RBAC security engine.
* **`activity_data`**: Central Scope 1, 2, and 3 activity ledger storing quantity, unit, activity type, and source connector.
* **`emission_factors`**: Grid emission factor library covering 15+ countries (EPA eGRID, DEFRA, IEA).
* **`calculations`**: Governed calculation results bound to primitive `lineage_id` citations.
* **`products` / `skus` / `boms` / `pcfs` / `scenario_pcf`**: Product master, Bill of Materials trees, and PCF cradle-to-gate/grave LCA calculations (`@no_actuals_mutation` scenario isolation).
* **`suppliers` / `supplier_products` / `procurement_bids`**: Supplier master, ESG campaigns, and carbon-weighted procurement bidding.
* **`scenario_forecasts` / `reduction_initiatives` / `scenario_monte_carlo`**: AI time-series forecasts, MACC reduction curves, and 1,000-run Monte Carlo simulations.
* **`carbon_budgets` / `internal_carbon_prices` / `credit_offsets` / `project_economics`**: Carbon fees, entity allowances, offset credit retirements, and green project ROI/NPV.
* **`disclosures` / `disclosure_datapoints` / `cbam_declarations`**: CSRD double materiality, XBRL data tags, and CBAM import embedded emissions.
* **`lineage_records` / `lineage_verifications` / `admin_audit_logs`**: Immutable audit records and auditor verification seals.

---

## 🔄 End-to-End Data Flows by User Persona

### 1. Sustainability Group Flow (Data Ingestion to Audit Lineage)
```
[Raw Bill Input] ──► [Factor Match] ──► [Engine Calc] ──► [Data Quality Check] ──► [Lineage Drawer Citation]
```
1. **Input**: Analyst uploads `sample_utility_data.csv` containing `45,000 m3` Natural Gas for *Texas Clean Tech Plant*.
2. **Factor Matching**: System matches EPA eGRID factor (`0.3851 kgCO2e/m3`, Version `2026.1`).
3. **Calculation**: Engine computes: $45,000 \times 0.3851 / 1000 = 17.329 \text{ tCO2e}$.
4. **Quality Check**: `DataQualityService` scores data completeness at `100%`.
5. **Lineage Citation**: Generates a unique `lineage_id` linking raw bill + factor edition + formula + user ID.

### 2. Business Group Flow (Supplier Engagement to Carbon Bidding)
```
[Sourcing Campaign] ──► [Vendor Portal Submits PCF] ──► [MongoDB Store] ──► [Carbon-Weighted Bid] ──► [BOM Tree Link]
```
1. Procurement Manager launches bid campaign for 10,000 units of Aluminum Casing.
2. Vendor logs into `SupplierPortalPage.tsx` and submits product footprint ($3.2\text{ kgCO2e/unit}$).
3. Questionnaire responses save in **MongoDB** (`mongo_db`) linked to Postgres via `postgres_ref_id`.
4. Procurement algorithm evaluates bids using cost ($) AND carbon footprint ($kgCO_2e$).
5. Winning low-carbon component automatically links to Product BOM tree in Module 2.

### 3. External Auditor Flow (Regulatory Assurance to Audit Seal)
```
[CSRD Report Inspection] ──► [Click Lineage Link] ──► [Trace Raw Invoice Proof] ──► [Auditor Stamp] ──► [Export XBRL]
```
1. External Auditor logs in with read-only assurance access.
2. Inspects CSRD Report disclosure data point **ESRS E1-6 (Scope 1 GHG Emissions)**.
3. Clicks `lineage_id` citation, opening `EvidenceAuditBrowserPage.tsx`.
4. Traces calculation backwards: `CSRD Disclosure -> Calculation -> Raw Invoice -> Grid Factor`.
5. Clicks **"Verify Record"**, recording a `LineageVerification` stamp (`VERIFIED`) and unlocking the export package.

---

## 🚀 Step-by-Step Local Setup & Execution Guide

### Prerequisites
* **Git**
* **Python 3.10+** (Python 3.11 or 3.13 recommended)
* **Node.js 18+** & **npm**

---

### 1️⃣ Clone Repository & Checkout Main
```bash
git clone https://github.com/Hrushikesh0804/Nexgile-.git
cd Nexgile-
git checkout main
```

---

### 2️⃣ Backend Setup & Database Seeding (Terminal 1)
```powershell
# Navigate to backend directory
cd backend

# Create & activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # On Windows PowerShell
# source venv/bin/activate    # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Seed database with Orgs, Factors, Products, CSRD Disclosures, and All 9 User Roles
$env:PYTHONPATH="."           # On Windows PowerShell
# export PYTHONPATH=.         # On macOS/Linux
python app/seed.py

# Start FastAPI backend server (http://localhost:8000)
python -m uvicorn app.main:app --reload --port 8000
```
*(Interactive API documentation is available at `http://localhost:8000/docs`)*

---

### 3️⃣ Frontend Setup & Start Dev Server (Terminal 2)
Open a **second terminal window/tab**:
```powershell
cd Nexgile-/frontend

# Install node dependencies
npm install

# Start Vite React development server (http://localhost:5173)
npm run dev
```

---

### 🌐 Access Application & Demo User Logins

Open browser to: **`http://localhost:5173`**

Use the **Demo User Persona Selector** dropdown on the login screen:

| Role Persona | Email Login | Default Password |
|---|---|---|
| 👑 **SuperAdmin** | `admin@nexgile.com` | `AdminPass123!` |
| 👔 **Chief Sustainability Officer** | `cso@nexgile.com` | `AdminPass123!` |
| 📊 **Sustainability Analyst** | `analyst@nexgile.com` | `AdminPass123!` |
| 🏭 **Facility Manager** | `facility@nexgile.com` | `AdminPass123!` |
| 📦 **Procurement Manager** | `procurement@nexgile.com` | `AdminPass123!` |
| 💰 **Finance Director** | `finance@nexgile.com` | `AdminPass123!` |
| 🚚 **External Vendor / Supplier** | `supplier@nexgile.com` | `AdminPass123!` |
| 🔍 **Independent Auditor** | `auditor@nexgile.com` | `AdminPass123!` |
| 🧠 **Decarb Consultant** | `consultant@nexgile.com` | `AdminPass123!` |

---

## 🧪 Automated Test Suite Verification

To execute all **38 backend unit & integration tests**:

```powershell
cd backend
$env:PYTHONPATH="."
python -m pytest tests -v
```

Expected result:
```bash
====================== 38 passed in 20.12s =======================
```

---

## 🐳 Docker Deployment Option (Single-Command Run)

If Docker is installed:
```bash
docker-compose up --build
```
* **Frontend**: `http://localhost:5173`
* **Backend API Docs**: `http://localhost:8000/docs`
