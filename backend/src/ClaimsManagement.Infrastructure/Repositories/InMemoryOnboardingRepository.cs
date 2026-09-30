using System.Collections.Concurrent;
using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Domain.Entities;
using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Infrastructure.Repositories;

public class InMemoryOnboardingRepository : IOnboardingRequestRepository
{
    private readonly ConcurrentDictionary<Guid, OnboardingRequest> _requests = new();

    public Task<OnboardingRequest> AddAsync(OnboardingRequest request, CancellationToken cancellationToken = default)
    {
        _requests[request.Id] = request;
        return Task.FromResult(request);
    }

    public Task<OnboardingRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _requests.TryGetValue(id, out var request);
        return Task.FromResult(request);
    }

    public Task<OnboardingRequest> UpdateAsync(OnboardingRequest request, CancellationToken cancellationToken = default)
    {
        _requests[request.Id] = request;
        return Task.FromResult(request);
    }

    public Task<bool> HasActiveRequestWithDocumentAsync(
        DocumentType documentType,
        string normalizedDocumentNumber,
        Guid excludingId,
        CancellationToken cancellationToken = default)
    {
        var exists = _requests.Values.Any(r =>
            r.Id != excludingId
            && r.IsActive
            && r.DocumentType == documentType
            && string.Equals(r.DocumentNumber, normalizedDocumentNumber, StringComparison.Ordinal));
        return Task.FromResult(exists);
    }
}
