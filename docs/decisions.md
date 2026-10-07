# End Credits — Architecture Decisions

## ADR-001: Phase 1 uses a modular monolith

### Problem

End Credits needs its first real product capabilities: authentication, movie discovery, and watch tracking. The project could introduce separate services, caches, event streaming, or AI infrastructure immediately, but doing so would add operational complexity before those tools solve a demonstrated problem.

### Initial approach

Start with one Angular frontend, one Spring Boot backend, PostgreSQL for End Credits-owned data, and TMDB as the external movie metadata provider.

### Chosen approach

Phase 1 will use:

```text
Angular → Spring Boot → PostgreSQL
             ↓
            TMDB
```

Spring Boot remains a single deployable application, organized into clear feature packages as the codebase grows. Only Spring Boot calls TMDB and only Spring Boot connects to PostgreSQL.

### Why

- It is the smallest architecture that supports all Phase 1 requirements.
- It keeps authentication, authorization, validation, and external API secrets on the backend.
- It lets us learn end-to-end data flow before introducing distributed-system concerns.
- PostgreSQL is appropriate for the relational ownership and history data End Credits needs.

### Alternatives considered

- **Microservices:** rejected for now because independent deployment, networking, observability, and data-consistency concerns would slow learning without a current need.
- **Python recommendation service:** rejected for now because Phase 1 has no recommendation-model requirement.
- **Redis:** rejected for now because we have not measured a caching or temporary-state problem.
- **Kafka:** rejected for now because no independent asynchronous consumers exist yet.
- **Direct Angular-to-TMDB or Angular-to-PostgreSQL access:** rejected because it would expose secrets, bypass validation, and weaken authorization control.

### Tradeoffs

The Spring Boot application will contain more responsibilities initially. We will mitigate that by keeping feature boundaries clear and adding automated tests. We may revisit service boundaries when independent scaling, deployment, or ownership needs are demonstrated.

### When we might reconsider

Reconsider this decision when a specific measured need appears, such as expensive repeated metadata reads, independently evolving recommendation workloads, real-time fan-out, or multiple event consumers.

## ADR-002: Database schema changes use Flyway migrations

### Problem

End Credits needs database changes that are repeatable across developer machines, tests, and future deployments. Hibernate schema auto-update can make unreviewed changes or leave environments with different histories.

### Chosen approach

Use versioned Flyway SQL migrations in `src/main/resources/db/migration`. Spring Boot runs each unapplied migration on startup. Hibernate remains configured with `ddl-auto=validate`.

### Why

- The SQL schema history is version-controlled and reviewable.
- A migration runs once and is recorded in Flyway's history table.
- Database constraints remain explicit rather than inferred from Java annotations.
- Startup fails if a Java mapping and the migrated schema disagree.

### Alternatives considered

- **Hibernate `create` or `update`:** rejected because they hide schema changes and can cause environment drift.
- **Manual SQL outside the repository:** rejected because other environments cannot reliably reproduce it.
- **Liquibase:** viable alternative, but Flyway's versioned SQL files are the clearest starting point for this project.

### Tradeoffs

Developers must write and review migration SQL. Applied migrations should not be edited; a later change uses a new versioned migration.

## ADR-003: Phase 1 authentication uses server-side sessions in HTTP-only cookies

### Problem

End Credits needs browser authentication without exposing credentials or long-lived tokens to frontend JavaScript. The solution must support Spring Security now and leave a safe path to production hardening later.

### Chosen approach

Use Spring Security authentication with server-side sessions. The browser receives a session cookie configured as HTTP-only, secure in HTTPS production environments, and with an appropriate SameSite policy. State-changing requests will retain CSRF protection.

### Why

- JavaScript cannot read an HTTP-only cookie, reducing the impact of an XSS bug stealing a session value.
- The backend can invalidate a session immediately on logout or suspicious activity.
- It fits the current modular monolith without introducing a token service or distributed infrastructure.
- Spring Security has mature support for session authentication and CSRF defenses.

### Alternatives considered

- **JWT in localStorage:** rejected because XSS can read localStorage and exfiltrate the token.
- **JWT in an HTTP-only cookie:** viable, but still needs CSRF defenses because the browser sends cookies automatically; token invalidation and refresh design add complexity we do not currently need.
- **Bearer token held only in memory:** reduces persistent XSS exposure but complicates reload/refresh behavior and does not add value for our first authentication flow.

### Tradeoffs

Server-side sessions require server-managed session state. That is acceptable for one Spring Boot application. If future scale requires it, session storage can move to a shared database or Redis after a demonstrated need.

### When we might reconsider

Reconsider if native/mobile clients, third-party API consumers, independently deployed services, or explicit stateless-token requirements emerge.
