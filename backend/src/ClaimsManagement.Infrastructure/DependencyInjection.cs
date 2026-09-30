using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Application.Services;
using ClaimsManagement.Infrastructure.Repositories;
using ClaimsManagement.Infrastructure.Verification;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ClaimsManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration? configuration = null)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<IClaimRepository, InMemoryClaimRepository>();
        services.AddSingleton<IOnboardingRequestRepository, InMemoryOnboardingRepository>();
        services.AddScoped<ClaimService>();
        services.AddScoped<OnboardingService>();
        AddIdentityVerification(services, configuration);
        return services;
    }

    /// SPEC-002 REQ-002-29 / C-002-11: con credenciales de Sumsub se usa el proveedor
    /// externo (HTTP firmado); sin ellas, el dummy determinista y el flujo no se bloquea.
    private static void AddIdentityVerification(
        IServiceCollection services,
        IConfiguration? configuration)
    {
        var options = configuration?.GetSection("Sumsub").Get<SumsubOptions>() ?? new SumsubOptions();
        if (!options.IsConfigured)
        {
            services.AddSingleton<IIdentityVerificationService, DummyIdentityVerificationService>();
            return;
        }

        services.AddSingleton(options);
        services.AddHttpClient<SumsubIdentityVerificationService>();
        services.AddSingleton<IIdentityVerificationService>(
            sp => sp.GetRequiredService<SumsubIdentityVerificationService>());
    }
}
