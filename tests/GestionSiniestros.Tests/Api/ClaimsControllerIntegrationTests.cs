// =============================================================================
// KAN-5 – Tests de Integración: API Layer (ClaimsController + Pipeline)
// =============================================================================
// MATRIZ DE TRAZABILIDAD  Criterio → Test
// ─────────────────────────────────────────────────────────────────────────────
// AC1 → AC1_PostClaims_ValidBody_Returns201Created
//      → AC1_PostClaims_ValidBody_ResponseContainsDraftStatus
// AC2 → AC2_PostClaims_EmptyBody_Returns400WithErrors
//      → AC2_PostClaims_MissingFields_Returns400WithFieldErrors
// AC3 → AC3_PostClaims_FutureDate_Returns400
// AC4 → AC4_PostClaims_InvalidPostalCode_Returns400
// =============================================================================

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GestionSiniestros.Application.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GestionSiniestros.Tests.Api;

public class ClaimsControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ClaimsControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    // =========================================================================
    // AC1: POST /api/claims con datos válidos → 201 Created
    // =========================================================================

    [Fact]
    public async Task AC1_PostClaims_ValidBody_Returns201Created()
    {
        var request = TestHelpers.ValidRequest();

        var response = await _client.PostAsJsonAsync("/api/claims", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task AC1_PostClaims_ValidBody_ResponseContainsDraftStatus()
    {
        var request = TestHelpers.ValidRequest();

        var response = await _client.PostAsJsonAsync("/api/claims", request);
        var body = await response.Content.ReadFromJsonAsync<CreateClaimResponse>(JsonOptions);

        Assert.NotNull(body);
        Assert.Equal("Draft", body.Status);
        Assert.NotEqual(Guid.Empty, body.Id);
        Assert.Matches(@"^CLM-\d{4}-\d{6}$", body.ClaimNumber);
    }

    // =========================================================================
    // AC2: Campos obligatorios → 400 Bad Request
    // =========================================================================

    [Fact]
    public async Task AC2_PostClaims_MissingFields_Returns400WithFieldErrors()
    {
        var request = TestHelpers.ValidRequest() with
        {
            PolicyNumber = "",
            Description = ""
        };

        var response = await _client.PostAsJsonAsync("/api/claims", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("PolicyNumber", body);
        Assert.Contains("Description", body);
    }

    // =========================================================================
    // AC3: Fecha futura → 400
    // =========================================================================

    [Fact]
    public async Task AC3_PostClaims_FutureDate_Returns400()
    {
        var request = TestHelpers.ValidRequest() with
        {
            IncidentDate = DateTime.UtcNow.Date.AddDays(30)
        };

        var response = await _client.PostAsJsonAsync("/api/claims", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("IncidentDate", body);
    }

    // =========================================================================
    // AC4: Código postal inválido → 400
    // =========================================================================

    [Fact]
    public async Task AC4_PostClaims_InvalidPostalCode_Returns400()
    {
        var request = TestHelpers.ValidRequest() with { PostalCode = "123" };

        var response = await _client.PostAsJsonAsync("/api/claims", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("PostalCode", body);
    }

    // =========================================================================
    // Caso límite: ClaimType inválido → 400
    // =========================================================================

    [Fact]
    public async Task Edge_PostClaims_InvalidClaimType_Returns400()
    {
        var request = TestHelpers.ValidRequest() with { ClaimType = "Explosion" };

        var response = await _client.PostAsJsonAsync("/api/claims", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("ClaimType", body);
    }

    // =========================================================================
    // Health check
    // =========================================================================

    [Fact]
    public async Task Health_Endpoint_ReturnsHealthy()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
