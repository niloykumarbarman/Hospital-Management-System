# Hospital Management System (HMS)

A full-stack Hospital Management System built with a .NET 9 Clean Architecture backend and a Next.js 16 (React 19) frontend. Covers the complete patient-care lifecycle — registration, appointments, medical records, prescriptions, lab tests, billing, and reporting.

![Status](https://img.shields.io/badge/status-active-brightgreen) ![.NET](https://img.shields.io/badge/.NET-9-512BD4) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![License](https://img.shields.io/badge/license-MIT-blue)

## Screenshots

> _Add screenshots here — e.g. `docs/screenshots/dashboard.png`_
>
> | Dashboard | Patient Management | Invoice & Billing |
> |---|---|---|
> | ![Dashboard](docs/screenshots/dashboard.png) | ![Patients](docs/screenshots/patients.png) | ![Invoice](docs/screenshots/invoice.png) |

## Tech Stack

**Backend**
- .NET 9 / ASP.NET Core Web API
- Entity Framework Core 9.0.0 — ORM, code-first migrations
- SQL Server 2022 (Docker container)
- JWT Authentication with role-based authorization
- FluentValidation — request validation
- AutoMapper 16.1.1 — DTO mapping
- Serilog — structured logging
- BCrypt.Net-Next — password hashing
- Swashbuckle (Swagger) — API documentation
- QuestPDF 2026.6.1 — PDF report generation
- ClosedXML 0.105.0 — Excel report generation
- xUnit + Moq — unit testing (57 tests)

**Frontend**
- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4
- Axios — API client
- lucide-react — icons

## Architecture

The backend follows Clean Architecture with four layers:

    HMS.Domain            Entities, Enums, Interfaces, core business rules (no dependencies)
    HMS.Application       DTOs, Services, Validators, Mapping profiles, business logic
    HMS.Infrastructure    EF Core persistence, Repositories, external services (Backup, etc.)
    HMS.API               Controllers, Middleware, API composition root
    tests/HMS.Tests        Unit tests (xUnit + Moq)

Dependency flow: API -> Application -> Domain, with Infrastructure implementing interfaces defined in Application/Domain.

The frontend is a standard Next.js App Router project, with a consistent pattern per module:

    src/types/{module}.ts                              DTOs, enums
    src/lib/{module}s.ts                                axios calls via api.ts
    src/components/{module}s/{Module}FormModal.tsx      create/edit form
    src/app/(dashboard)/{module}s/page.tsx              list page (search, CRUD, delete confirm)

## Features

### Core Modules (all CRUD, full-stack, tested)

| Module | Highlights |
|---|---|
| Auth | JWT login, role-based access (Admin/Doctor/Nurse) |
| Patient | Patient records, sequential patient codes (PT-00001 format) |
| Doctor | Doctor profiles, linked to user accounts |
| Appointment | Scheduling with double-booking conflict detection |
| Medical Record | Patient medical history, admission type tracking |
| Prescription | Dynamic medicine items, full-replace item update pattern |
| Lab Test | Two-step workflow — request, then result/completion |
| Medicine | Inventory with low-stock detection (StockQuantity <= ReorderLevel) |
| Stock Adjustment | Inbound/outbound stock movement tracking |
| Invoice | Create-only billing with dynamic items, separate payment recording, payment status tracking (Unpaid/PartiallyPaid/Paid/Refunded) |
| Report | Excel exports (patient list, appointments by date range), PDF exports (invoice receipt, patient medical history) |

### Cross-Cutting Concerns

- Global Exception Handling Middleware — consistent error responses (KeyNotFoundException -> 404, InvalidOperationException -> 400, UnauthorizedAccessException -> 403, ArgumentException -> 400, unhandled -> 500)
- Role-Based Authorization — enforced per module via role matrix
- Audit Log Middleware — automatic Create/Update/Delete tracking via AppDbContext.SaveChanges override, including soft-delete detection and sensitive field exclusion (e.g. password hashes)
- Dashboard overview — live stats (patients, doctors, today's appointments, pending invoices), recent appointments, and quick actions

### Database Backup and Restore

Since the SQL Server container has no host-mounted volume and the API runs on the Windows host (not inside the container), backup/restore works as follows:

- Backup: `BACKUP DATABASE ... TO DISK` runs inside the container's filesystem, the resulting `.bak` file is copied to the host via `docker cp`, then the in-container copy is deleted.
- Restore: an uploaded `.bak` file is copied into the container via `docker cp`, the database is set to `SINGLE_USER` mode, `RESTORE DATABASE ... WITH REPLACE` runs, database is set back to `MULTI_USER`, and EF Core's connection pool is cleared to avoid stale pooled connections.
- Filenames are validated against `^[A-Za-z0-9_-]+\.bak$` to prevent path traversal/injection.
- Docker CLI calls from the API are made via `Process.Start` with `ArgumentList` (shell-injection safe).

Endpoints (all require Admin role):

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/Backup | Create a new backup |
| GET | /api/Backup | List all backups |
| GET | /api/Backup/{fileName}/download | Download a backup file |
| POST | /api/Backup/restore | Restore from an uploaded .bak file (multipart, field name file, 2GB limit) |
| DELETE | /api/Backup/{fileName} | Delete a backup file |


## Project Structure

    HMS/
      src/
        HMS.Domain/
          Common/
          Entities/
          Enums/
          Interfaces/
        HMS.Application/
          DTOs/            (per-module DTOs)
          Interfaces/
          Mappings/
          Services/
          Validators/      (per-module FluentValidation rules)
        HMS.Infrastructure/
          Persistence/
            Configurations/
            Migrations/
          Repositories/
          Services/         (includes BackupService)
        HMS.API/
          Controllers/
          Middleware/
          Properties/
      tests/
        HMS.Tests/
          Services/         (unit tests, one file per service)
      frontend/
        src/
          app/
            (dashboard)/    (patients, doctors, appointments, medical-records,
                             prescriptions, lab-tests, medicines, invoices, reports)
            login/
            globals.css
          components/
            layout/         (DashboardShell, Sidebar, etc.)
            ui/              (Button, Input, Select, Modal, GlassCard, Textarea)
            {module}s/       (per-module FormModal components)
          lib/                (axios API clients per module)
          types/              (DTOs, enums per module)
      HMS.sln
      README.md

## Getting Started

### Prerequisites

- .NET 9 SDK
- Node.js 20+ and npm
- Docker Desktop

### 1. Start the database container

    docker ps -a --filter name=hms-sqlserver

If the container doesn't exist, create it:

    docker run -e "ACCEPT_EULA=Y" -e "MSSQLSA_PASSWORD=HmsStrong@Pass123" -p 1433:1433 --name hms-sqlserver -d mcr.microsoft.com/mssql/server:2022-latest

If it exists but is stopped:

    docker start hms-sqlserver

On Windows/Git Bash, prefix Docker commands with `MSYS_NO_PATHCONV=1` to avoid path mangling.

### 2. Apply migrations

    dotnet ef database update --project src/HMS.Infrastructure --startup-project src/HMS.API

### 3. Run the backend API

    dotnet run --project src/HMS.API

API available at: http://localhost:5004
Swagger UI: http://localhost:5004/swagger

### 4. Run the frontend

    cd frontend
    npm install
    npm run dev

Frontend available at: http://localhost:3000

### 5. Run backend tests

    dotnet test tests/HMS.Tests/HMS.Tests.csproj

Current status: 57 tests, 0 failed.

## Test Users

| Email | Password | Role |
|---|---|---|
| admin@hms.com | Admin@123 | Admin |
| doctor@hms.com | Doctor@123 | Doctor |

## Known Gotchas

- Windows/Git Bash file uploads: `curl -F "file=@..."` with an MSYS-style path (`/e/...`) fails silently with "curl: (26) Failed to open/read local data from file/application". Use the native Windows path format instead (e.g. `E:/HMS_DB_Backups/file.bak`).
- Soft-delete + unique indexes: fields like PatientCode, Doctor.UserId, and InvoiceNumber require `IgnoreQueryFilters` in relevant queries to correctly handle uniqueness against soft-deleted records.
- File locks during rebuild: if `dotnet run` is active, a subsequent `dotnet build`/`dotnet run` will fail with a file lock error. Stop the running process first.

## Roadmap

- [x] Core CRUD modules + Auth + Authorization
- [x] Audit logging
- [x] Unit test suite
- [x] Database backup and restore
- [x] React/Next.js frontend (all 9 modules)
- [x] Dashboard with live stats, recent activity, and quick actions
- [x] Resolve EF soft-delete query filter warning (added matching filter on PrescriptionItem)
- [ ] Role-based UI restriction (hide/show actions per role on the frontend)

## Author

**Niloy Kumar Barman**
Full-stack Developer

- GitHub: [@niloykumarbarman](https://github.com/niloykumarbarman)
- Repository: [Hospital-Management-System](https://github.com/niloykumarbarman/Hospital-Management-System)


## License

MIT
