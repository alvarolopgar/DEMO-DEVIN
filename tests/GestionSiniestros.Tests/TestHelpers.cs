// =============================================================================
// KAN-5 – Test Helpers
// Datos válidos reutilizables para todos los tests
// =============================================================================

using GestionSiniestros.Application.DTOs;
using GestionSiniestros.Domain.Enums;

namespace GestionSiniestros.Tests;

/// <summary>
/// Helpers con datos válidos base para construir escenarios de test.
/// </summary>
public static class TestHelpers
{
    /// <summary>
    /// Genera un CreateClaimRequest con todos los campos válidos.
    /// Cada test puede sobreescribir campos individuales vía 'with'.
    /// </summary>
    public static CreateClaimRequest ValidRequest() => new()
    {
        PolicyNumber = "POL-2024-001234",
        IncidentDate = DateTime.UtcNow.Date.AddDays(-1),  // Ayer (válido)
        ClaimType = "Colision",
        LicensePlate = "1234ABC",
        InsuredName = "Juan García López",
        Phone = "+34612345678",
        Address = "Calle Mayor 10, Madrid",
        PostalCode = "28001",
        Description = "Colisión frontal en rotonda. Daños en parachoques delantero."
    };
}
