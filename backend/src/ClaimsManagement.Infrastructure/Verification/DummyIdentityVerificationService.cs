using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Application.Verification;

namespace ClaimsManagement.Infrastructure.Verification;

/// Implementación dummy del proveedor de verificación de identidad (SPEC-002, C-002-01).
/// Determinista: rechaza los documentos normalizados que empiezan por "99" (convención de
/// documentos sintéticos de prueba) y verifica el resto. Sustituible por un proveedor real
/// sin cambiar la interfaz.
public sealed class DummyIdentityVerificationService : IIdentityVerificationService
{
    public const string RejectedDocumentPrefix = "99";
    public const string RejectionReason = "La verificación de identidad no ha sido superada.";

    public Task<IdentityVerificationResult> VerifyAsync(
        IdentityVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var normalized = (request.DocumentNumber ?? string.Empty)
            .Replace(" ", string.Empty)
            .Replace("-", string.Empty)
            .ToUpperInvariant();

        var result = normalized.StartsWith(RejectedDocumentPrefix, StringComparison.Ordinal)
            ? IdentityVerificationResult.Rejected(RejectionReason)
            : IdentityVerificationResult.Verified();

        return Task.FromResult(result);
    }
}
