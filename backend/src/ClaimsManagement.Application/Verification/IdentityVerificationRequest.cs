namespace ClaimsManagement.Application.Verification;

/// Datos enviados al proveedor de verificación de identidad (SPEC-002, REQ-002-21).
/// DocumentNumber llega normalizado (mayúsculas, sin espacios ni guiones, REQ-002-08).
public sealed record IdentityVerificationRequest(
    string DocumentType,
    string DocumentNumber,
    string FirstName,
    string LastName,
    DateOnly BirthDate);
