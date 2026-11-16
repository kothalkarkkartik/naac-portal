// NAAC Criteria Metadata & Guidelines
const NAAC_CRITERIA_META = [
  {
    id: "c1",
    number: 1,
    title: "Criterion 1 - Curricular Aspects",
    weightage: 100,
    shortTitle: "Curricular Aspects",
    icon: "fa-book-open",
    description: "Curriculum design, planning, implementation, academic flexibility, curriculum enrichment, and stakeholder feedback systems.",
    metrics: [
      {
        code: "1.1.1",
        type: "QlM",
        label: "Curricula developed & implemented with relevance to local, regional, national & global needs (CO-PO Mapping)",
        hint: "Describe curriculum alignment, Program Outcomes (POs), Program Specific Outcomes (PSOs) and Course Outcomes (COs) within 500 words."
      },
      {
        code: "1.1.2",
        type: "QnM",
        label: "Percentage of Programmes where syllabus revision was carried out during last 5 years (%)",
        unit: "%"
      },
      {
        code: "1.2.1",
        type: "QnM",
        label: "Number of Add on / Certificate / Value added programs conducted during academic year",
        unit: "Courses"
      },
      {
        code: "1.2.2",
        type: "QnM",
        label: "Percentage of students enrolled in Certificate/Add-on programs as against total student strength (%)",
        unit: "%"
      },
      {
        code: "1.3.1",
        type: "QlM",
        label: "Institution integrates crosscutting issues (Professional Ethics, Gender, Human Values, Environment & Sustainability)",
        hint: "Provide descriptive narrative of courses integrating ethics, environmental studies, gender equity."
      },
      {
        code: "1.3.2",
        type: "QnM",
        label: "Percentage of students undertaking project work / field work / internships during the year (%)",
        unit: "%"
      },
      {
        code: "1.4.1",
        type: "QnM",
        label: "Structured feedback received from 1) Students 2) Teachers 3) Employers 4) Alumni (Scale: 1 to 5)",
        unit: "/ 5.0"
      }
    ]
  },
  {
    id: "c2",
    number: 2,
    title: "Criterion 2 - Teaching-Learning and Evaluation",
    weightage: 350,
    shortTitle: "Teaching-Learning",
    icon: "fa-chalkboard-teacher",
    description: "Student enrollment, catering to diverse learning needs, teaching-learning methodologies, teacher profile, evaluation process, and Student Satisfaction Survey.",
    metrics: [
      {
        code: "2.1.1",
        type: "QnM",
        label: "Enrolment percentage against sanctioned intake (%)",
        unit: "%"
      },
      {
        code: "2.1.2",
        type: "QnM",
        label: "Percentage of seats filled against reserved categories (SC, ST, OBC, Divyangjan) (%)",
        unit: "%"
      },
      {
        code: "2.2.1",
        type: "QlM",
        label: "Institution assesses learning levels and organizes special programs for advanced learners and slow learners",
        hint: "Explain methodologies for remedial coaching, peer tutoring, and advanced competitive exam mentoring."
      },
      {
        code: "2.2.2",
        type: "QnM",
        label: "Student - Full time teacher ratio during the year",
        unit: "Ratio"
      },
      {
        code: "2.3.1",
        type: "QlM",
        label: "Student centric methods: Experiential learning, participative learning, flipped classrooms & problem solving",
        hint: "Document practical ICT tools, virtual labs, simulation software, smart classrooms."
      },
      {
        code: "2.4.1",
        type: "QnM",
        label: "Percentage of full time teachers against sanctioned posts (%)",
        unit: "%"
      },
      {
        code: "2.4.2",
        type: "QnM",
        label: "Average percentage of full time teachers with Ph.D. / D.M. / M.Ch. / D.N.B / NET / SET (%)",
        unit: "%"
      },
      {
        code: "2.5.1",
        type: "QlM",
        label: "Mechanism of internal evaluation is transparent and grievance redressal system is time-bound",
        hint: "Outline continuous internal evaluation (CIE), display of marks, answer script re-evaluation process."
      },
      {
        code: "2.6.1",
        type: "QlM",
        label: "Program Outcomes and Course Outcomes are stated and communicated to teachers and students",
        hint: "Describe dissemination methods: website, syllabi handbook, lab manuals, induction sessions."
      },
      {
        code: "2.6.2",
        type: "QnM",
        label: "Pass percentage of final year outgoing students during the academic year (%)",
        unit: "%"
      },
      {
        code: "2.7.1",
        type: "QnM",
        label: "Online Student Satisfaction Survey (SSS) score on overall institutional performance",
        unit: "/ 4.0"
      }
    ]
  },
  {
    id: "c3",
    number: 3,
    title: "Criterion 3 - Research, Innovations and Extension",
    weightage: 120,
    shortTitle: "Research & Innovation",
    icon: "fa-flask",
    description: "Research facilities, grants mobilized from Govt/Industry, Incubation ecosystem, patents, indexed publications, and community outreach.",
    metrics: [
      {
        code: "3.1.1",
        type: "QnM",
        label: "Grants received from Government and non-governmental agencies for research projects (in INR Lakhs)",
        unit: "₹ Lakhs"
      },
      {
        code: "3.2.1",
        type: "QnM",
        label: "Number of research projects sponsored by government and non-government agencies",
        unit: "Projects"
      },
      {
        code: "3.3.1",
        type: "QlM",
        label: "Institution has created an ecosystem for innovations including Incubation centre and entrepreneurship cell",
        hint: "Describe IIC activities, start-up incubation, intellectual property rights cell, seed capital support."
      },
      {
        code: "3.3.2",
        type: "QnM",
        label: "Number of workshops/seminars conducted on Research Methodology, IPR and entrepreneurship",
        unit: "Events"
      },
      {
        code: "3.4.1",
        type: "QlM",
        label: "Institution has stated Code of Ethics to check malpractices and plagiarism in Research",
        hint: "Detail plagiarism software (Turnitin/Urkund), ethics committee oversight, faculty publication incentives."
      },
      {
        code: "3.4.2",
        type: "QnM",
        label: "Number of research papers published in UGC CARE / Scopus / Web of Science indexed journals",
        unit: "Papers"
      },
      {
        code: "3.4.3",
        type: "QnM",
        label: "Number of books, chapters in edited volumes / conference proceedings published",
        unit: "Publications"
      },
      {
        code: "3.5.1",
        type: "QnM",
        label: "Revenue generated from consultancy and corporate training during the year (in INR Lakhs)",
        unit: "₹ Lakhs"
      },
      {
        code: "3.6.1",
        type: "QnM",
        label: "Extension and outreach activities conducted through NSS/NCC/Red Cross and community bodies",
        unit: "Activities"
      },
      {
        code: "3.7.1",
        type: "QnM",
        label: "Number of collaborative activities for research, faculty exchange, student internship with active MoUs",
        unit: "MoUs"
      }
    ]
  },
  {
    id: "c4",
    number: 4,
    title: "Criterion 4 - Infrastructure and Learning Resources",
    weightage: 100,
    shortTitle: "Infrastructure & Library",
    icon: "fa-landmark",
    description: "Physical classrooms, modern laboratory facilities, Central Library ILMS, Wi-Fi bandwidth, computing terminals, sports, and campus maintenance.",
    metrics: [
      {
        code: "4.1.1",
        type: "QlM",
        label: "Adequate facilities for teaching-learning: classrooms, laboratories, computing equipment, seminar halls",
        hint: "Detail ICT-enabled classrooms, smart boards, language labs, specialized engineering workshops."
      },
      {
        code: "4.1.2",
        type: "QlM",
        label: "Adequate facilities for cultural activities, sports, games (indoor/outdoor), gymnasium, auditorium",
        hint: "Describe sports ground dimensions, gym equipment, yoga hall, cultural auditorium seating capacity."
      },
      {
        code: "4.2.1",
        type: "QlM",
        label: "Library is automated using Integrated Library Management System (ILMS), subscription to e-resources",
        hint: "State ILMS name, version, automation degree (fully/partially), barcode/RFID, remote access gateway."
      },
      {
        code: "4.2.2",
        type: "QnM",
        label: "Annual expenditure for purchase of books/e-books and subscription to journals/e-journals (INR Lakhs)",
        unit: "₹ Lakhs"
      },
      {
        code: "4.2.3",
        type: "QnM",
        label: "Average daily footfall of teachers and students visiting the library (physical & digital)",
        unit: "Users/day"
      },
      {
        code: "4.3.1",
        type: "QlM",
        label: "Institution frequently updates its IT facilities including Wi-Fi, leased line bandwidth & firewall",
        hint: "Specify leased line speed (e.g. 500 Mbps 1:1), firewall make, computer-to-student ratio."
      },
      {
        code: "4.3.2",
        type: "QnM",
        label: "Student - Computer ratio across institution",
        unit: "Ratio"
      },
      {
        code: "4.4.1",
        type: "QnM",
        label: "Percentage expenditure incurred on maintenance of physical and academic support facilities (Excl. Salary) (%)",
        unit: "%"
      }
    ]
  },
  {
    id: "c5",
    number: 5,
    title: "Criterion 5 - Student Support and Progression",
    weightage: 140,
    shortTitle: "Student Support",
    icon: "fa-user-graduate",
    description: "Scholarships, freeships, capability enhancement schemes, career counselling, competitive exams, placements, grievance redressal, and alumni network.",
    metrics: [
      {
        code: "5.1.1",
        type: "QnM",
        label: "Percentage of students benefited by scholarships and freeships provided by Government (%)",
        unit: "%"
      },
      {
        code: "5.1.2",
        type: "QnM",
        label: "Percentage of students benefited by scholarships / freeships provided by the Institution & NGOs (%)",
        unit: "%"
      },
      {
        code: "5.1.3",
        type: "QlM",
        label: "Capacity building & skills enhancement initiatives (Soft skills, Language & communication, Life skills, Computing)",
        hint: "Enumerate training modules conducted by specialized soft-skill trainers."
      },
      {
        code: "5.1.4",
        type: "QlM",
        label: "Transparent mechanism for timely redressal of student grievances including sexual harassment and ragging",
        hint: "Outline Anti-Ragging committee, Internal Complaints Committee (ICC), online grievance portal."
      },
      {
        code: "5.2.1",
        type: "QnM",
        label: "Percentage of placement of outgoing students and students progressing to higher education (%)",
        unit: "%"
      },
      {
        code: "5.2.2",
        type: "QnM",
        label: "Percentage of students qualifying in state/national/international examinations (GATE, GRE, CAT, MPSC/UPSC)",
        unit: "Students"
      },
      {
        code: "5.3.1",
        type: "QnM",
        label: "Number of awards/medals for outstanding performance in sports/cultural activities at inter-university/state/national",
        unit: "Awards"
      },
      {
        code: "5.4.1",
        type: "QlM",
        label: "Registered Alumni Association contributes significantly to the development of the institution",
        hint: "Detail registered alumni chapters, financial corpus contributions, guest lectures, placement referrals."
      }
    ]
  },
  {
    id: "c6",
    number: 6,
    title: "Criterion 6 - Governance, Leadership and Management",
    weightage: 100,
    shortTitle: "Governance & IQAC",
    icon: "fa-university",
    description: "Institutional vision, strategic plan, decentralization, faculty empowerment, financial audits, resource mobilization, and functioning of IQAC.",
    metrics: [
      {
        code: "6.1.1",
        type: "QlM",
        label: "Governance and leadership is in accordance with vision and mission of the institution with decentralization",
        hint: "Describe administrative decentralization, academic freedom, role of Governing Body and College Development Committee (CDC)."
      },
      {
        code: "6.2.1",
        type: "QlM",
        label: "Strategic Plan and deployment documents are available and successfully implemented in the institution",
        hint: "Outline 5-year institutional strategic roadmap, ERP automation, infrastructure expansion."
      },
      {
        code: "6.3.1",
        type: "QlM",
        label: "Institution has effective welfare measures for teaching and non-teaching staff and avenues for career development",
        hint: "List provident fund, group gratuity, health insurance, study leave, conference travel grants."
      },
      {
        code: "6.3.2",
        type: "QnM",
        label: "Percentage of teachers provided with financial support to attend conferences / workshops / professional bodies (%)",
        unit: "%"
      },
      {
        code: "6.4.1",
        type: "QlM",
        label: "Institution conducts internal and external financial audits regularly with statutory Chartered Accountant",
        hint: "Detail financial audit mechanism, compliance to audit objections, transparent budget allocations."
      },
      {
        code: "6.5.1",
        type: "QlM",
        label: "Internal Quality Assurance Cell (IQAC) has contributed significantly for institutionalizing quality assurance",
        hint: "Highlight Academic and Administrative Audit (AAA), NIRF participation, green audits, ISO certifications."
      }
    ]
  },
  {
    id: "c7",
    number: 7,
    title: "Criterion 7 - Institutional Values and Best Practices",
    weightage: 100,
    shortTitle: "Values & Best Practices",
    icon: "fa-certificate",
    description: "Gender equity, environmental sustainability, alternate energy, waste management, code of conduct, institutional best practices, and distinctiveness.",
    metrics: [
      {
        code: "7.1.1",
        type: "QlM",
        label: "Measures initiated by the Institution for the promotion of gender equity during the year",
        hint: "Detail safety, CCTV surveillance, girls common room, day-care center, women empowerment cell events."
      },
      {
        code: "7.1.2",
        type: "QlM",
        label: "The Institution has facilities for alternate sources of energy, energy conservation and water conservation",
        hint: "Solar rooftop panels (kW capacity), rainwater harvesting pits, sewage treatment plant (STP), LED lighting."
      },
      {
        code: "7.1.3",
        type: "QlM",
        label: "Describe the facilities for management of degradable and non-degradable waste (Solid, Liquid, Biomedical, E-waste)",
        hint: "Provide details of vermicomposting, hazardous chemical handling, authorised e-waste recyclers."
      },
      {
        code: "7.2.1",
        type: "QlM",
        label: "Describe two institutional best practices successfully implemented as per NAAC format",
        hint: "Best Practice 1 (e.g. Industry Embedded Practical Training) & Best Practice 2 (e.g. Village Adoption & Rural Water Engineering)."
      },
      {
        code: "7.3.1",
        type: "QlM",
        label: "Portray the performance of the Institution in one area distinctive to its priority and thrust",
        hint: "Outline BIGCE's distinctive identity: e.g. Empowering Rural Engineering Aspirants with Industry-Grade Technological Skills."
      }
    ]
  }
];

// Specialized metrics tailored for Library, Scholarship, R&D
const SPECIALIZED_UNIT_METRICS = {
  "unit-lib": {
    c4: [
      {
        code: "4.2.1",
        type: "QlM",
        label: "ILMS Software Automation (KOHA / SLIM / SOUL), Barcode, RFID Integration & Web OPAC",
        hint: "Detail ILMS version, database size, Web OPAC accessibility, automated issue-return kiosk."
      },
      {
        code: "4.2.2",
        type: "QlM",
        label: "Subscription to E-Resources (E-Journals: IEEE, Springer, ScienceDirect, DELNET, National Digital Library)",
        hint: "List e-resource subscriptions, perpetual access licenses, remote access software setup."
      },
      {
        code: "4.2.3",
        type: "QnM",
        label: "Annual budget and expenditure on procurement of books, journals and e-database subscriptions (in ₹ Lakhs)",
        unit: "₹ Lakhs"
      },
      {
        code: "4.2.4",
        type: "QnM",
        label: "Average daily footfall (physical gate register + digital e-library logs)",
        unit: "Users/day"
      }
    ]
  },
  "unit-sch": {
    c5: [
      {
        code: "5.1.1",
        type: "QnM",
        label: "Percentage of students benefited by Government Post-Matric Scholarships (MahaDBT / NSP / Social Welfare) (%)",
        unit: "%"
      },
      {
        code: "5.1.2",
        type: "QnM",
        label: "Percentage of students awarded Institutional Freeships, Fee Concessions & Trust Aid (%)",
        unit: "%"
      },
      {
        code: "5.1.3",
        type: "QnM",
        label: "Total monetary amount disbursed across all scholarship schemes during the academic year (in ₹ Lakhs)",
        unit: "₹ Lakhs"
      },
      {
        code: "5.1.4",
        type: "QlM",
        label: "Audited statement & CA certificate verifying disbursement to student accounts via DBT",
        hint: "Upload bank reconciliation sheet, committee minutes, and official social welfare audit certificate."
      }
    ]
  },
  "unit-rnd": {
    c3: [
      {
        code: "3.1.1",
        type: "QnM",
        label: "Total Research Grants mobilized from SERB, DST, AICTE, ISRO, and Corporate industries (in ₹ Lakhs)",
        unit: "₹ Lakhs"
      },
      {
        code: "3.2.1",
        type: "QnM",
        label: "Number of Sponsored Research & Industrial Consultancy Projects sanctioned during the year",
        unit: "Projects"
      },
      {
        code: "3.3.1",
        type: "QlM",
        label: "Institutional Incubation Ecosystem, IIC 4-Star Rating, Prototype funding, and Startup Seed Support",
        hint: "Detail startups registered, pre-incubation facilities, fabrication lab (FabLab), mentor panel."
      },
      {
        code: "3.4.2",
        type: "QnM",
        label: "Number of research papers published in Scopus / Web of Science / UGC CARE list",
        unit: "Papers"
      },
      {
        code: "3.4.3",
        type: "QnM",
        label: "Number of Patents Filed, Published, and Granted by Indian Patent Office (IPO) / PCT",
        unit: "Patents"
      },
      {
        code: "3.7.1",
        type: "QnM",
        label: "Active functional MoUs with tier-1 engineering companies and international universities",
        unit: "MoUs"
      }
    ]
  }
};
