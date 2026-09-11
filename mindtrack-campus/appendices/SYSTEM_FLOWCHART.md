# MindTrack Campus System Flowchart

**Project:** MindTrack Campus - A Web-Based Mental Wellness Monitoring and Student Support System

The flowchart shows the common application lifecycle and the principal Student/Admin branches.

```mermaid
flowchart TD
    Start([Open MindTrack Campus]) --> Session{Valid session token?}
    Session -->|No| Login[Display login / registration]
    Login --> Credentials{Credentials valid?}
    Credentials -->|No| LoginError[Show non-sensitive error\nand apply rate-limit policy]
    LoginError --> Login
    Credentials -->|Yes| AuthSession[Create authenticated frontend session]
    Session -->|Yes| AuthSession
    AuthSession --> Me[Request current user profile and role]
    Me --> Role{Role?}

    Role -->|Student| StudentShell[Load protected Student routes]
    Role -->|Admin| AdminShell[Load protected Admin routes]
    Role -->|Unknown / denied| Denied[Show access denied and clear session]

    StudentShell --> StudentAction{Choose Student action}
    StudentAction -->|Dashboard| Dashboard[Request wellness summary,\nassessment summary, resources, notifications]
    StudentAction -->|PHQ-9 or GAD-7| Assessment[Render approved questions]
    Assessment --> Complete{Required responses complete?}
    Complete -->|No| Validation[Show field validation]
    Validation --> Assessment
    Complete -->|Yes| SubmitAssessment[POST responses to FastAPI]
    SubmitAssessment --> AssessmentResult{Backend response successful?}
    AssessmentResult -->|No| ApiError[Show recoverable API error]
    ApiError --> StudentAction
    AssessmentResult -->|Yes| ShowResult[Display backend score and\nnon-diagnostic result]
    ShowResult --> StudentAction

    StudentAction -->|Journal| Journal[Create, view, edit, or delete own journal]
    Journal --> JournalSubmit[Send journal request to FastAPI]
    JournalSubmit --> JournalProcess[Validate ownership and persist entry\nthen run assistive NLP]
    JournalProcess --> JournalView[Display content separately from\nsystem-generated analysis]
    JournalView --> StudentAction

    StudentAction -->|Wellness tracking| Wellness[Submit or view mood and wellness entries]
    Wellness --> PrivacyCheck{Privacy settings permit\nrequested activity?}
    PrivacyCheck -->|No| Private[Return privacy-safe or restricted view]
    PrivacyCheck -->|Yes| Trends[Return wellness trends and summaries]
    Private --> StudentAction
    Trends --> StudentAction

    StudentAction -->|Resources / Freedom Wall / Notifications| Community[Request community and support data]
    Community --> CommunityAction{Action allowed and valid?}
    CommunityAction -->|No| ApiError
    CommunityAction -->|Yes| CommunityResult[Return resources, posts, notifications,\nor confirmation]
    CommunityResult --> StudentAction

    StudentAction -->|Privacy / consent / support| Settings[Read or update privacy, consent,\nor professional support pathway]
    Settings --> SettingsResult[Persist change or return approved support content]
    SettingsResult --> StudentAction

    AdminShell --> AdminAction{Choose Admin action}
    AdminAction -->|Manage resources| Resources[Create, update, or deactivate resources]
    AdminAction -->|Moderate Freedom Wall| Moderation[Review reports and update moderation status]
    AdminAction -->|Audit logs| Audit[Read authorized audit events]
    AdminAction -->|System view| AdminDashboard[Display permitted system analytics]
    Resources --> AdminCheck{Admin authorization succeeds?}
    Moderation --> AdminCheck
    Audit --> AdminCheck
    AdminDashboard --> AdminCheck
    AdminCheck -->|No| AdminDenied[Return 403 and show access denied]
    AdminCheck -->|Yes| AdminResult[Persist action or return permitted data]
    AdminResult --> AdminAction
    AdminDenied --> AdminAction

    StudentAction --> Logout[Logout]
    AdminAction --> Logout
    Logout --> Clear[Clear client session and return to login]
    Clear --> End([Session ended])

    classDef start fill:#e8f1f8,stroke:#236b8e,color:#102a43
    classDef decision fill:#fff4d6,stroke:#b7791f,color:#5f370e
    classDef action fill:#e9f7ef,stroke:#2f855a,color:#1c4532
    classDef error fill:#fde8e8,stroke:#c53030,color:#63171b
    classDef end fill:#f5e8f7,stroke:#805ad5,color:#44337a
    class Start,End start
    class Session,Credentials,Role,Complete,AssessmentResult,PrivacyCheck,CommunityAction,AdminCheck decision
    class Login,AuthSession,Me,StudentShell,AdminShell,Assessment,SubmitAssessment,ShowResult,Journal,JournalSubmit,JournalProcess,JournalView,Wellness,Private,Trends,Community,CommunityResult,Settings,SettingsResult,AdminAction,Resources,Moderation,Audit,AdminDashboard,AdminResult,Logout,Clear action
    class LoginError,ApiError,Denied,AdminDenied,Validation error
```

## Flow Notes

- The frontend loads protected routes after authentication, but every sensitive request is authorized again by FastAPI.
- Assessment responses are validated by the frontend and scored authoritatively by the backend.
- Journal analysis is displayed as system-generated, non-diagnostic metadata and is kept distinct from user-written content.
- Privacy settings control what activity can be tracked or included in aggregate views; the backend enforces the result.
- The Admin branch covers resources, Freedom Wall moderation, audit logs, and permitted system views. It does not provide unrestricted access to private student journals.
- The professional support feature is a student-facing contact or support pathway, not a counselor dashboard.

## Implementation Traceability

| Flow area | Main backend owner |
|---|---|
| Authentication and current user | `backend/app/api/routes/auth.py` and `backend/app/security/` |
| Assessments | `backend/app/api/routes/assessments.py`, `gad7.py`, and assessment services |
| Journals and NLP | `backend/app/api/routes/journals.py` and `backend/app/nlp/` |
| Wellness | `backend/app/api/routes/wellness.py` and `wellness_checkins.py` |
| Privacy and consent | `backend/app/api/routes/privacy.py`, `consent.py`, and security gates |
| Community and notifications | `resources.py`, `mantra_wall.py`, and `notifications.py` |
| Admin audit access | `audit_logs.py` and audit-log services |
