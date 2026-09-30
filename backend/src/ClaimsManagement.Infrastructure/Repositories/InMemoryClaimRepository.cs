using System.Collections.Concurrent;
using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Domain.Entities;

namespace ClaimsManagement.Infrastructure.Repositories;

public class InMemoryClaimRepository : IClaimRepository
{
    private readonly ConcurrentDictionary<Guid, Claim> _claims = new();

    public Task<Claim> AddAsync(Claim claim, CancellationToken cancellationToken = default)
    {
        _claims[claim.Id] = claim;
        return Task.FromResult(claim);
    }

    public Task<Claim?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _claims.TryGetValue(id, out var claim);
        return Task.FromResult(claim);
    }
}
