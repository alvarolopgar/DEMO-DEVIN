using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Application.Services;
using ClaimsManagement.Infrastructure.Repositories;
using ClaimsManagement.Infrastructure.Verification;
using Microsoft.Extensions.DependencyInjection;

namespace ClaimsManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<IClaimRepository, InMemoryClaimRepository>();
        services.AddSingleton<IOnboardingRequestRepository, InMemoryOnboardingRepository>();
        services.AddSingleton<IIdentityVerificationService, DummyIdentityVerificationService>();
        services.AddScoped<ClaimService>();
        services.AddScoped<OnboardingService>();
        return services;
    }
}
