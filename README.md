# Hospital Management System (HMS) - Backend API

A backend system for managing hospital operations, built with ASP.NET Core (.NET 9) following Clean Architecture principles.

## Tech Stack

- .NET 9 / ASP.NET Core Web API
- Entity Framework Core 9.0.0 - ORM, code-first migrations
- SQL Server 2022 (Docker container)
- JWT Authentication with role-based authorization
- FluentValidation - request validation
- AutoMapper 16.1.1 - DTO mapping
- Serilog - structured logging
- BCrypt.Net-Next - password hashing
- Swashbuckle (Swagger) - API documentation
- QuestPDF 2026.6.1 - PDF report generation
- ClosedXML 0.105.0 - Excel report generation
- Microsoft.Data.SqlClient - used for database backup/restore operations

## Architecture

The solution follows Clean Architecture with four layers:

    HMS.Domain            Entities, Enums, Interfaces, core business rules (no dependencies)
    HMS.Application       DTOs, Services, Validators, Mapping profiles, business logic
    HMS.Infrastructure    EF Core persistence, Repositories, external services (Backup, etc.)
    HMS.API               Controllers, Middleware, API composition root
    tests/HMS.Tests       Unit tests (xUnit + Moq)

Dependency flow: API -> Application -> Domain, with Infrastructure implementing interfaces defined in Application/Domain.

## Features

### Core Modules (all CRUD, tested)

- Auth - JWT login, role-based access
- Patient - patient records, sequential patient codes (PT-00001 format)
- Doctor - doctor profiles
- Appointment - scheduling with double-booking conflict detection
- MedicalRecord - patient medical history
- Prescription - prescriptions with full-replace item update pattern
- LabTest - lab test orders and results
- Medicine - inventory with low-stock detection (StockQuantity <= ReorderLevel)
- StockAdjustment - inbound/outbound stock movement tracking
- Invoice - billing with payment logic
- Report - PDF and Excel export

### Cross-Cutting Concerns

- Global Exception Handling Middleware - consistent error responses
  (KeyNotFoundException -> 404, InvalidOperationException -> 400, UnauthorizedAccessException -> 403, ArgumentException -> 400, unhandled -> 500)
- Role-Based Authorization - enforced per module via role matrix
- Audit Log Middleware - automatic Create/Update/Delete tracking via AppDbContext.SaveChanges override, including soft-delete detection and sensitive field exclusion (e.g. password hashes)

### Database Backup and Restore

Since the SQL Server container has no host-mounted volume and the API runs on the Windows host (not inside the container), backup/restore works as follows:

- Backup: BACKUP DATABASE ... TO DISK runs inside the container's filesystem, the resulting .bak file is copied to the host via docker cp, then the in-container copy is deleted.
- Restore: an uploaded .bak file is copied into the container via docker cp, the database is set to SINGLE_USER mode, RESTORE DATABASE ... WITH REPLACE runs, database is set back to MULTI_USER, and EF Core's connection pool is cleared to avoid stale pooled connections.
- Filenames are validated against ^[A-Za-z0-9_-]+\.bak$ to prevent path traversal/injection.
- Docker CLI calls from the API are made via Process.Start with ArgumentList (shell-injection safe).

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
      HMS.sln

## Getting Started

### Prerequisites

- .NET 9 SDK
- Docker Desktop

### 1. Start the database container

    docker ps -a --filter name=hms-sqlserver

If the container doesn't exist, create it:

    docker run -e "ACCEPT_EULA=Y" -e "MSSQLSA_PASSWORD=HmsStrong@Pass123" -p 1433:1433 --name hms-sqlserver -d mcr.microsoft.com/mssql/server:2022-latest

If it exists but is stopped:

    docker start hms-sqlserver

On Windows/Git Bash, prefix Docker commands with MSYS_NO_PATHCONV=1 to avoid path mangling.

### 2. Apply migrations

    dotnet ef database update --project src/HMS.Infrastructure --startup-project src/HMS.API

### 3. Run the API

    dotnet run --project src/HMS.API

API available at: http://localhost:5004
Swagger UI: http://localhost:5004/swagger

### 4. Run tests

    dotnet test tests/HMS.Tests/HMS.Tests.csproj

Current status: 57 tests, 0 failed.

## Test Users

| Email | Password | Role |
|---|---|---|
| admin@hms.com | Admin@123 | Admin |
| doctor@hms.com | Doctor@123 | Doctor |

## Known Gotchas

- Windows/Git Bash file uploads: curl -F "file=@..." with an MSYS-style path (/e/...) fails silently with "curl: (26) Failed to open/read local data from file/application". Use the native Windows path format instead (e.g. E:/HMS_DB_Backups/file.bak).
- Soft-delete + unique indexes: fields like PatientCode, Doctor.UserId, and InvoiceNumber require IgnoreQueryFilters in relevant queries to correctly handle uniqueness against soft-deleted records.
- File locks during rebuild: if dotnet run is active, a subsequent dotnet build will fail with a file lock error. Stop the running process first.

## Roadmap

- [x] Core CRUD modules + Auth + Authorization
- [x] Audit logging
- [x] Unit test suite
- [x] Database backup and restore
- [ ] React frontend
