using ClaimsManagement.Application.DTOs;
using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Tests.Helpers;

/// <summary>
/// Helper to build valid CreateClaimRequest instances for tests.
/// Each test can override specific fields to test edge cases.
/// </summary>
public static class TestDataBuilder
{
    public static CreateClaimRequest ValidRequest(
        string? policyNumber = null,
        DateTime? claimDate = null,
        ClaimType? claimType = null,
        string? vehiclePlate = null,
        string? insuredName = null,
        string? phone = null,
        string? address = null,
        string? postalCode = null,
        string? description = null)
    {
        return new CreateClaimRequest(
            PolicyNumber: policyNumber ?? "POL-2024-001234",
            ClaimDate: claimDate ?? DateTime.UtcNow.Date.AddDays(-1),
            ClaimType: claimType ?? ClaimType.Colision,
            VehiclePlate: vehiclePlate ?? "1234 ABC",
            InsuredName: insuredName ?? "Juan García López",
            Phone: phone ?? "612345678",
            Address: address ?? "Calle Mayor 10, 2ºA",
            PostalCode: postalCode ?? "28001",
            Description: description ?? "Colisión en intersección"
        );
    }
}
