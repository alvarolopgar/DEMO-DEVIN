using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Domain.Entities;
using ClaimsManagement.Domain.Enums;
using ClaimsManagement.Infrastructure.Verification;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ClaimsManagement.Tests.Security;

/// <summary>
/// Suite de seguridad de la API de alta (SPEC-002, C-002-12): integridad del protocolo
/// HTTP, errores sin detalles internos y tratamiento literal de los datos del solicitante.
/// </summary>
public sealed class OnboardingSecurityTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string BasePath = "/api/onboarding-requests";

    private readonly WebApplicationFactory<Program> _factory;

    public OnboardingSecurityTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private static async Task<JsonElement> ReadJson(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

    private static void AssertProblemDetails(JsonElement body, int expectedStatus)
    {
        Assert.Equal(expectedStatus, body.GetProperty("status").GetInt32());
        Assert.True(body.TryGetProperty("title", out _));
    }

    private static async Task<JsonElement> CreateDraftAsync(HttpClient client, string? firstName = null)
    {
        var payload = new Dictionary<string, object?>
        {
            ["firstName"] = firstName ?? "María",
            ["lastName"] = "García López",
            ["documentType"] = "Pasaporte",
            ["documentNumber"] = "T" + Guid.NewGuid().ToString("N"),
        };
        var response = await client.PostAsJsonAsync(BasePath, payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await ReadJson(response);
    }

    [Fact(DisplayName = "AC-002-35 | DELETE sobre la solicitud se rechaza (405) sin efectos")]
    [Trait("AC", "AC-002-35")]
    public async Task Delete_OnRequest_Returns405_AndStateIsKept()
    {
        var client = _factory.CreateClient();
        var draft = await CreateDraftAsync(client);
        var id = draft.GetProperty("id").GetString();

        var response = await client.DeleteAsync($"{BasePath}/{id}");
        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);

        var after = await client.GetAsync($"{BasePath}/{id}");
        Assert.Equal(HttpStatusCode.OK, after.StatusCode);
        Assert.Equal("Borrador", (await ReadJson(after)).GetProperty("status").GetString());
    }

    [Fact(DisplayName = "AC-002-36 | Content-Type no JSON se rechaza (415)")]
    [Trait("AC", "AC-002-36")]
    public async Task Post_NonJsonContentType_Returns415()
    {
        var client = _factory.CreateClient();
        using var content = new StringContent("firstName=María", Encoding.UTF8, "text/plain");

        var response = await client.PostAsync(BasePath, content);
        Assert.Equal(HttpStatusCode.UnsupportedMediaType, response.StatusCode);
    }

    [Fact(DisplayName = "AC-002-36 | JSON malformado se rechaza con 400 Problem Details")]
    [Trait("AC", "AC-002-36")]
    public async Task Post_MalformedJson_Returns400_ProblemDetails()
    {
        var client = _factory.CreateClient();
        using var content = new StringContent("{ not json", Encoding.UTF8, "application/json");

        var response = await client.PostAsync(BasePath, content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        AssertProblemDetails(await ReadJson(response), 400);
    }

    [Fact(DisplayName = "AC-002-36 | Campos desconocidos en el cuerpo se ignoran sin error")]
    [Trait("AC", "AC-002-36")]
    public async Task Post_UnknownFields_AreIgnored()
    {
        var client = _factory.CreateClient();
        var payload = new Dictionary<string, object?>
        {
            ["firstName"] = "María",
            ["documentType"] = "Pasaporte",
            ["documentNumber"] = "T" + Guid.NewGuid().ToString("N"),
            ["__proto__"] = new { admin = true },
            ["unknownField"] = "valor",
        };

        var response = await client.PostAsJsonAsync(BasePath, payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact(DisplayName = "AC-002-37 | Error interno se devuelve como 500 Problem Details sin trazas")]
    [Trait("AC", "AC-002-37")]
    public async Task InternalError_Returns500_ProblemDetails_WithoutInternals()
    {
        using var failingFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IOnboardingRequestRepository>();
                services.AddSingleton<IOnboardingRequestRepository, ThrowingOnboardingRepository>();
            });
        });
        var client = failingFactory.CreateClient();

        var response = await client.GetAsync($"{BasePath}/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        var raw = await response.Content.ReadAsStringAsync();
        var body = JsonDocument.Parse(raw).RootElement;
        AssertProblemDetails(body, 500);
        Assert.False(body.TryGetProperty("detail", out var detail) &&
                     detail.GetString()?.Contains("System.", StringComparison.Ordinal) == true);
        Assert.DoesNotContain("at ", raw);
        Assert.DoesNotContain("Exception", raw);
        Assert.DoesNotContain("ClaimsManagement", raw);
    }

    [Fact(DisplayName = "AC-002-38 | Datos con marcado o código se almacenan y devuelven literales")]
    [Trait("AC", "AC-002-38")]
    public async Task Draft_WithScriptPayload_IsStoredAndReturnedVerbatim()
    {
        var client = _factory.CreateClient();
        const string payloadText = "<script>alert(1)</script>";

        var draft = await CreateDraftAsync(client, payloadText);
        var id = draft.GetProperty("id").GetString();
        Assert.Equal(payloadText, draft.GetProperty("firstName").GetString());

        var getResponse = await client.GetAsync($"{BasePath}/{id}");
        var fetched = await ReadJson(getResponse);
        Assert.Equal(payloadText, fetched.GetProperty("firstName").GetString());
    }

    [Fact(DisplayName = "AC-002-39 | Sin credenciales de proveedor se registra el servicio simulado")]
    [Trait("AC", "AC-002-39")]
    public void WithoutProviderCredentials_DummyServiceIsRegistered()
    {
        var service = _factory.Services.GetRequiredService<IIdentityVerificationService>();
        Assert.IsType<DummyIdentityVerificationService>(service);
    }

    private sealed class ThrowingOnboardingRepository : IOnboardingRequestRepository
    {
        public Task<OnboardingRequest> AddAsync(OnboardingRequest request, CancellationToken ct = default) =>
            throw new InvalidOperationException("Simulated infrastructure failure");

        public Task<OnboardingRequest?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            throw new InvalidOperationException("Simulated infrastructure failure");

        public Task<OnboardingRequest> UpdateAsync(OnboardingRequest request, CancellationToken ct = default) =>
            throw new InvalidOperationException("Simulated infrastructure failure");

        public Task<bool> HasActiveRequestWithDocumentAsync(
            DocumentType documentType, string documentNumber, Guid excludeId, CancellationToken ct = default) =>
            throw new InvalidOperationException("Simulated infrastructure failure");
    }
}
