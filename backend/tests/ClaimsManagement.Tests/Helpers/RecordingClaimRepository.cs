using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Domain.Entities;

namespace ClaimsManagement.Tests.Helpers;

public sealed class RecordingClaimRepository : IClaimRepository
{
    public int AddCount { get; private set; }

    public Task<Claim> AddAsync(Claim claim, CancellationToken cancellationToken = default)
    {
        AddCount++;
        return Task.FromResult(claim);
    }

    public Task<Claim?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.FromResult<Claim?>(null);
}
