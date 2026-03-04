// =============================================================================
// KAN-5 – CreateClaimResponse DTO
// AC1: Respuesta tras crear un siniestro exitosamente
// Devuelve: ID, ClaimNumber, Status=Draft, CreatedAt
// =============================================================================

namespace GestionSiniestros.Application.DTOs;

/// <summary>
/// DTO de respuesta tras la creación exitosa de un siniestro (HTTP 201).
/// </summary>
public sealed record CreateClaimResponse
{
    public Guid Id { get; init; }
    public string ClaimNumber { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
