using GestionSiniestros.Domain.Entities;

namespace GestionSiniestros.Domain.Interfaces;

/// <summary>
/// Contrato del repositorio de siniestros.
/// La implementación concreta reside en Infrastructure.
/// </summary>
public interface IClaimRepository
{
    Task<Claim> AddAsync(Claim claim, CancellationToken cancellationToken = default);
}
