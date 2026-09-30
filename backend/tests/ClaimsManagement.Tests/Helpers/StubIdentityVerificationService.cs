using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Application.Verification;

namespace ClaimsManagement.Tests.Helpers;

public sealed class StubIdentityVerificationService(IdentityVerificationResult result) : IIdentityVerificationService
{
    public Task<IdentityVerificationResult> VerifyAsync(
        IdentityVerificationRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(result);
}
