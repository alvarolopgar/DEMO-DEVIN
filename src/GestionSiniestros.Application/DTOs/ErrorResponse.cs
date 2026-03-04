// =============================================================================
// KAN-5 – ErrorResponse DTO
// AC2, AC3, AC4: Respuesta estructurada de errores de validación
// =============================================================================

namespace GestionSiniestros.Application.DTOs;

/// <summary>
/// DTO de respuesta para errores de validación (HTTP 400).
/// </summary>
public sealed record ErrorResponse
{
    public string Message { get; init; } = string.Empty;
    public IReadOnlyList<FieldError> Errors { get; init; } = Array.Empty<FieldError>();
}

/// <summary>
/// Error individual por campo.
/// </summary>
public sealed record FieldError
{
    public string Field { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}
