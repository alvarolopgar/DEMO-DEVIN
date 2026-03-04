// =============================================================================
// KAN-5 – CreateClaimRequest DTO
// AC1: Datos necesarios para crear un siniestro
// AC2: Todos los campos son obligatorios (validación en FluentValidation)
// =============================================================================

using System.ComponentModel.DataAnnotations;

namespace GestionSiniestros.Application.DTOs;

/// <summary>
/// DTO de entrada para la creación de un siniestro.
/// Mapeado 1:1 con los campos de KAN-5.
/// </summary>
public sealed record CreateClaimRequest
{
    /// <summary>Número de póliza (AC1, AC2)</summary>
    [Required(ErrorMessage = "El número de póliza es obligatorio.")]
    public string PolicyNumber { get; init; } = string.Empty;

    /// <summary>Fecha del siniestro (AC1, AC2, AC3: no futura)</summary>
    [Required(ErrorMessage = "La fecha del siniestro es obligatoria.")]
    public DateTime IncidentDate { get; init; }

    /// <summary>Tipo de siniestro: Colision=0, Robo=1, Incendio=2, Cristales=3 (AC1, AC2)</summary>
    [Required(ErrorMessage = "El tipo de siniestro es obligatorio.")]
    public string ClaimType { get; init; } = string.Empty;

    /// <summary>Matrícula del vehículo (AC1, AC2)</summary>
    [Required(ErrorMessage = "La matrícula es obligatoria.")]
    public string LicensePlate { get; init; } = string.Empty;

    /// <summary>Nombre del asegurado (AC1, AC2)</summary>
    [Required(ErrorMessage = "El nombre del asegurado es obligatorio.")]
    public string InsuredName { get; init; } = string.Empty;

    /// <summary>Teléfono de contacto (AC1, AC2)</summary>
    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    public string Phone { get; init; } = string.Empty;

    /// <summary>Dirección (AC1, AC2)</summary>
    [Required(ErrorMessage = "La dirección es obligatoria.")]
    public string Address { get; init; } = string.Empty;

    /// <summary>Código postal – 5 dígitos (AC1, AC2, AC4)</summary>
    [Required(ErrorMessage = "El código postal es obligatorio.")]
    public string PostalCode { get; init; } = string.Empty;

    /// <summary>Descripción del siniestro (AC1, AC2)</summary>
    [Required(ErrorMessage = "La descripción es obligatoria.")]
    public string Description { get; init; } = string.Empty;
}
