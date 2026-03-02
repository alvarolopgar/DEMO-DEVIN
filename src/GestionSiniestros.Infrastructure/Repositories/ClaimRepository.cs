using GestionSiniestros.Domain.Entities;
using GestionSiniestros.Domain.Interfaces;
using GestionSiniestros.Infrastructure.Persistence;

namespace GestionSiniestros.Infrastructure.Repositories;

/// <summary>
/// Implementación concreta del repositorio de siniestros usando EF Core.
/// </summary>
public sealed class ClaimRepository : IClaimRepository
{
    private readonly ClaimsDbContext _context;

    public ClaimRepository(ClaimsDbContext context)
    {
        _context = context;
    }

    public async Task<Claim> AddAsync(Claim claim, CancellationToken cancellationToken = default)
    {
        await _context.Claims.AddAsync(claim, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return claim;
    }
}
