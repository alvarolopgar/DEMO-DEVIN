FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/ClaimsManagement.Domain/ClaimsManagement.Domain.csproj src/ClaimsManagement.Domain/
COPY src/ClaimsManagement.Application/ClaimsManagement.Application.csproj src/ClaimsManagement.Application/
COPY src/ClaimsManagement.Infrastructure/ClaimsManagement.Infrastructure.csproj src/ClaimsManagement.Infrastructure/
COPY src/ClaimsManagement.API/ClaimsManagement.API.csproj src/ClaimsManagement.API/
RUN dotnet restore src/ClaimsManagement.API/ClaimsManagement.API.csproj

COPY src/ src/
RUN dotnet publish src/ClaimsManagement.API/ClaimsManagement.API.csproj \
    --configuration Release --no-restore --output /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
USER app
ENTRYPOINT ["dotnet", "ClaimsManagement.API.dll"]
