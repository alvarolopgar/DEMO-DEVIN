using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Application.Services;
using ClaimsManagement.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace ClaimsManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<IClaimRepository, InMemoryClaimRepository>();
        services.AddScoped<ClaimService>();
        return services;
    }
}
