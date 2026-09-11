# MindTrack Campus Data Flow Diagram (DFD)

**Project:** MindTrack Campus - A Web-Based Mental Wellness Monitoring and Student Support System

This is a logical Level 1 DFD. External entities are rectangles, processes are rounded nodes, and data stores are database cylinders.

```mermaid
flowchart LR
    Student[Student]
    Admin[Admin]
    AuthProvider[Supabase Auth]
    Professional[Psychologist / Professional\nsupport pathway]

    P1([1.0 Authenticate and establish session])
    P2([2.0 Validate request and enforce\nconsent, ownership, and RBAC])
    P3([3.0 Process assessments\nPHQ-9 and GAD-7])
    P4([4.0 Process journals and\nassistive NLP metadata])
    P5([5.0 Process wellness tracking\nand privacy-aware summaries])
    P6([6.0 Serve resources, notifications,\nand Freedom Wall])
    P7([7.0 Administer moderation, resources,\nand audit review])

    D1[(D1 Profiles and roles)]
    D2[(D2 Assessments, responses, results)]
    D3[(D3 Journals and analysis)]
    D4[(D4 Wellness entries and scores)]
    D5[(D5 Privacy settings and consent)]
    D6[(D6 Resources, posts, reports, notifications)]
    D7[(D7 Audit logs)]

    Student -->|credentials / session request| P1
    Admin -->|credentials / session request| P1
    P1 <-->|identity verification and token| AuthProvider
    P1 -->|authenticated identity| P2
    P2 <-->|profile and role lookup| D1
    P2 <-->|consent and privacy state| D5
    P2 -->|authorized request| P3
    P2 -->|authorized request| P4
    P2 -->|authorized request| P5
    P2 -->|authorized request| P6
    P2 -->|authorized request| P7

    Student -->|assessment responses| P3
    P3 -->|validated submission and score| D2
    D2 -->|history and result| P3
    P3 -->|assessment result / history| Student

    Student -->|journal text and CRUD request| P4
    P4 -->|journal record| D3
    P4 -->|journal text| NLP([NLP analysis\nnon-diagnostic])
    NLP -->|sentiment / emotional-tone metadata| D3
    D3 -->|owned journal and metadata| P4
    P4 -->|journal view and analysis label| Student

    Student -->|mood / wellness entry| P5
    P5 -->|wellness record| D4
    D4 -->|trend data| P5
    P5 -->|privacy-aware summary and trends| Student

    Student -->|resource, post, report, notification request| P6
    P6 <-->|resources, posts, reports, notifications| D6
    P6 -->|community and support content| Student
    P6 -->|professional support information / request path| Professional

    Admin -->|moderation and resource actions| P7
    P7 <-->|managed resources and moderation records| D6
    P7 <-->|audit query| D7
    P7 -->|allowed administrative view| Admin

    P1 -.->|login and security event| D7
    P2 -.->|authorization, consent, privacy event| D7
    P3 -.->|assessment submission event| D7
    P4 -.->|journal create/delete event\nwithout journal content| D7
    P5 -.->|privacy-aware activity event| D7

    classDef entity fill:#e8f1f8,stroke:#236b8e,color:#102a43
    classDef process fill:#e9f7ef,stroke:#2f855a,color:#1c4532
    classDef store fill:#f5e8f7,stroke:#805ad5,color:#44337a
    class Student,Admin,AuthProvider,Professional entity
    class P1,P2,P3,P4,P5,P6,P7,NLP process
    class D1,D2,D3,D4,D5,D6,D7 store
```

## Privacy and Security Rules

- A request reaches feature processing only after authentication, consent checks where applicable, role checks, and ownership checks.
- `anonymize_activity = true` affects aggregate activity outputs by removing names, direct identifiers, and identifying dates as defined by the approved privacy policy.
- Anonymous Freedom Wall posting means anonymous to other students; it does not automatically mean anonymous to the backend or system administrators.
- Audit data describes the event and actor; it must not contain journal contents, passwords, or access tokens.
- The professional support pathway is student-facing. It is not a counselor or psychologist management dashboard.
