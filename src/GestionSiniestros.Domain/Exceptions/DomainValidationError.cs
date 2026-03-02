namespace GestionSiniestros.Domain.Exceptions;

/// <summary>
/// Representa un error de validación individual del dominio.
/// </summary>
public sealed record DomainValidationError(string Field, string Message);
