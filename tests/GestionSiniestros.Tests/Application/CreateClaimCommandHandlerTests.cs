// =============================================================================
// KAN-5 – Tests Unitarios: Application Layer (CreateClaimCommandHandler)
// =============================================================================
// MATRIZ DE TRAZABILIDAD  Criterio → Test
// ─────────────────────────────────────────────────────────────────────────────
// AC1 → AC1_Handle_ValidRequest_Returns201WithDraftStatus
//      → AC1_Handle_ValidRequest_ReturnsClaimNumberAndId
// AC2 → AC2_Handle_InvalidClaimType_ThrowsValidation
// AC3 → AC3_Handle_FutureDate_ThrowsValidation (delegado a Domain)
// AC4 → AC4_Handle_InvalidPostalCode_ThrowsValidation (delegado a Domain)
// =============================================================================

using GestionSiniestros.Application.Commands;
using GestionSiniestros.Application.DTOs;
using GestionSiniestros.Domain.Entities;
using GestionSiniestros.Domain.Exceptions;
using GestionSiniestros.Domain.Interfaces;

namespace GestionSiniestros.Tests.Application;

/// <summary>
/// Stub del repositorio que simula persistencia en memoria.
/// </summary>
public class InMemoryClaimRepository : IClaimRepository
{
    private readonly List<Claim> _claims = new();

    public Task<Claim> AddAsync(Claim claim, CancellationToken cancellationToken = default)
    {
        _claims.Add(claim);
        return Task.FromResult(claim);
    }

    public IReadOnlyList<Claim> GetAll() => _claims.AsReadOnly();
}

public class CreateClaimCommandHandlerTests
{
    private readonly InMemoryClaimRepository _repository;
    private readonly CreateClaimCommandHandler _handler;

    public CreateClaimCommandHandlerTests()
    {
        _repository = new InMemoryClaimRepository();
        _handler = new CreateClaimCommandHandler(_repository);
    }

    // =========================================================================
    // AC1: Crear siniestro exitosamente
    // =========================================================================

    [Fact]
    public async Task AC1_Handle_ValidRequest_Returns201WithDraftStatus()
    {
        var request = TestHelpers.ValidRequest();

        var response = await _handler.HandleAsync(request);

        // AC1: Status siempre Draft al crear
        Assert.Equal("Draft", response.Status);
        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.NotEmpty(response.ClaimNumber);
    }

    [Fact]
    public async Task AC1_Handle_ValidRequest_ReturnsClaimNumberAndId()
    {
        var request = TestHelpers.ValidRequest();

        var response = await _handler.HandleAsync(request);

        // AC1: Se genera ClaimNumber con formato correcto
        Assert.Matches(@"^CLM-\d{4}-\d{6}$", response.ClaimNumber);
        Assert.True(response.CreatedAt <= DateTime.UtcNow);
    }

    [Fact]
    public async Task AC1_Handle_ValidRequest_PersistsToRepository()
    {
        var request = TestHelpers.ValidRequest();

        await _handler.HandleAsync(request);

        // AC1: El siniestro se persiste
        Assert.Single(_repository.GetAll());
    }

    // =========================================================================
    // AC2: ClaimType inválido (validación en Application layer)
    // =========================================================================

    [Fact]
    public async Task AC2_Handle_InvalidClaimType_ThrowsValidation()
    {
        var request = TestHelpers.ValidRequest() with { ClaimType = "TipoInvalido" };

        var ex = await Assert.ThrowsAsync<ClaimValidationException>(
            () => _handler.HandleAsync(request));

        Assert.Contains(ex.Errors, e => e.Field == "ClaimType");
    }

    [Fact]
    public async Task AC2_Handle_EmptyClaimType_ThrowsValidation()
    {
        var request = TestHelpers.ValidRequest() with { ClaimType = "" };

        var ex = await Assert.ThrowsAsync<ClaimValidationException>(
            () => _handler.HandleAsync(request));

        Assert.Contains(ex.Errors, e => e.Field == "ClaimType");
    }

    // =========================================================================
    // AC2+AC3+AC4: Validaciones delegadas al Domain (integración)
    // =========================================================================

    [Fact]
    public async Task AC3_Handle_FutureDate_ThrowsValidation()
    {
        var request = TestHelpers.ValidRequest() with
        {
            IncidentDate = DateTime.UtcNow.Date.AddDays(5)
        };

        var ex = await Assert.ThrowsAsync<ClaimValidationException>(
            () => _handler.HandleAsync(request));

        Assert.Contains(ex.Errors, e => e.Field == "IncidentDate");
    }

    [Fact]
    public async Task AC4_Handle_InvalidPostalCode_ThrowsValidation()
    {
        var request = TestHelpers.ValidRequest() with { PostalCode = "123" };

        var ex = await Assert.ThrowsAsync<ClaimValidationException>(
            () => _handler.HandleAsync(request));

        Assert.Contains(ex.Errors, e => e.Field == "PostalCode");
    }

    [Fact]
    public async Task AC2_Handle_EmptyPolicyNumber_ThrowsValidation()
    {
        var request = TestHelpers.ValidRequest() with { PolicyNumber = "" };

        var ex = await Assert.ThrowsAsync<ClaimValidationException>(
            () => _handler.HandleAsync(request));

        Assert.Contains(ex.Errors, e => e.Field == "PolicyNumber");
    }

    // =========================================================================
    // Casos límite: todos los ClaimType válidos pasan
    // =========================================================================

    [Theory]
    [InlineData("Colision")]
    [InlineData("Robo")]
    [InlineData("Incendio")]
    [InlineData("Cristales")]
    [InlineData("colision")]   // Case-insensitive
    [InlineData("ROBO")]       // Uppercase
    public async Task Edge_Handle_AllValidClaimTypes_Succeed(string claimType)
    {
        var request = TestHelpers.ValidRequest() with { ClaimType = claimType };

        var response = await _handler.HandleAsync(request);

        Assert.Equal("Draft", response.Status);
    }
}
