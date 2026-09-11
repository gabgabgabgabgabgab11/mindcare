# MindTrack Campus System Architecture Diagram

**Project:** MindTrack Campus - A Web-Based Mental Wellness Monitoring and Student Support System

**Scope:** React/Vite frontend, FastAPI REST backend, Supabase Auth/JWT validation, PostgreSQL/Supabase persistence, privacy enforcement, RBAC, audit logging, and assistive NLP.

> Frontend route guards improve usability, but backend authorization and privacy enforcement are the actual security boundary.

```mermaid
flowchart LR
    subgraph Client[Client Layer]
        Browser[Web Browser]
        React[React + TypeScript + Vite]
        Router[React Router\nprotected and role-aware routes]
        Services[Frontend service layer\nAxios or Fetch + typed API models]
        UI[Student and Admin UI\nforms, dashboards, states]
        Browser --> React
        React --> Router
        Router --> UI
        UI --> Services
    end

    subgraph Identity[Identity and Access]
        Auth[Supabase Auth\nidentity provider]
        Token[Access token / JWT]
    end

    subgraph API[Application Layer - FastAPI]
        Gateway[REST API /api/v1\nCORS, validation, error envelope, rate limiting]
        AuthRoutes[Auth and current-user routes]
        StudentRoutes[Student routes\nassessments, journals, wellness, privacy, consent]
        CommunityRoutes[Resources, Freedom Wall, notifications]
        AdminRoutes[Admin routes\nresources, moderation, audit logs]
        Security[Security dependencies\nJWT verification, RBAC, ownership, consent gates]
        ServicesLayer[Domain services and repositories\nscoring, wellness prioritization, persistence]
        NLP[NLP module\npreprocessing, sentiment/emotional tone]
    end

    subgraph Data[Persistence Layer]
        DB[(PostgreSQL / Supabase)]
        Profiles[(Profiles and roles)]
        Assessments[(Assessments and responses)]
        Journals[(Journals and analysis metadata)]
        Wellness[(Wellness check-ins and scores)]
        Privacy[(Privacy settings and consent)]
        Community[(Resources, posts, reports, notifications)]
        Audit[(Audit logs)]
        DB --- Profiles
        DB --- Assessments
        DB --- Journals
        DB --- Wellness
        DB --- Privacy
        DB --- Community
        DB --- Audit
    end

    Browser -. sign in / refresh session .-> Auth
    Auth -. token .-> Token
    Token -. Authorization header .-> Services
    Services -->|HTTPS REST requests| Gateway
    Gateway --> AuthRoutes
    Gateway --> StudentRoutes
    Gateway --> CommunityRoutes
    Gateway --> AdminRoutes
    AuthRoutes --> Security
    StudentRoutes --> Security
    CommunityRoutes --> Security
    AdminRoutes --> Security
    Security --> ServicesLayer
    ServicesLayer --> NLP
    ServicesLayer -->|SQLAlchemy / database access| DB
    DB --> ServicesLayer
    ServicesLayer --> Gateway
    Gateway -->|JSON responses and errors| Services

    classDef client fill:#e8f1f8,stroke:#236b8e,color:#102a43
    classDef security fill:#fff4d6,stroke:#b7791f,color:#5f370e
    classDef app fill:#e9f7ef,stroke:#2f855a,color:#1c4532
    classDef data fill:#f5e8f7,stroke:#805ad5,color:#44337a
    class Browser,React,Router,Services,UI client
    class Auth,Token,Security security
    class Gateway,AuthRoutes,StudentRoutes,CommunityRoutes,AdminRoutes,ServicesLayer,NLP app
    class DB,Profiles,Assessments,Journals,Wellness,Privacy,Community,Audit data
```

## Architecture Notes

- The frontend communicates with versioned FastAPI endpoints through a service layer; it does not connect directly to PostgreSQL/Supabase.
- FastAPI validates the identity token, resolves the profile and role, and applies authorization dependencies.
- Student-owned data, especially journals and assessments, is filtered by authenticated ownership. Admin access is explicit per endpoint and is not unrestricted access to private journals.
- PHQ-9 and GAD-7 scoring is performed by the backend using approved instrument data. The frontend collects responses and renders the returned result.
- Journal NLP is assistive metadata only and must not be represented as a diagnosis or clinical decision.
- Audit logs capture security and administrative events without storing passwords, tokens, or journal contents.
