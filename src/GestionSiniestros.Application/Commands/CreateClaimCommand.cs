// =============================================================================
// KAN-5 – CreateClaimCommand
// AC1: Orquesta la creación de un siniestro
// Delega validación de negocio al Domain (Claim.Create)
// =============================================================================

using GestionSiniestros.Application.DTOs;
using GestionSiniestros.Domain.Entities;
using GestionSiniestros.Domain.Enums;
using GestionSiniestros.Domain.Exceptions;
using GestionSiniestros.Domain.Interfaces;

namespace GestionSiniestros.Application.Commands;

/// <summary>
/// Caso de uso: Crear un siniestro de auto (KAN-5).
/// Patrón Command Handler sin MediatR para mantener mínimas las dependencias.
/// </summary>
public sealed class CreateClaimCommandHandler
{
    private readonly IClaimRepository _claimRepository;

    public CreateClaimCommandHandler(IClaimRepository claimRepository)
    {
        _claimRepository = claimRepository;
    }

    /// <summary>
    /// Ejecuta la creación del siniestro.
    /// </summary>
    /// <returns>CreateClaimResponse con ID, ClaimNumber, Status y CreatedAt.</returns>
    /// <exception cref="ClaimValidationException">Si hay errores de validación (AC2, AC3, AC4).</exception>
    /// <exception cref="ArgumentException">Si el ClaimType no es válido.</exception>
    public async Task<CreateClaimResponse> HandleAsync(
        CreateClaimRequest request,
        CancellationToken cancellationToken = default)
    {
        // Parsear ClaimType desde string
        if (!Enum.TryParse<ClaimType>(request.ClaimType, ignoreCase: true, out var claimType))
        {
            var validTypes = string.Join(", ", Enum.GetNames<ClaimType>());
            throw new ClaimValidationException(new[]
            {
                new DomainValidationError("ClaimType",
                    $"Tipo de siniestro no válido. Valores permitidos: {validTypes}.")
            });
        }

        // AC1: Crear siniestro – la validación de negocio ocurre dentro de Claim.Create
        // AC2: Campos obligatorios validados en Domain
        // AC3: Fecha no futura validada en Domain
        // AC4: Código postal 5 dígitos validado en Domain
        var claim = Claim.Create(
            policyNumber: request.PolicyNumber,
            incidentDate: request.IncidentDate,
            claimType: claimType,
            licensePlate: request.LicensePlate,
            insuredName: request.InsuredName,
            phone: request.Phone,
            address: request.Address,
            postalCode: request.PostalCode,
            description: request.Description);

        // Persistir
        var savedClaim = await _claimRepository.AddAsync(claim, cancellationToken);

        // AC1: Devolver respuesta con ID generado y Status = Draft
        return new CreateClaimResponse
        {
            Id = savedClaim.Id,
            ClaimNumber = savedClaim.ClaimNumber,
            Status = savedClaim.Status.ToString(),
            CreatedAt = savedClaim.CreatedAt
        };
    }
}
