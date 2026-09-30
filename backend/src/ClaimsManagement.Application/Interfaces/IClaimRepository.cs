using ClaimsManagement.Domain.Entities;

namespace ClaimsManagement.Application.Interfaces;

public interface IClaimRepository
{
    Task<Claim> AddAsync(Claim claim, CancellationToken cancellationToken = default);
    Task<Claim?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
