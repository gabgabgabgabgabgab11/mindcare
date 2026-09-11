MindCare

A Web-Based Mental Wellness Monitoring and Student Support System for Polytechnic University of the Philippines – Santa Maria Campus

1. Project Overview

MindCare is a proposed web-based mental wellness monitoring and student support system designed for students of the Polytechnic University of the Philippines – Santa Maria Campus (PUP-SMB).

The system is intended to provide students with a more accessible, private, and organized way to monitor their general wellness, complete standardized wellness screening instruments, record personal reflections, access wellness resources, and find pathways toward professional support.

MindCare is designed as a support and monitoring system, not as a replacement for a licensed mental health professional.

2. Purpose of the Project

The purpose of MindCare is to develop a centralized web-based platform that can support student wellness monitoring and improve how wellness-related information, self-monitoring activities, and support resources are accessed within the campus setting.

The system is intended to address limitations associated with fragmented or manual processes, where wellness-related activities may involve separate forms, messages, records, and communication channels.

MindCare seeks to provide a more organized digital environment where students can:

Monitor their general wellness

Complete wellness screening assessments

Record personal journal entries

Review wellness progress

Access appropriate wellness resources

Manage selected privacy preferences

Participate in a moderated Freedom Wall

Receive system notifications

Find information for professional support

3. Overall Goal

The overall goal of the project is to develop a privacy-conscious, accessible, and structured web-based wellness monitoring system that can help students become more aware of their wellness patterns while providing appropriate pathways toward available support.

The project is not intended to diagnose mental health conditions.

Instead, it focuses on:

Monitoring, awareness, early identification of possible concerns, resource access, and connection to professional support.

4. Aim of the Study

The study aims to determine the feasibility and appropriateness of developing a web-based mental wellness monitoring and student support system for PUP Santa Maria Campus.

Specifically, the study aims to:

Identify the wellness monitoring and support needs of students.

Examine existing challenges associated with student wellness support processes.

Design a web-based system that addresses identified needs.

Integrate standardized wellness screening instruments such as the PHQ-9 and GAD-7, subject to appropriate expert validation and ethical considerations.

Provide students with tools for wellness tracking, journaling, resources, and privacy management.

Provide appropriate system-based wellness prioritization without presenting the system as a diagnostic tool.

Implement privacy, consent, authentication, and role-based access controls.

Provide a structured pathway for students to access professional support.

Evaluate the system using appropriate technical and user-centered criteria during the later stages of the study.

5. Research and Development Context

MindCare is being developed as a capstone project for:

Polytechnic University of the Philippines – Santa Maria, Bulacan Campus
Bachelor of Science in Information Technology

The project is being developed incrementally through:

Requirements analysis

Student needs analysis

Stakeholder input

Review of related literature

System design

Prototype development

Technical validation

Professional expert validation

Software testing

Later system evaluation

The prototype and system design may be revised based on adviser feedback, defense panel recommendations, ethical requirements, professional validation, and technical testing.

6. Target Users

6.1 Student

The Student is the primary user of MindCare.

Students can:

Access their dashboard

Track wellness information

Complete assessments

Write journal entries

View wellness progress

Access resources

Use the Freedom Wall

View notifications

Manage privacy settings

Provide consent where required

Access professional support information

6.2 Admin

The Admin is responsible for system-level administration.

Administrators may:

Manage user accounts

Manage wellness resources

Manage system settings

Review audit records

Manage selected Freedom Wall content

View authorized analytics and reports

Configure applicable role-based access settings

6.3 Professional Support

MindCare provides a pathway toward professional support rather than attempting to replace professional services.

The current system direction does not include a full Counselor Dashboard.

Instead, the student-facing system provides information and contact pathways for the appropriate psychologist or professional support.

7. Core System Features

7.1 Student Dashboard

The dashboard serves as the student's main entry point.

It provides access to:

Wellness information

Assessment summaries

Wellness progress

Resources

Notifications

Quick actions

Support information

The dashboard should present information in a clear and non-diagnostic manner.

7.2 Wellness Tracking

Students can record and monitor selected wellness-related information over time.

The purpose is to allow students to observe general patterns rather than provide medical or psychological diagnosis.

Possible information may include:

Mood/check-in information

Assessment information

Wellness trends

Progress indicators

7.3 PHQ-9 Assessment

MindCare includes the Patient Health Questionnaire-9 (PHQ-9) as a proposed standardized screening instrument.

The assessment workflow is:

Student opens the assessment.

Student reviews applicable instructions.

Student provides responses.

Student submits the assessment.

The backend validates and processes the responses.

Appropriate results and/or wellness information are presented.

Relevant resources may be recommended.

The implementation must follow the approved project requirements and professional validation.

Clinical Boundary

The PHQ-9 is used within the project for screening/monitoring purposes.

MindCare must not present the result as a psychological diagnosis.

7.4 GAD-7 Assessment

MindCare also includes the Generalized Anxiety Disorder-7 (GAD-7) as a proposed standardized screening instrument.

The workflow is similar to the PHQ-9:

Student opens the assessment.

Student reviews applicable instructions.

Student provides responses.

Frontend validates the submission.

Backend processes the responses.

Appropriate information/resources are presented.

The implementation must follow the approved requirements and professional validation.

7.5 Journal

The Journal allows students to record personal reflections.

Students may:

Create journal entries

View previous entries

Edit entries where allowed

Delete entries where allowed

Review journal history

Journal entries are sensitive user-generated information and must therefore be protected through appropriate authentication, authorization, privacy controls, and data protection.

7.6 NLP-Assisted Journal Analysis

MindCare may use a Natural Language Processing (NLP) component to analyze journal text for general sentiment or emotional indicators.

The purpose is to provide an additional supporting signal that may contribute to wellness prioritization.

NLP is not intended to:

Diagnose a mental health condition

Replace a psychologist

Determine a student's clinical condition

Make independent medical decisions

NLP output should be treated as a supporting system signal, not a clinical conclusion.

The appropriateness and implementation of this feature are subject to professional expert validation.

7.7 Wellness Prioritization / System-Assisted Triage

MindCare may use assessment-related information and other approved system signals to organize wellness-related cases according to predefined rules.

This can be referred to as:

Wellness prioritization

or

System-assisted triage

The purpose is to help organize information and identify situations that may require greater attention or an appropriate support pathway.

It does not mean that the system is diagnosing students.

A high-level workflow is:

Student Input
      ↓
Assessment / Approved Wellness Signals
      ↓
System Processing
      ↓
Wellness Priority Level
      ↓
Appropriate Resource / Support Pathway

The actual rules, thresholds, and presentation must be supported by the project's requirements and professional validation.

7.8 Wellness Progress

Students can view selected wellness information over time.

The feature may present:

Trends

Progress

Previous assessment information

Check-in history

General wellness indicators

The interface should avoid language that implies medical diagnosis.

7.9 Wellness Resources

The system provides access to wellness-related resources, which may include:

Educational materials

Wellness guidance

Campus support information

Professional support information

Emergency/support contacts where approved

Resources should be reviewed and presented according to project and institutional requirements.

7.10 Freedom Wall

The Freedom Wall provides a moderated space where students may share general thoughts or experiences.

Possible functions include:

Creating posts

Anonymous posting

Viewing posts

Reporting content

Moderation

Community guidelines

Because the Freedom Wall involves user-generated content, the system considers:

Content safety

Privacy

Abuse prevention

Moderation

Appropriate filtering

Professional review of safety-related rules

The Freedom Wall is not a substitute for professional counseling.

7.11 Notifications

The system can provide notifications related to:

Assessment activity

Wellness reminders

System updates

Resources

Support-related information

Notifications should avoid unnecessarily exposing sensitive information.

8. Privacy and Consent

Privacy is a major component of MindCare.

The system includes appropriate consent and privacy mechanisms before sensitive wellness information is processed.

Student privacy settings may include:

Allow Activity Tracking

Allows the student to control whether applicable activity information may be included in permitted monitoring features.

Anonymize My Activity

Example description:

Hide your name and dates — only overall wellness scores are shared.

These controls must correspond to actual backend-enforced privacy rules.

A frontend toggle alone is not sufficient security.

9. Role-Based Access Control (RBAC)

MindCare uses Role-Based Access Control (RBAC) to determine what different users can access.

Current primary roles are:

Student
   └── Student Features

Admin
   └── Administrative Features

The backend is responsible for enforcing authorization.

Frontend route protection is an additional interface-level control and must not be the only authorization mechanism.

10. Audit Trail

The system may record selected security- and system-related events.

Examples include:

Authentication events

Administrative actions

Important system changes

Relevant record actions

Audit records should avoid unnecessarily storing sensitive journal content or other private information.

11. System Architecture

MindCare follows a proposed 3-Tier System Architecture.

┌──────────────────────────────────────────┐
│               USER LAYER                 │
│                                          │
│           Student        Admin            │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│        TIER 1 — PRESENTATION             │
│                                          │
│        React + TypeScript + Vite         │
│                                          │
│    Pages • Components • Forms • UI       │
└────────────────────┬─────────────────────┘
                     │
                     │ HTTPS / REST API
                     ▼
┌──────────────────────────────────────────┐
│          TIER 2 — APPLICATION            │
│                                          │
│                  FastAPI                 │
│                                          │
│ Authentication                           │
│ Authorization / RBAC                     │
│ Validation                               │
│ Assessment Processing                    │
│ Wellness Logic                           │
│ NLP Processing                           │
│ Privacy Rules                            │
│ API Services                             │
└───────────────────┬───────────┬──────────┘
                    │           │
                    ▼           ▼
┌────────────────────────┐  ┌────────────────────┐
│ TIER 3 — DATA          │  │ EXTERNAL SERVICES  │
│                        │  │                    │
│ Supabase PostgreSQL    │  │ SMTP Email Gateway │
│                        │  │                    │
└────────────────────────┘  └────────────────────┘

12. Technology Stack

Frontend

React

TypeScript

Vite

Tailwind CSS

React Router

Axios or Fetch API

Backend

Python

FastAPI

Pydantic

Uvicorn

SQLAlchemy

Database

PostgreSQL

Supabase-hosted PostgreSQL

Additional Components

NLP processing component

SMTP email service/gateway

HTTPS

REST API

Testing

Backend

Pytest

Frontend

Vitest

React Testing Library

End-to-end testing where appropriate

13. High-Level Data Model

The proposed relational database contains entities such as:

USER
ROLE
PERMISSION
ROLE_PERMISSION
ACCESS_GRANT
ASSESSMENT
ASSESSMENT_RESPONSE
JOURNAL_ENTRY
CHECK_IN
APPOINTMENT
NOTIFICATION
RESOURCE
FREEDOM_WALL_POST
AUDIT_LOG

The exact database schema may evolve during development based on requirements, privacy considerations, expert feedback, and technical testing.

14. Project Structure

mindcare/
│
├── backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │
│   │   ├── core/
│   │   │
│   │   ├── models/
│   │   │
│   │   ├── schemas/
│   │   │
│   │   ├── services/
│   │   │
│   │   ├── dependencies/
│   │   │
│   │   └── main.py
│   │
│   ├── tests/
│   │
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   └── assets/
│   │
│   ├── tests/
│   ├── package.json
│   └── .env
│
├── docs/
│   ├── API_CONTRACT.md
│   ├── TEST_CASES.md
│   ├── DEVELOPMENT_LOG.md
│   ├── SYSTEM_REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   └── VALIDATION.md
│
├── README.md
└── .gitignore

15. Backend Responsibilities

The backend is responsible for:

Authentication

Authorization

RBAC

API endpoints

Input validation

Assessment processing

Wellness logic

NLP processing

Privacy enforcement

Database operations

Audit logging

Notifications

Security-related rules

The backend is the authoritative layer for sensitive business rules.

16. Frontend Responsibilities

The frontend is responsible for:

User interface

Navigation

Forms

Input collection

Client-side validation

Displaying backend results

Loading states

Error states

Empty states

Responsive design

Accessibility

User interaction

The frontend should not independently implement sensitive business rules that belong to the backend.

17. Development Approach

Development is performed incrementally.

Frontend and backend development can proceed simultaneously using an agreed API contract.

Requirements
     ↓
Feature Definition
     ↓
API Contract
     ↓
┌─────────────────────┬─────────────────────┐
│                     │                     │
▼                     ▼                     │
Backend Development   Frontend Development │
│                     │                     │
└──────────────┬──────┴─────────────────────┘
               ▼
          Integration
               ↓
            Testing
               ↓
             Review
               ↓
         Documentation

The API contract acts as the bridge between frontend and backend development.

18. Development Milestones

Milestone 1 — Project Foundation

Repository setup

Backend initialization

Frontend initialization

Environment configuration

Database configuration

Basic project structure

Initial API setup

Milestone 2 — Authentication and RBAC

Login

Session management

Protected routes

Student role

Admin role

Backend authorization

Milestone 3 — Wellness Assessments

PHQ-9

GAD-7

Assessment validation

Consent requirements

Assessment submission

Assessment persistence

Assessment history

Milestone 4 — Student Wellness Features

Student dashboard

Wellness tracking

Wellness progress

Journal

Resources

Notifications

Milestone 5 — NLP and Wellness Prioritization

NLP integration

Supporting sentiment/emotional signals

Wellness prioritization logic

Appropriate system messaging

Professional validation

Milestone 6 — Privacy and Community Features

Consent

Activity tracking settings

Anonymization settings

Freedom Wall

Moderation

Privacy enforcement

Milestone 7 — Administration

Admin dashboard

User management

Resource management

Audit trail

System settings

Authorized reports/analytics

Milestone 8 — Testing and Integration

Unit testing

API testing

Frontend testing

Integration testing

Security testing

Responsive testing

Error handling

Final system integration

19. Testing Philosophy

Every major feature should be tested at appropriate levels:

Unit Test
    ↓
API / Component Test
    ↓
Integration Test
    ↓
End-to-End Test
    ↓
System Evaluation

Testing should cover both successful and unsuccessful scenarios.

Examples:

Valid submission

Invalid submission

Missing required data

Unauthorized request

Incorrect role

Expired session

Database failure

API failure

Privacy restriction

Empty data

Duplicate actions

20. Clinical and Ethical Boundary

MindCare is a software system designed to support student wellness monitoring.

It is not a medical or psychological diagnostic system.

The project must not claim that:

NLP diagnoses a condition

PHQ-9 diagnoses depression

GAD-7 diagnoses anxiety

The system replaces psychologists

Automated prioritization is equivalent to professional assessment

Psychologically sensitive functionality must be supported by:

Appropriate literature

Validated instruments

Ethical requirements

Professional expert review

Institutional guidance

Approved project requirements

21. Professional Validation

Because MindCare contains psychologically sensitive features, appropriate components should undergo professional review.

Potential areas for validation include:

PHQ-9 implementation

GAD-7 implementation

Assessment presentation

NLP-assisted analysis/presentation

Wellness prioritization rules

Student-facing wellness messaging

Privacy-related wellness settings

Freedom Wall safety considerations

Wellness resources

UI/UX elements relevant to student wellness

The professional's role is to evaluate whether the proposed features and presentation are appropriate within the intended context.

Developers should not independently claim clinical validity.

22. Privacy-by-Design Principles

MindCare follows a privacy-conscious design approach.

Important principles include:

Collect only necessary information

Obtain appropriate consent

Restrict access according to role

Protect sensitive records

Avoid exposing private information unnecessarily

Maintain appropriate audit records

Provide understandable privacy settings

Apply privacy rules at the backend

Avoid unnecessary sensitive information in logs

The system should be developed consistently with applicable institutional and legal privacy requirements.

23. What MindCare Is Trying to Achieve

At its core, MindCare connects several parts of student wellness support into one organized system:

                    STUDENT
                       │
                       ▼
                Wellness Check-in
                       │
              ┌────────┴────────┐
              ▼                 ▼
          PHQ-9 / GAD-7      Journal
              │                 │
              └────────┬────────┘
                       ▼
              Supporting System
                  Processing
                       │
                       ▼
             Wellness Prioritization
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Resources       Support Pathway
              │                 │
              └────────┬────────┘
                       ▼
              PROFESSIONAL SUPPORT

The goal is not to automate mental healthcare.

The goal is to create a structured digital support environment where students can monitor their wellness, reflect on their experiences, access appropriate resources, and more easily find professional support.

24. Project Success

The project should ultimately demonstrate that the proposed system can:

Provide an accessible student wellness interface.

Correctly process supported assessment instruments.

Securely manage student information.

Enforce appropriate user roles.

Provide useful wellness monitoring features.

Present NLP/system-generated information responsibly.

Provide wellness prioritization without diagnosing students.

Provide privacy and consent controls.

Provide access to wellness resources and professional support.

Maintain appropriate technical quality through software testing.

Address the needs identified during the study and validation process.

25. Current Scope

The primary scope is:

PUP Santa Maria Campus student wellness monitoring and support.

The project is not currently intended to be a general-purpose commercial mental health platform.

Potential future scalability may be discussed separately, but should not unnecessarily expand the current capstone scope.

26. Out of Scope

The following are outside the core responsibility of MindCare:

Medical diagnosis

Psychological diagnosis

Automated treatment decisions

Replacing psychologists

Emergency response replacement

Independent clinical decision-making by NLP

Unvalidated clinical scoring

Full counselor case-management system

Unapproved collection of sensitive information

27. Team Development Rules

All developers should:

Follow the approved architecture

Coordinate before changing API contracts

Avoid unnecessary dependencies

Keep secrets out of source code

Write tests for new functionality

Document major changes

Use feature branches

Submit meaningful commits

Review changes before merging

Avoid unnecessary feature creep

28. Git Workflow

Recommended structure:

main
  │
  └── develop
       │
       ├── feature/auth
       ├── feature/assessments
       ├── feature/journal
       ├── feature/privacy
       ├── feature/freedom-wall
       └── feature/admin

Example feature commit:

feat(assessment): implement PHQ-9 submission workflow

Example frontend commit:

feat(frontend): add student wellness dashboard

Example bug fix:

fix(auth): handle expired access token

29. Documentation

The project should maintain documentation for:

System architecture

Database/ERD

API contracts

Use cases

System requirements

Test cases

Development progress

Expert validation

Known limitations

Technical documentation should remain synchronized with the actual implementation.

30. Project Principles

1. Student-Centered

The system should be understandable, accessible, and useful to students.

2. Privacy-Conscious

Sensitive wellness information should be handled carefully.

3. Professionally Informed

Psychologically sensitive features should be reviewed by appropriate professionals.

4. Technically Structured

The system should follow clear software architecture, development, and testing practices.

5. Non-Diagnostic

The system supports monitoring, awareness, resource access, and support pathways; it does not replace professional assessment or diagnosis.

31. Final System Vision

The long-term vision of MindCare is to provide PUP Santa Maria students with a centralized digital environment where wellness monitoring, self-reflection, resources, privacy controls, and professional support pathways are brought together in one system.

MindCare aims to make wellness-related support:

More accessible. More organized. More privacy-conscious. And easier to navigate.

32. Project Status

Current Stage: Capstone development / prototype implementation.

The system is undergoing iterative development, technical testing, and professional validation.

Features may be revised based on:

Adviser feedback

Defense panel recommendations

Professional validation

Ethical requirements

Technical testing

Student needs analysis

System evaluation

33. Quick Reference

Area

Technology / Approach

Project

MindCare

Institution

PUP Santa Maria Campus

Frontend

React + TypeScript + Vite

Styling

Tailwind CSS

Backend

Python + FastAPI

Database

Supabase-hosted PostgreSQL

ORM

SQLAlchemy

API

REST / JSON

Assessment

PHQ-9 / GAD-7

Journal Analysis

NLP-assisted supporting analysis

Authorization

RBAC

Testing

Pytest + frontend testing tools

Email

SMTP

Architecture

Proposed 3-Tier Architecture

Primary User

Student

Administrative User

Admin

Professional Support

Psychologist / appropriate professional pathway

34. Summary

MindCare is a proposed web-based mental wellness monitoring and student support system for PUP Santa Maria Campus.

It brings together:

Wellness tracking

PHQ-9

GAD-7

Journaling

NLP-assisted supporting analysis

Wellness prioritization

Wellness progress

Wellness resources

Freedom Wall

Notifications

Privacy and consent controls

RBAC

Administrative management

Audit logging

Professional support pathways

The central objective of MindCare is not to automate mental healthcare.

Instead, MindCare aims to provide students with a structured, accessible, privacy-conscious digital tool for wellness awareness and support, while maintaining a clear boundary between software-assisted monitoring and professional mental health care.