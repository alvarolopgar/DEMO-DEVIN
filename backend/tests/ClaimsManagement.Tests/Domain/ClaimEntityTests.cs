using ClaimsManagement.Domain.Entities;
using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Tests.Domain;

/// <summary>
/// Tests for Claim entity - Factory pattern, state initialization, and field mapping.
/// Maps to KAN-5 acceptance criteria:
///   AC-01: Claim is created with all required fields
///   AC-02: Initial status is always Draft
///   AC-03: Unique ID is generated
/// </summary>
public class ClaimEntityTests
{
    // ─────────────────────────────────────────────────────────
    // AC-01: Given valid data, When Create() is called, Then all fields are mapped correctly
    // ─────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithValidData_ShouldMapAllFieldsCorrectly()
    {
        // Arrange
        var policyNumber = "POL-2024-001234";
        var claimDate = new DateTime(2024, 6, 15, 0, 0, 0, DateTimeKind.Utc);
        var claimType = ClaimType.Colision;
        var vehiclePlate = "1234 ABC";
        var insuredName = "Juan García López";
        var phone = "612345678";
        var address = "Calle Mayor 10";
        var postalCode = "28001";
        var description = "Colisión en intersección";

        // Act
        var claim = Claim.Create(
            policyNumber, claimDate, claimType, vehiclePlate,
            insuredName, phone, address, postalCode, description);

        // Assert
        Assert.Equal(policyNumber, claim.PolicyNumber);
        Assert.Equal(claimDate, claim.ClaimDate);
        Assert.Equal(claimType, claim.ClaimType);
        Assert.Equal(vehiclePlate, claim.VehiclePlate);
        Assert.Equal(insuredName, claim.InsuredName);
        Assert.Equal(phone, claim.Phone);
        Assert.Equal(address, claim.Address);
        Assert.Equal(postalCode, claim.PostalCode);
        Assert.Equal(description, claim.Description);
    }

    // ─────────────────────────────────────────────────────────
    // AC-02: Given a new claim, When created, Then status is Draft
    // ─────────────────────────────────────────────────────────

    [Fact]
    public void Create_Always_ShouldSetStatusToDraft()
    {
        // Act
        var claim = Claim.Create(
            "POL-001", DateTime.UtcNow.AddDays(-1), ClaimType.Robo,
            "5678 DEF", "María López", "600111222",
            "Av. de la Constitución 5", "41001", "Robo del vehículo");

        // Assert
        Assert.Equal(ClaimStatus.Draft, claim.Status);
    }

    // ─────────────────────────────────────────────────────────
    // AC-03: Given a new claim, When created, Then a unique GUID is assigned
    // ─────────────────────────────────────────────────────────

    [Fact]
    public void Create_Always_ShouldGenerateNonEmptyGuid()
    {
        var claim = Claim.Create(
            "POL-001", DateTime.UtcNow.AddDays(-1), ClaimType.Incendio,
            "9999 ZZZ", "Pedro Ruiz", "699888777",
            "Plaza España 1", "08001", "Incendio en garaje");

        Assert.NotEqual(Guid.Empty, claim.Id);
    }

    [Fact]
    public void Create_CalledTwice_ShouldGenerateDifferentIds()
    {
        var claim1 = Claim.Create(
            "POL-001", DateTime.UtcNow.AddDays(-1), ClaimType.Colision,
            "1111 AAA", "Test A", "600000001",
            "Dir A", "28001", "Desc A");

        var claim2 = Claim.Create(
            "POL-002", DateTime.UtcNow.AddDays(-1), ClaimType.Colision,
            "2222 BBB", "Test B", "600000002",
            "Dir B", "28002", "Desc B");

        Assert.NotEqual(claim1.Id, claim2.Id);
    }

    // ─────────────────────────────────────────────────────────
    // AC-02 additional: CreatedAt is set to approximately now
    // ─────────────────────────────────────────────────────────

    [Fact]
    public void Create_Always_ShouldSetCreatedAtToApproximatelyNow()
    {
        var before = DateTime.UtcNow;

        var claim = Claim.Create(
            "POL-001", DateTime.UtcNow.AddDays(-1), ClaimType.Cristales,
            "3333 CCC", "Ana Martín", "611222333",
            "Calle Sol 3", "46001", "Rotura de luna");

        var after = DateTime.UtcNow;

        Assert.InRange(claim.CreatedAt, before, after);
    }

    // ─────────────────────────────────────────────────────────
    // Edge case: All ClaimType enum values can be used
    // ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData(ClaimType.Colision)]
    [InlineData(ClaimType.Robo)]
    [InlineData(ClaimType.Incendio)]
    [InlineData(ClaimType.Cristales)]
    public void Create_WithEachClaimType_ShouldSetCorrectType(ClaimType type)
    {
        var claim = Claim.Create(
            "POL-001", DateTime.UtcNow.AddDays(-1), type,
            "1234 ABC", "Test User", "600000000",
            "Test Address", "28001", "Test Description");

        Assert.Equal(type, claim.ClaimType);
        Assert.Equal(ClaimStatus.Draft, claim.Status);
    }
}
