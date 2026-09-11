# PROMPT: GENERATE FRONTEND MEMBER DEVELOPMENT GUIDELINE DOCUMENT

Act as a Senior Software Engineer, Senior React Developer, UI/UX Engineer, and Technical Project Manager.

We are developing our capstone project:

**MindTrack Campus — A Web-Based Mental Wellness Monitoring and Student Support System**

I need you to create a **professional DOCX-ready Frontend Development Guideline** intended specifically for ONE member of our development team who is assigned to the frontend.

The document is an internal technical task guide. It should clearly tell the frontend member:

- What they are responsible for
- What they need to build
- What technologies to use
- What pages to create
- What components to create
- How the frontend should connect to the backend
- What standards/metrics they must follow
- How to test their work
- What they need to document
- What they need to submit at the end of each development session
- What qualifies as "complete"

DO NOT generate the frontend code.

DO NOT generate the actual React project.

Generate the **instructional document/guideline only**.

---

# PROJECT CONTEXT

The current proposed system includes:

### Student Features

- Student Dashboard
- Wellness/Mood Tracking
- PHQ-9 Assessment
- GAD-7 Assessment
- Assessment History
- Journal
- Wellness Insights/Progress
- Wellness Resources
- Freedom Wall
- Notifications
- Privacy Settings
- Consent
- Professional/Psychologist Contact or Support Page

### Privacy Settings

The student should have controls such as:

**Allow Activity Tracking**

and

**Anonymize My Activity**

with the explanation:

> Hide your name and dates — only overall wellness scores are shared.

The backend remains responsible for enforcing the actual privacy rules.

### Current System Direction

The previous Counselor dashboard/page has been removed from the proposed system.

Instead, the system should provide a student-facing pathway to a psychologist/professional contact or support page.

Do NOT instruct the frontend member to build a full Counselor Dashboard unless explicitly requested later.

### User Roles

- Student
- Admin

RBAC must be reflected in the frontend through protected routes and appropriate UI access.

Remember:

**Frontend route protection is NOT the actual security boundary.**

The backend must enforce authorization.

---

# EXPECTED TECHNOLOGY STACK

Use the following unless the existing project already specifies otherwise:

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios or Fetch API

Use additional libraries only when justified.

Do not introduce unnecessary dependencies.

### Backend

- FastAPI

### Database

- PostgreSQL / Supabase

The frontend should communicate with the backend through documented REST APIs.

---

# DOCUMENT TITLE

Create the document with the title:

# FRONTEND DEVELOPMENT GUIDELINE
## MindTrack Campus

Include:

- Project Name
- Document Purpose
- Intended Developer
- Frontend Responsibility
- Technology Stack
- Development Workflow
- Feature Requirements
- UI/UX Standards
- API Integration Requirements
- Security Requirements
- Testing Requirements
- Documentation Requirements
- Definition of Done
- Handoff Requirements

---

# SECTION 1 — PURPOSE OF THE DOCUMENT

Explain that this document serves as the frontend member's official development guide.

The purpose is to ensure that the frontend:

- Matches the approved system requirements
- Matches the use case model
- Matches the proposed architecture
- Properly integrates with FastAPI
- Maintains consistent UI/UX
- Implements privacy controls correctly
- Supports RBAC
- Is responsive
- Is accessible
- Is testable
- Is documented

---

# SECTION 2 — FRONTEND MEMBER RESPONSIBILITIES

Clearly list the responsibilities.

The frontend member is responsible for:

1. React application structure
2. Page development
3. Component development
4. UI implementation
5. Navigation
6. Forms
7. Client-side validation
8. API integration
9. Authentication state
10. Protected routes
11. Role-aware UI
12. Privacy settings interface
13. Responsive design
14. Accessibility
15. Loading states
16. Error states
17. Empty states
18. Frontend testing
19. Documentation
20. Integration with the backend

Clearly state what they are NOT responsible for.

They should NOT:

- Modify the database schema without coordination
- Implement clinical scoring independently
- Invent PHQ-9/GAD-7 scoring
- Invent clinical thresholds
- Create diagnoses
- Independently determine clinical meaning of NLP results
- Place backend secrets in the frontend
- Change API contracts without coordinating with the backend member

---

# SECTION 3 — FRONTEND TECHNOLOGY REQUIREMENTS

Provide a table:

| Technology | Purpose | Requirement |
|---|---|---|
| React | UI framework | Required |
| TypeScript | Type safety | Required |
| Vite | Development/build tool | Required |
| Tailwind CSS | Styling | Recommended |
| React Router | Routing | Required |
| Axios/Fetch | API communication | Required |
| Vitest | Unit/component testing | Recommended |
| React Testing Library | Component testing | Recommended |
| Playwright | E2E testing | If required |

Explain why each is used.

---

# SECTION 4 — FRONTEND PROJECT STRUCTURE

Provide the recommended folder structure.

Example:

frontend/

src/

components/

pages/

services/

hooks/

contexts/

routes/

types/

utils/

assets/

config/

tests/

Explain the purpose of each folder.

Do not over-engineer the structure.

---

# SECTION 5 — PAGE-BY-PAGE DEVELOPMENT TASKS

Create a detailed table for each page.

Columns:

| Page | Purpose | Main UI Elements | Backend Integration | Priority |
|---|---|---|---|---|

Include:

### Authentication

- Login
- Registration if applicable
- Password recovery if applicable

### Student

- Dashboard
- Wellness Tracking
- PHQ-9
- GAD-7
- Assessment History
- Journal
- Wellness Insights
- Resources
- Freedom Wall
- Notifications
- Privacy Settings
- Consent
- Professional/Psychologist Contact

### Admin

- Admin Dashboard
- User Management
- Resource Management
- Freedom Wall Moderation
- Audit Logs
- System Settings

Do NOT include a Counselor Dashboard.

---

# SECTION 6 — COMPONENT REQUIREMENTS

Define reusable components that should be created.

Examples:

- Button
- Input
- Select
- Checkbox
- Radio Button
- Card
- Modal
- Alert
- Badge
- Navigation
- Sidebar
- Header
- Loading Indicator
- Empty State
- Error State
- Confirmation Dialog
- Assessment Question
- Assessment Progress
- Journal Card
- Resource Card
- Freedom Wall Post

Explain that reusable components should be created instead of duplicating UI code.

---

# SECTION 7 — STUDENT DASHBOARD REQUIREMENTS

Give specific instructions for the Student Dashboard.

It should provide access to:

- Current wellness information
- Assessment summary
- Wellness progress
- Recent activity where permitted
- Recommended resources
- Notifications
- Quick actions

The dashboard must NOT expose information that the student's privacy settings prohibit.

---

# SECTION 8 — PHQ-9 AND GAD-7 FRONTEND REQUIREMENTS

Explain how the frontend should handle the assessments.

Workflow:

Student opens assessment

↓

Questions displayed

↓

Student selects responses

↓

Frontend validates required fields

↓

Frontend sends responses to FastAPI

↓

Backend performs scoring

↓

Backend returns result

↓

Frontend displays result

IMPORTANT:

The frontend must NOT become the authoritative scoring engine.

Do not independently invent or modify scoring logic.

The exact validated instrument wording must be used according to the approved project materials.

---

# SECTION 9 — JOURNAL FRONTEND REQUIREMENTS

Define requirements for:

- Create
- View
- Edit
- Delete
- History
- Privacy indication

Explain that journal entries are sensitive information.

The UI should clearly communicate privacy.

If NLP analysis is displayed:

Clearly distinguish:

**User-generated journal content**

from

**System-generated analysis**

Do not present NLP results as a diagnosis.

---

# SECTION 10 — WELLNESS INSIGHTS

Explain how wellness information should be presented.

Use:

- Trends
- Summaries
- Progress
- Non-diagnostic language

Do not display statements such as:

"You have depression."

Instead, use neutral system language approved by the project/expert validation.

The frontend should display backend-provided results rather than inventing clinical interpretations.

---

# SECTION 11 — PRIVACY AND SETTINGS

Provide detailed instructions for:

### Allow Activity Tracking

### Anonymize My Activity

Explain:

- What the toggle does
- How the UI communicates its current state
- How changes are saved
- Success feedback
- Error handling
- Privacy explanation

Example:

**Anonymize My Activity**

> Hide your name and dates — only overall wellness scores are shared.

Emphasize that frontend controls are not the security boundary.

---

# SECTION 12 — FREEDOM WALL

Provide detailed frontend instructions.

Include:

- Post feed
- Create post
- Anonymous posting
- Community guidelines
- Reporting
- Moderation status where appropriate
- Character limits
- Empty state
- Loading state
- Error state

Include instructions for safely rendering user-generated content.

Do not use unsafe HTML rendering unless properly sanitized.

---

# SECTION 13 — RESOURCES

Provide requirements for:

- Resource listing
- Categories
- Search
- Filtering
- Resource details
- Professional support resources

Resources should preferably come from the backend/API rather than being duplicated throughout the frontend.

---

# SECTION 14 — PROFESSIONAL SUPPORT PAGE

Because the Counselor Dashboard has been removed, define the student-facing professional support page.

It may contain:

- Psychologist information
- Professional contact details
- Office/contact information
- Appointment/request pathway if approved
- Support resources

Do not create a simulated counselor management dashboard.

---

# SECTION 15 — NOTIFICATIONS

Define:

- Notification list
- Read/unread state
- Mark as read
- Empty state
- Loading state
- Error state

Avoid unnecessarily exposing sensitive information in notification previews.

---

# SECTION 16 — ADMIN FRONTEND

Define the Admin interface.

Include:

- Dashboard
- User Management
- Resource Management
- Freedom Wall Moderation
- Audit Logs
- System Settings

Explain which pages require Admin role.

---

# SECTION 17 — RBAC AND ROUTE PROTECTION

Explain:

Student:

→ Student routes

Admin:

→ Admin routes

Unauthorized users:

→ Access denied / redirect

However:

Frontend route protection does not replace backend authorization.

Provide an example route structure.

---

# SECTION 18 — API INTEGRATION

Explain how the frontend should communicate with FastAPI.

Create a service layer.

Example:

services/

authService.ts

assessmentService.ts

journalService.ts

wellnessService.ts

privacyService.ts

resourceService.ts

freedomWallService.ts

notificationService.ts

adminService.ts

Explain:

- Request
- Response
- Authentication
- Error handling
- TypeScript types

The frontend developer must verify the actual backend API contract before integration.

---

# SECTION 19 — API CONTRACT REQUIREMENTS

Create an API integration checklist.

For every endpoint:

[ ] Method confirmed

[ ] URL confirmed

[ ] Authentication requirement confirmed

[ ] Role requirement confirmed

[ ] Request schema confirmed

[ ] Response schema confirmed

[ ] Error responses confirmed

[ ] TypeScript type created

[ ] Service function created

[ ] UI integrated

[ ] Success tested

[ ] Failure tested

---

# SECTION 20 — UI/UX STANDARDS

Provide measurable guidelines for:

### Responsiveness

Test at:

- 360px
- 768px
- 1024px
- 1440px

### Accessibility

- Keyboard navigation
- Labels
- Focus states
- Contrast
- Semantic HTML
- Accessible controls

### Consistency

Use consistent:

- Typography
- Spacing
- Buttons
- Cards
- Forms
- Navigation
- Feedback messages

---

# SECTION 21 — PERFORMANCE METRICS

Define reasonable frontend metrics.

Include:

- Avoid unnecessary API calls
- Avoid unnecessary re-renders
- Optimize images
- Lazy-load where appropriate
- Minimize unnecessary dependencies
- Ensure production build succeeds

Use Lighthouse/browser developer tools for basic verification.

Do not invent arbitrary performance targets without justification.

---

# SECTION 22 — FRONTEND SECURITY

Include:

- No backend secrets in frontend
- Proper environment variables
- Protected routes
- Safe token handling
- Safe rendering of user content
- XSS prevention
- Input validation
- Secure logout
- No sensitive data unnecessarily stored client-side

Explicitly state:

**Frontend security controls must never replace backend authorization.**

---

# SECTION 23 — TESTING REQUIREMENTS

Define tests for:

### Authentication

- Valid login
- Invalid login
- Logout
- Session expiration

### RBAC

- Student accessing admin route
- Admin accessing admin route

### Assessments

- Complete assessment
- Missing response
- API failure

### Journal

- Create
- Edit
- Delete
- Unauthorized access

### Privacy

- Enable tracking
- Disable tracking
- Enable anonymization
- Disable anonymization

### Freedom Wall

- Create post
- Anonymous post
- Report post
- Invalid input

### Responsive UI

- Mobile
- Tablet
- Desktop

---

# SECTION 24 — FRONTEND TEST CASE DOCUMENT

Tell the developer to maintain:

`docs/FRONTEND_TEST_CASES.md`

Use:

| Test ID | Module | Scenario | Expected Result | Status |
|---|---|---|---|---|

Provide several examples.

---

# SECTION 25 — DEVELOPMENT PHASES

Divide frontend development into manageable phases.

### Phase 1
Project setup

### Phase 2
Design system and reusable components

### Phase 3
Routing and layout

### Phase 4
Authentication

### Phase 5
RBAC

### Phase 6
Student Dashboard

### Phase 7
PHQ-9

### Phase 8
GAD-7

### Phase 9
Assessment History

### Phase 10
Journal

### Phase 11
Wellness Insights

### Phase 12
Privacy and Consent

### Phase 13
Resources

### Phase 14
Freedom Wall

### Phase 15
Notifications

### Phase 16
Professional Support

### Phase 17
Admin Interface

### Phase 18
Responsive Optimization

### Phase 19
Accessibility Review

### Phase 20
Testing

### Phase 21
Backend Integration Testing

### Phase 22
Production Build

---

# SECTION 26 — FOUR FRONTEND MILESTONES

Group the phases into:

## Milestone 1 — Frontend Foundation

Includes:

- Setup
- Design system
- Components
- Routing
- Authentication
- RBAC

## Milestone 2 — Core Student Experience

Includes:

- Dashboard
- PHQ-9
- GAD-7
- Assessment history
- Journal
- Wellness

## Milestone 3 — Supporting Features

Includes:

- Privacy
- Consent
- Resources
- Freedom Wall
- Notifications
- Professional Support

## Milestone 4 — Admin + Quality Assurance

Includes:

- Admin
- Responsive testing
- Accessibility
- Integration
- Testing
- Production build

For each milestone provide:

- Objective
- Tasks
- Expected outputs
- Testing requirements
- Definition of Done

---

# SECTION 27 — DAILY DEVELOPMENT WORKFLOW

Require the frontend member to follow:

PLAN

↓

DESIGN

↓

IMPLEMENT

↓

CONNECT API

↓

TEST

↓

DEBUG

↓

RESPONSIVE CHECK

↓

ACCESSIBILITY CHECK

↓

DOCUMENT

↓

COMMIT

---

# SECTION 28 — DAILY DEVELOPMENT LOG

Require:

`docs/FRONTEND_DEVELOPMENT_LOG.md`

Each day must record:

- Date
- Milestone
- Phase
- Objective
- Completed tasks
- Pages created
- Components created
- API integrations
- Tests
- Responsive testing
- Accessibility checks
- Issues
- Resolution
- Current status
- Remaining work
- Git commit
- Next phase

---

# SECTION 29 — FRONTEND DEFINITION OF DONE

A feature is NOT complete just because the page renders.

A feature is complete only when:

[ ] UI implemented

[ ] TypeScript types created

[ ] API integrated

[ ] Authentication verified

[ ] Authorization verified

[ ] Loading state implemented

[ ] Error state implemented

[ ] Empty state implemented

[ ] Validation implemented

[ ] Responsive behavior tested

[ ] Accessibility reviewed

[ ] Security reviewed

[ ] Tests written

[ ] Tests pass

[ ] Documentation updated

[ ] Git commit created

---

# SECTION 30 — HANDOFF REQUIREMENTS

When the frontend member finishes a feature, they must provide:

1. Pages created
2. Components created
3. API endpoints used
4. Request format
5. Response format
6. Authentication requirements
7. Authorization requirements
8. Test results
9. Known issues
10. Screenshots if needed
11. Git commit
12. Remaining work

This allows another developer to continue the work without rediscovering the implementation.

---

# SECTION 31 — FRONTEND/BACKEND COORDINATION

Explain that frontend and backend developers must coordinate through:

`docs/API_CONTRACT.md`

If the frontend requires an endpoint that does not exist:

The frontend member must document:

- Required endpoint
- Method
- Purpose
- Request
- Expected response
- Why it is needed

They must NOT silently modify backend behavior.

---

# SECTION 32 — SCOPE PROTECTION

Classify requested frontend features:

### MUST HAVE

Required for the approved system.

### SHOULD HAVE

Useful but not essential.

### COULD HAVE

Optional.

### OUT OF SCOPE

Do not implement.

Explain that the frontend member should avoid feature creep.

---

# SECTION 33 — CLINICALLY SENSITIVE UI RULES

The frontend must not:

- Diagnose students
- Claim NLP produces a diagnosis
- Claim wellness scores are diagnoses
- Invent clinical thresholds
- Modify validated assessment wording
- Replace professional support
- Misrepresent anonymity
- Hide important privacy information

All clinically sensitive wording should follow the project's approved requirements and expert validation.

---

# SECTION 34 — FINAL FRONTEND CHECKLIST

Create a final checklist covering:

### Functionality

[ ] Authentication

[ ] Dashboard

[ ] PHQ-9

[ ] GAD-7

[ ] Journal

[ ] Wellness

[ ] Privacy

[ ] Consent

[ ] Resources

[ ] Freedom Wall

[ ] Notifications

[ ] Professional Support

[ ] Admin

### Technical

[ ] API Integration

[ ] TypeScript

[ ] RBAC

[ ] Error Handling

[ ] Loading States

[ ] Empty States

### UX

[ ] Mobile

[ ] Tablet

[ ] Desktop

[ ] Consistency

### Accessibility

[ ] Keyboard

[ ] Labels

[ ] Focus

[ ] Contrast

[ ] Semantic HTML

### Security

[ ] No secrets

[ ] Safe user content

[ ] Protected routes

[ ] Backend authorization verified

[ ] Sensitive data minimized

### Testing

[ ] Unit tests

[ ] Component tests

[ ] Integration tests

[ ] E2E tests where applicable

### Documentation

[ ] README

[ ] API Contract

[ ] Test Cases

[ ] Development Log

[ ] Known Limitations

---

# DOCUMENT FORMATTING REQUIREMENTS

Generate the document in a professional academic/technical style.

Use:

- Clear hierarchy of headings
- Numbered sections
- Tables where appropriate
- Checklists
- Consistent terminology
- Professional language
- Concise but sufficiently detailed explanations

Do NOT make the document overly decorative.

It should look like an actual internal **Software Development Technical Guideline**.

Include:

- Cover page
- Table of Contents placeholder
- Main sections
- Checklists
- Tables
- Final sign-off section

Add a final section:

# FRONTEND MEMBER ACKNOWLEDGMENT

Name: ______________________________

Role: Frontend Developer

Date: ______________________________

Signature: _________________________

I acknowledge that I have reviewed and understood the frontend development requirements, testing standards, documentation requirements, and Definition of Done specified in this guideline.

Signature: _________________________

---

# FINAL OUTPUT

Generate the complete document content suitable for conversion into a **DOCX file**.

The document should be approximately **15–25 pages**, depending on formatting.

Do NOT generate frontend source code.

This document is intended to be handed directly to the frontend member as their development instruction manual.