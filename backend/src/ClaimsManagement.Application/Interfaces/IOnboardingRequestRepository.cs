using ClaimsManagement.Domain.Entities;
using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Application.Interfaces;

public interface IOnboardingRequestRepository
{
    Task<OnboardingRequest> AddAsync(OnboardingRequest request, CancellationToken cancellationToken = default);

    Task<OnboardingRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<OnboardingRequest> UpdateAsync(OnboardingRequest request, CancellationToken cancellationToken = default);

    Task<bool> HasActiveRequestWithDocumentAsync(
        DocumentType documentType,
        string normalizedDocumentNumber,
        Guid excludingId,
        CancellationToken cancellationToken = default);
}
