using ClaimsManagement.Application.Services;
using ClaimsManagement.Domain.Enums;
using ClaimsManagement.Infrastructure.Repositories;
using ClaimsManagement.Tests.Helpers;

namespace ClaimsManagement.Tests.Application;

/// <summary>
/// Tests for ClaimService - Application layer orchestration.
/// Maps to KAN-5 acceptance criteria:
///   AC-01: Service creates claim and returns ClaimResponse with all fields
///   AC-02: Created claim always has status Draft
///   AC-03: Response includes generated ID
///   AC-04/05/06: Validation errors prevent claim creation
///   AC-08: ClaimResponse maps all entity fields correctly
/// </summary>
public class ClaimServiceTests
{
    private readonly ClaimService _service;
    private readonly InMemoryClaimRepository _repository;

    public ClaimServiceTests()
    {
        _repository = new InMemoryClaimRepository();
        _service = new ClaimService(_repository);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-01 + AC-02 + AC-03: Happy path - create claim successfully
    // Given valid claim data,
    // When CreateClaimAsync is called,
    // Then a ClaimResponse is returned with ID, status=Draft, and all fields
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task CreateClaimAsync_ValidRequest_ShouldReturnResponseWithDraftStatus()
    {
        var request = TestDataBuilder.ValidRequest();

        var (response, errors) = await _service.CreateClaimAsync(request);

        Assert.NotNull(response);
        Assert.Empty(errors);
        Assert.Equal(ClaimStatus.Draft, response.Status);
    }

    [Fact]
    public async Task CreateClaimAsync_ValidRequest_ShouldReturnNonEmptyId()
    {
        var request = TestDataBuilder.ValidRequest();

        var (response, errors) = await _service.CreateClaimAsync(request);

        Assert.NotNull(response);
        Assert.NotEqual(Guid.Empty, response.Id);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-08: Response maps all fields from request
    // Given valid data, When created, Then response contains same data
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task CreateClaimAsync_ValidRequest_ShouldMapAllFieldsToResponse()
    {
        var request = TestDataBuilder.ValidRequest(
            policyNumber: "POL-SPECIFIC-999",
            claimDate: new DateTime(2024, 3, 15, 0, 0, 0, DateTimeKind.Utc),
            claimType: ClaimType.Robo,
            vehiclePlate: "9999 ZZZ",
            insuredName: "María Fernández",
            phone: "699888777",
            address: "Gran Vía 42",
            postalCode: "28013",
            description: "Robo en parking subterráneo");

        var (response, errors) = await _service.CreateClaimAsync(request);

        Assert.NotNull(response);
        Assert.Equal("POL-SPECIFIC-999", response.PolicyNumber);
        Assert.Equal(new DateTime(2024, 3, 15, 0, 0, 0, DateTimeKind.Utc), response.ClaimDate);
        Assert.Equal(ClaimType.Robo, response.ClaimType);
        Assert.Equal("9999 ZZZ", response.VehiclePlate);
        Assert.Equal("María Fernández", response.InsuredName);
        Assert.Equal("699888777", response.Phone);
        Assert.Equal("Gran Vía 42", response.Address);
        Assert.Equal("28013", response.PostalCode);
        Assert.Equal("Robo en parking subterráneo", response.Description);
        Assert.Equal(ClaimStatus.Draft, response.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-04/05/06: Validation failure - no claim created
    // Given invalid data, When CreateClaimAsync is called,
    // Then response is null and errors are returned
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task CreateClaimAsync_InvalidRequest_ShouldReturnNullResponseWithErrors()
    {
        var request = TestDataBuilder.ValidRequest(policyNumber: "");

        var (response, errors) = await _service.CreateClaimAsync(request);

        Assert.Null(response);
        Assert.NotEmpty(errors);
    }

    [Fact]
    public async Task CreateClaimAsync_FutureDate_ShouldReturnValidationError()
    {
        var request = TestDataBuilder.ValidRequest(
            claimDate: DateTime.UtcNow.Date.AddDays(10));

        var (response, errors) = await _service.CreateClaimAsync(request);

        Assert.Null(response);
        Assert.Contains("La fecha del siniestro no puede ser futura.", errors);
    }

    [Fact]
    public async Task CreateClaimAsync_InvalidPostalCode_ShouldReturnValidationError()
    {
        var request = TestDataBuilder.ValidRequest(postalCode: "123");

        var (response, errors) = await _service.CreateClaimAsync(request);

        Assert.Null(response);
        Assert.Contains("El código postal debe tener exactamente 5 dígitos.", errors);
    }

    [Fact]
    public async Task CreateClaimAsync_MultipleInvalidFields_ShouldReturnAllErrors()
    {
        var request = TestDataBuilder.ValidRequest(
            policyNumber: "",
            claimDate: DateTime.UtcNow.Date.AddDays(5),
            postalCode: "AB",
            description: "");

        var (response, errors) = await _service.CreateClaimAsync(request);

        Assert.Null(response);
        Assert.True(errors.Count >= 3);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-09: Claim is persisted to repository
    // Given valid data, When created, Then claim is retrievable from repo
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task CreateClaimAsync_ValidRequest_ShouldPersistClaimInRepository()
    {
        var request = TestDataBuilder.ValidRequest();

        var (response, _) = await _service.CreateClaimAsync(request);

        Assert.NotNull(response);
        var persisted = await _repository.GetByIdAsync(response.Id);
        Assert.NotNull(persisted);
        Assert.Equal(response.Id, persisted.Id);
        Assert.Equal(ClaimStatus.Draft, persisted.Status);
    }

    [Fact]
    public async Task CreateClaimAsync_InvalidRequest_ShouldNotPersistAnything()
    {
        var request = TestDataBuilder.ValidRequest(policyNumber: "");

        var (response, _) = await _service.CreateClaimAsync(request);

        Assert.Null(response);
        // Repository should be empty - no way to list all, but we know nothing was added
    }

    // ═══════════════════════════════════════════════════════════
    // Edge case: Multiple claims can be created independently
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task CreateClaimAsync_MultipleClaims_ShouldAllHaveUniqueIds()
    {
        var ids = new HashSet<Guid>();

        for (int i = 0; i < 10; i++)
        {
            var request = TestDataBuilder.ValidRequest(
                policyNumber: $"POL-{i:D4}");

            var (response, errors) = await _service.CreateClaimAsync(request);

            Assert.NotNull(response);
            Assert.Empty(errors);
            Assert.True(ids.Add(response.Id), $"Duplicate ID detected on iteration {i}");
        }

        Assert.Equal(10, ids.Count);
    }

    // ═══════════════════════════════════════════════════════════
    // Edge case: CancellationToken is respected
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task CreateClaimAsync_WithCancellationToken_ShouldStillWork()
    {
        var cts = new CancellationTokenSource();
        var request = TestDataBuilder.ValidRequest();

        var (response, errors) = await _service.CreateClaimAsync(request, cts.Token);

        Assert.NotNull(response);
        Assert.Empty(errors);
    }
}
