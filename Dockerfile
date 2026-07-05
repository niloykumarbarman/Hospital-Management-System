# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files first for layer caching
COPY src/HMS.Domain/HMS.Domain.csproj src/HMS.Domain/
COPY src/HMS.Application/HMS.Application.csproj src/HMS.Application/
COPY src/HMS.Infrastructure/HMS.Infrastructure.csproj src/HMS.Infrastructure/
COPY src/HMS.API/HMS.API.csproj src/HMS.API/

RUN dotnet restore src/HMS.API/HMS.API.csproj

# Copy the rest of the source and build
COPY src/ src/
RUN dotnet publish src/HMS.API/HMS.API.csproj -c Release -o /app/publish --no-restore

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "HMS.API.dll"]
