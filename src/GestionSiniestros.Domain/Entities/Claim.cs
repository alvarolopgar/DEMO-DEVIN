// =============================================================================
// KAN-5 – Claim Entity (Aggregate Root)
// AC1: El gestor puede crear un siniestro con todos los campos obligatorios
// AC2: Todos los campos son obligatorios
// AC3: La fecha del siniestro no puede ser futura
// AC4: El código postal debe tener exactamente 5 dígitos
// =============================================================================

using GestionSiniestros.Domain.Enums;
using GestionSiniestros.Domain.Exceptions;

namespace GestionSiniestros.Domain.Entities;

/// <summary>
/// Entidad principal del dominio: Siniestro de Auto.
/// Contiene toda la lógica de validación de negocio.
/// </summary>
public class Claim
{
    public Guid Id { get; private set; }
    public string ClaimNumber { get; private set; } = string.Empty;

    // --- Datos de la póliza (AC1, AC2) ---
    public string PolicyNumber { get; private set; } = string.Empty;
    public DateTime IncidentDate { get; private set; }
    public ClaimType ClaimType { get; private set; }

    // --- Datos del vehículo (AC1, AC2) ---
    public string LicensePlate { get; private set; } = string.Empty;

    // --- Datos del asegurado (AC1, AC2) ---
    public string InsuredName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;   // AC4: 5 dígitos

    // --- Descripción (AC1, AC2) ---
    public string Description { get; private set; } = string.Empty;

    // --- Estado (AC1: inicial = Draft) ---
    public ClaimStatus Status { get; private set; }

    // --- Auditoría ---
    public DateTime CreatedAt { get; private set; }

    // Constructor privado para EF Core
    private Claim() { }

    /// <summary>
    /// Factory method que crea un siniestro validando todas las reglas de negocio.
    /// </summary>
    public static Claim Create(
        string policyNumber,
        DateTime incidentDate,
        ClaimType claimType,
        string licensePlate,
        string insuredName,
        string phone,
        string address,
        string postalCode,
        string description)
    {
        // Recopilar todos los errores de validación
        var errors = new List<DomainValidationError>();

        // AC2: Campos obligatorios
        if (string.IsNullOrWhiteSpace(policyNumber))
            errors.Add(new DomainValidationError("PolicyNumber", "El número de póliza es obligatorio."));

        if (string.IsNullOrWhiteSpace(licensePlate))
            errors.Add(new DomainValidationError("LicensePlate", "La matrícula del vehículo es obligatoria."));

        if (string.IsNullOrWhiteSpace(insuredName))
            errors.Add(new DomainValidationError("InsuredName", "El nombre del asegurado es obligatorio."));

        if (string.IsNullOrWhiteSpace(phone))
            errors.Add(new DomainValidationError("Phone", "El teléfono es obligatorio."));

        if (string.IsNullOrWhiteSpace(address))
            errors.Add(new DomainValidationError("Address", "La dirección es obligatoria."));

        if (string.IsNullOrWhiteSpace(postalCode))
            errors.Add(new DomainValidationError("PostalCode", "El código postal es obligatorio."));

        if (string.IsNullOrWhiteSpace(description))
            errors.Add(new DomainValidationError("Description", "La descripción es obligatoria."));

        // AC3: Fecha no puede ser futura
        if (incidentDate.Date > DateTime.UtcNow.Date)
            errors.Add(new DomainValidationError("IncidentDate", "La fecha del siniestro no puede ser posterior a hoy."));

        // AC4: Código postal debe tener exactamente 5 dígitos
        if (!string.IsNullOrWhiteSpace(postalCode) && !System.Text.RegularExpressions.Regex.IsMatch(postalCode, @"^\d{5}$"))
            errors.Add(new DomainValidationError("PostalCode", "El código postal debe tener exactamente 5 dígitos."));

        if (errors.Count > 0)
            throw new ClaimValidationException(errors);

        // AC1: Crear siniestro con estado Draft
        var claim = new Claim
        {
            Id = Guid.NewGuid(),
            ClaimNumber = GenerateClaimNumber(),
            PolicyNumber = policyNumber.Trim(),
            IncidentDate = incidentDate.Date,
            ClaimType = claimType,
            LicensePlate = licensePlate.Trim().ToUpperInvariant(),
            InsuredName = insuredName.Trim(),
            Phone = phone.Trim(),
            Address = address.Trim(),
            PostalCode = postalCode.Trim(),
            Description = description.Trim(),
            Status = ClaimStatus.Draft,   // AC1: Estado inicial siempre Draft
            CreatedAt = DateTime.UtcNow
        };

        return claim;
    }

    /// <summary>
    /// Genera un número de siniestro único con formato CLM-YYYY-NNNNNN.
    /// </summary>
    private static string GenerateClaimNumber()
    {
        var year = DateTime.UtcNow.Year;
        var sequence = (Guid.NewGuid().GetHashCode() & 0x7FFFFFFF) % 1000000;
        return $"CLM-{year}-{sequence:D6}";
    }
}
