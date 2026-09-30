namespace ClaimsManagement.Infrastructure.Verification;

/// Configuración del proveedor externo de verificación (SPEC-002, REQ-002-29, C-002-11).
/// Las credenciales llegan por variables de entorno / secretos (Sumsub__AppToken, etc.).
public sealed class SumsubOptions
{
    public string BaseUrl { get; set; } = "https://api.sumsub.com";

    public string? AppToken { get; set; }

    public string? SecretKey { get; set; }

    public string? LevelName { get; set; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(AppToken) &&
        !string.IsNullOrWhiteSpace(SecretKey) &&
        !string.IsNullOrWhiteSpace(LevelName);
}
