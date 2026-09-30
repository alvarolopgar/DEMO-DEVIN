namespace ClaimsManagement.Application.Verification;

public sealed record IdentityVerificationResult(IdentityVerificationOutcome Outcome, string? Reason = null)
{
    public static IdentityVerificationResult Verified() => new(IdentityVerificationOutcome.Verified);

    public static IdentityVerificationResult Rejected(string reason) =>
        new(IdentityVerificationOutcome.Rejected, reason);
}
