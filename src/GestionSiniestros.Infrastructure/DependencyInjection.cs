using GestionSiniestros.Domain.Interfaces;
using GestionSiniestros.Infrastructure.Persistence;
using GestionSiniestros.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GestionSiniestros.Infrastructure;

/// <summary>
/// Registro de servicios de la capa Infrastructure en el contenedor DI.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddDbContext<ClaimsDbContext>(options =>
            options.UseInMemoryDatabase("GestionSiniestrosDb"));

        services.AddScoped<IClaimRepository, ClaimRepository>();

        return services;
    }
}
