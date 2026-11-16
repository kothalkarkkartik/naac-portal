# Bharat-Ratna Indira Gandhi College of Engineering (BIGCE), Kegaon, Solapur
## BIGCE Accreditation Management System (NAAC SSR Portal)

> **Trust**: Kai. Sushilatai Gaikwad Bahuuddeshiya Sanstha (KSGBS)  
> **Institution**: Bharat-Ratna Indira Gandhi College of Engineering, Kegaon, Solapur (BIGCE)  
> **DTE Code**: 6219  
> **Campus Address**: Gat No. 58/3, Solapur-Pune National Highway No. 9, Near Kegaon, Solapur - 413255, Maharashtra  
> **Official Website**: [bigce.in](https://bigce.in)  
> **Approvals & Affiliations**: Approved by AICTE (New Delhi) & DTE (Govt. of Maharashtra) | Affiliated to Dr. Babasaheb Ambedkar Technological University (DBATU), Lonere / Punyashlok Ahilyadevi Holkar Solapur University (PAHSU) & MSBTE Mumbai  
> **Portal URL**: [http://localhost:3000](http://localhost:3000)

---

## 🏛️ Configured Branches & Departments (14 Total)

### 1. Diploma Section
* **Diploma in Mechanical Engineering** (`DIP-ME`)
* **Diploma in Electrical Engineering** (`DIP-EE`)

### 2. Undergraduate (UG) Section
* **B.E. Biomedical Engineering** (`UG-BME`)
* **B.E. Civil Engineering** (`UG-CE`)
* **B.E. Computer Science & Engineering** (`UG-CSE`)
* **B.E. Electrical Engineering** (`UG-EE`)
* **B.E. Mechanical Engineering** (`UG-ME`)
* **B.E. Electronics & Telecommunication Engineering** (`UG-ETC`)

### 3. Postgraduate (PG) Section
* **Master of Computer Applications (MCA)** (`PG-MCA`)
* **M.Tech Civil Engineering (Water Resources Engineering - WRE)** (`PG-CE-WRE`)

### 4. Foundational Section
* **Basic Sciences & Humanities (BSH)** (`FND-BSH`) — 1st Year Engineering foundation & student induction

### 5. Support & Functional Units
* **Central Knowledge Resource Centre (Library)** (`UNIT-LIB`) — KOHA ILMS, e-resource subscriptions (IEEE/ScienceDirect), footfall
* **Scholarship & Student Welfare Section** (`UNIT-SCH`) — MahaDBT, NSP, institutional freeships
* **Research & Development (R&D) Cell** (`UNIT-RND`) — SERB/AICTE grants, patents, indexed journals

---

## 👥 Role-Based Access Control & Logins

The portal is strictly gated behind a clean login screen. Everything is visible **only after authentication** according to the logged-in user's role:

| Role | Username | Password | Official Name & Designation |
| :--- | :--- | :--- | :--- |
| **Admin Coordinator** | `admin` | `admin123` | **Dr. Rameshwar V. Chougule** (Director IQAC & Overall NAAC Admin) |
| **Principal** | `principal` | `principal123` | **Dr. Shashikant P. Bandgar** (Principal & Head of Institution) |
| **President / Chairman** | `president` | `president123` | **Hon. Dr. B. J. Patil** (Chairman & President, KSGBS Governing Council) |
| **Department Coordinator** (e.g. CSE) | `coord_ug_cse` | `pass123` | **Prof. N. P. Pawar** (NAAC Working Coordinator) |
| **HOD** (e.g. CSE) | `hod_ug_cse` | `pass123` | **Dr. A. B. Kadam** (Head of Department) |
| *(All other depts have `coord_<dept_id>` and `hod_<dept_id>` with password `pass123`)* | | | |

---

## 🔥 Firebase Cloud Integration

* **Project ID**: `naacc-d8759`
* **Auth Domain**: `naacc-d8759.firebaseapp.com`
* **Storage Bucket**: `naacc-d8759.firebasestorage.app`
* **Integration Features**:
  * Real-time sync of Criteria 1 to 7 submissions into Firestore collection `naac_submissions`.
  * Activity audit logs synced to Firestore collection `activity_logs`.
  * Client-side Google Analytics enabled with Measurement ID `G-DMFB2P3KZ9`.
  * Dual-layer setup: Frontend Modular SDK via `<script type="module">` + Node.js Backend Firestore SDK via `npm install firebase`.

---

## ☁️ Cloudinary Media & Document Storage

* **Cloud Name**: `wtlbrdk3`
* **Folder**: `naackk`
* **Upload Preset**: `naackk` (Unsigned)
* **Supported File Types**: PDF, Excel (`.xlsx`, `.xls`), Word (`.docx`), Images (`.png`, `.jpg`, `.webp`), Zip
* **Workflow**: Any document attached by Department Coordinators is uploaded directly to Cloudinary CDN under `wtlbrdk3/naackk/`, providing permanent secure HTTPS links.

---

## 🔒 Post-Login Clean Views

1. **Department Coordinator**:
   - Sees ONLY their assigned department.
   - Clean, focused data entry form for Criteria 1 to 7.
   - Evidence file upload with preview.
   - "Submit to HOD" button with status badge.

2. **Head of Department (HOD)**:
   - Sees review queue for their department's Criteria 1 to 7.
   - Inspects submitted data and attached proof documents.
   - "Grant HOD Approval & Forward to IQAC" or "Return with Remarks" buttons.

3. **Admin Coordinator (Director IQAC)**:
   - Overall 14-Departments Status Matrix.
   - Quality Audit & IQAC Verification Desk.
   - Consolidated SSR Report generation.

4. **Principal**:
   - Executive Dashboard with Projected NAAC Rating (Grade A++, CGPA 3.68/4.00).
   - Principal Sanction Desk for institutional approval.

5. **President**:
   - High-level Governing Council Overview.
   - Final Presidential Seal & Endorsement desk.

---

## 🚀 How to Run

1. Open terminal in `d:\naac portal`.
2. Start the server:
   ```powershell
   node server.js
   ```
3. Open in browser:
   ```
   http://localhost:3000
   ```
