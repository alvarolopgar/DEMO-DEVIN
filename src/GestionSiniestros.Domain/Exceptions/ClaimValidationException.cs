namespace GestionSiniestros.Domain.Exceptions;

/// <summary>
/// Excepción lanzada cuando la creación de un siniestro viola reglas de negocio.
/// Agrupa múltiples errores de validación (AC2, AC3, AC4).
/// </summary>
public sealed class ClaimValidationException : Exception
{
    public IReadOnlyList<DomainValidationError> Errors { get; }

    public ClaimValidationException(IEnumerable<DomainValidationError> errors)
        : base("Se han producido errores de validación al crear el siniestro.")
    {
        Errors = errors.ToList().AsReadOnly();
    }
}
