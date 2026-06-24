# ---- DRIP Syndicate API — multi-stage build (.NET 9) ----
# Stage 1: restore + publish
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution + csproj files first to leverage Docker layer caching on restore
COPY DripSyndicate.sln ./
COPY src/DripSyndicate.Domain/DripSyndicate.Domain.csproj          src/DripSyndicate.Domain/
COPY src/DripSyndicate.Application/DripSyndicate.Application.csproj src/DripSyndicate.Application/
COPY src/DripSyndicate.Infrastructure/DripSyndicate.Infrastructure.csproj src/DripSyndicate.Infrastructure/
COPY src/DripSyndicate.API/DripSyndicate.API.csproj                src/DripSyndicate.API/
COPY tests/DripSyndicate.Tests/DripSyndicate.Tests.csproj          tests/DripSyndicate.Tests/
RUN dotnet restore DripSyndicate.sln

# Copy the rest of the source and publish the API (Release, no self-contained)
COPY . .
RUN dotnet publish src/DripSyndicate.API/DripSyndicate.API.csproj \
    -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: lean ASP.NET runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Run as a non-root user (least privilege)
RUN adduser --disabled-password --gecos "" --uid 5678 appuser
COPY --from=build /app/publish .
USER appuser

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true
EXPOSE 8080

# Render/K8s health probe target: GET /health
ENTRYPOINT ["dotnet", "DripSyndicate.API.dll"]
