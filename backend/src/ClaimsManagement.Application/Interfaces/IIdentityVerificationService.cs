using ClaimsManagement.Application.Verification;

namespace ClaimsManagement.Application.Interfaces;

/// Proveedor de verificación de identidad del solicitante (SPEC-002, REQ-002-21).
public interface IIdentityVerificationService
{
    Task<IdentityVerificationResult> VerifyAsync(
        IdentityVerificationRequest request,
        CancellationToken cancellationToken = default);
}
