using System.Net;
using System.Net.Http.Json;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using ClaimsManagement.Application.DTOs;
using ClaimsManagement.Domain.Enums;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Readers;

namespace ClaimsManagement.Tests.Contract;

/// <summary>
/// Contract tests for the onboarding API (SPEC-002) against specs/002 contracts/openapi.yaml.
/// </summary>
public sealed class OnboardingContractTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string BasePath = "/api/onboarding-requests";

    private static readonly Lazy<OpenApiDocument> Contract = new(LoadContract);

    private readonly HttpClient _client;

    public OnboardingContractTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    private static OpenApiDocument LoadContract()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Contract", "openapi-002.yaml");
        using var stream = File.OpenRead(path);
        var document = new OpenApiStreamReader().Read(stream, out var diagnostic);
        Assert.Empty(diagnostic.Errors);
        return document;
    }

    private static OpenApiOperation Operation(string pathSuffix, OperationType type)
    {
        var path = string.IsNullOrEmpty(pathSuffix) ? BasePath : $"{BasePath}/{pathSuffix}";
        return Contract.Value.Paths[path].Operations[type];
    }

    private static OpenApiSchema Schema(string name) => Contract.Value.Components.Schemas[name];

    private static JsonObject ValidDraftJson()
    {
        var example = Operation(string.Empty, OperationType.Post)
            .RequestBody.Content["application/json"].Examples["completo"].Value;
        using var writer = new StringWriter();
        example.Write(new Microsoft.OpenApi.Writers.OpenApiJsonWriter(writer), Microsoft.OpenApi.OpenApiSpecVersion.OpenApi3_0);
        return JsonNode.Parse(writer.ToString())!.AsObject();
    }

    private static async Task<JsonElement> ReadJson(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

    private static void AssertMatches(OpenApiSchema schema, JsonElement body)
    {
        var errors = OpenApiSchemaValidator.Validate(schema, body);
        Assert.True(errors.Count == 0, string.Join(Environment.NewLine, errors));
    }

    private static JsonObject UniqueDraftJson()
    {
        var json = ValidDraftJson();
        json["documentType"] = "Pasaporte";
        json["documentNumber"] = "T" + Guid.NewGuid().ToString("N");
        return json;
    }

    private async Task<string> CreateDraftAsync(JsonObject? body = null)
    {
        var response = await _client.PostAsJsonAsync(BasePath, body ?? UniqueDraftJson());
        response.EnsureSuccessStatusCode();
        return (await ReadJson(response)).GetProperty("id").GetString()!;
    }

    private async Task<JsonElement> SubmitAsync(JsonObject? body = null)
    {
        var draftId = await CreateDraftAsync(body);
        var response = await _client.PostAsJsonAsync($"{BasePath}/{draftId}/submit", (object?)null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await ReadJson(response);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-23: draft creation returns 201 + OnboardingResponse
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-23")]
    [Trait("REQ", "REQ-002-18")]
    public async Task Post_PartialDraft_Returns201MatchingOnboardingResponse()
    {
        var response = await _client.PostAsJsonAsync(BasePath, new { firstName = "María" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.True(Operation(string.Empty, OperationType.Post).Responses["201"].Content
            .ContainsKey(response.Content.Headers.ContentType!.MediaType!));
        var body = await ReadJson(response);
        AssertMatches(Schema("OnboardingResponse"), body);
        Assert.Equal("Borrador", body.GetProperty("status").GetString());
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-02: a status sent in the request is ignored
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-02")]
    [Trait("REQ", "REQ-002-03")]
    public async Task Post_WithStatusClienteCreado_IgnoresItAndReturnsBorrador()
    {
        var request = ValidDraftJson();
        request["status"] = "ClienteCreado";

        var response = await _client.PostAsJsonAsync(BasePath, request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await ReadJson(response);
        AssertMatches(Schema("OnboardingResponse"), body);
        Assert.Equal("Borrador", body.GetProperty("status").GetString());
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-01: full flow submit → 200 PendienteVerificacion
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-01")]
    [Trait("REQ", "REQ-002-20")]
    public async Task Submit_ValidDraft_Returns200PendienteVerificacion()
    {
        var body = await SubmitAsync();

        AssertMatches(Schema("OnboardingResponse"), body);
        Assert.Equal("PendienteVerificacion", body.GetProperty("status").GetString());
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-16b: unknown id → 404 ProblemDetails
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-16b")]
    [Trait("REQ", "REQ-002-15")]
    public async Task Get_UnknownId_Returns404ProblemDetails()
    {
        var response = await _client.GetAsync($"{BasePath}/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
        AssertMatches(Schema("ProblemDetails"), await ReadJson(response));
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-18: ProblemDetails format for 400 / 404 / 409
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-18")]
    [Trait("REQ", "REQ-002-13")]
    public async Task Submit_IncompleteDraft_Returns400ProblemDetails()
    {
        var id = await CreateDraftAsync(new JsonObject { ["firstName"] = "María" });

        var response = await _client.PostAsJsonAsync($"{BasePath}/{id}/submit", (object?)null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
        var body = await ReadJson(response);
        AssertMatches(Schema("ProblemDetails"), body);
        var messages = body.GetProperty("errors").GetProperty("validationErrors")
            .EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.Contains("Los apellidos son obligatorios.", messages);
        Assert.Contains("Debes aceptar la política de protección de datos.", messages);
    }

    [Fact]
    [Trait("AC", "AC-002-18")]
    [Trait("REQ", "REQ-002-16")]
    public async Task Submit_DuplicateActiveDocument_Returns409ProblemDetails()
    {
        var first = await SubmitAsync();
        var secondId = await CreateDraftAsync(ValidDraftJson());
        var firstDoc = first.GetProperty("documentNumber").GetString()!;
        var firstType = first.GetProperty("documentType").GetString()!;
        var second = ValidDraftJson();
        second["documentType"] = firstType;
        second["documentNumber"] = firstDoc;

        var response = await _client.PatchAsJsonAsync($"{BasePath}/{secondId}", second);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var submitResponse = await _client.PostAsJsonAsync($"{BasePath}/{secondId}/submit", (object?)null);
        response = submitResponse;

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
        var body = await ReadJson(response);
        AssertMatches(Schema("ProblemDetails"), body);
        var messages = body.GetProperty("errors").GetProperty("validationErrors")
            .EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.Contains("Ya existe una solicitud de alta con ese documento de identidad.", messages);
        _ = first;
    }

    [Fact]
    [Trait("AC", "AC-002-18")]
    [Trait("REQ", "REQ-002-25")]
    public async Task Verify_OnBorrador_Returns409ProblemDetails()
    {
        var id = await CreateDraftAsync();

        var response = await _client.PostAsJsonAsync($"{BasePath}/{id}/verify", (object?)null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
        AssertMatches(Schema("ProblemDetails"), await ReadJson(response));
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-27 / AC-002-28 / AC-002-29: verify + complete round-trip
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-27")]
    [Trait("REQ", "REQ-002-22")]
    public async Task Verify_SubmittedRequest_Returns200Verificada()
    {
        var body = await SubmitAsync();
        var id = body.GetProperty("id").GetString()!;

        var response = await _client.PostAsJsonAsync($"{BasePath}/{id}/verify", (object?)null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var verified = await ReadJson(response);
        AssertMatches(Schema("OnboardingResponse"), verified);
        Assert.Equal("Verificada", verified.GetProperty("status").GetString());
    }

    [Fact]
    [Trait("AC", "AC-002-28")]
    [Trait("REQ", "REQ-002-22")]
    public async Task Verify_DocumentStartingWith99_Returns200Rechazada()
    {
        var request = UniqueDraftJson();
        request["documentType"] = "Dni";
        request["documentNumber"] = "99123456B";
        var body = await SubmitAsync(request);
        var id = body.GetProperty("id").GetString()!;

        var response = await _client.PostAsJsonAsync($"{BasePath}/{id}/verify", (object?)null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rejected = await ReadJson(response);
        Assert.Equal("Rechazada", rejected.GetProperty("status").GetString());
        Assert.Equal(
            "La verificación de identidad no ha sido superada.",
            rejected.GetProperty("rejectionReason").GetString());
    }

    [Fact]
    [Trait("AC", "AC-002-29")]
    [Trait("REQ", "REQ-002-23")]
    public async Task Complete_VerifiedRequest_Returns200ClienteCreado()
    {
        var body = await SubmitAsync();
        var id = body.GetProperty("id").GetString()!;
        await _client.PostAsJsonAsync($"{BasePath}/{id}/verify", (object?)null);

        var response = await _client.PostAsJsonAsync($"{BasePath}/{id}/complete", (object?)null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var completed = await ReadJson(response);
        AssertMatches(Schema("OnboardingResponse"), completed);
        Assert.Equal("ClienteCreado", completed.GetProperty("status").GetString());
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-26: GET returns the draft data for resuming
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-26")]
    [Trait("REQ", "REQ-002-15")]
    public async Task Get_ExistingDraft_Returns200WithSavedData()
    {
        var id = await CreateDraftAsync(ValidDraftJson());

        var response = await _client.GetAsync($"{BasePath}/{id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ReadJson(response);
        AssertMatches(Schema("OnboardingResponse"), body);
        Assert.Equal("María", body.GetProperty("firstName").GetString());
        Assert.Equal("12345678Z", body.GetProperty("documentNumber").GetString());
        Assert.Equal("Borrador", body.GetProperty("status").GetString());
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-24: PATCH updates a draft
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-24")]
    [Trait("REQ", "REQ-002-19")]
    public async Task Patch_Draft_Returns200UpdatedBorrador()
    {
        var id = await CreateDraftAsync(new JsonObject { ["firstName"] = "María" });

        var response = await _client.PatchAsJsonAsync(
            $"{BasePath}/{id}", new { lastName = "García López" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ReadJson(response);
        AssertMatches(Schema("OnboardingResponse"), body);
        Assert.Equal("García López", body.GetProperty("lastName").GetString());
        Assert.Equal("Borrador", body.GetProperty("status").GetString());
    }

    [Fact]
    [Trait("AC", "AC-002-32")]
    [Trait("REQ", "REQ-002-25")]
    public async Task Patch_SubmittedRequest_Returns409()
    {
        var body = await SubmitAsync();
        var id = body.GetProperty("id").GetString()!;

        var response = await _client.PatchAsJsonAsync(
            $"{BasePath}/{id}", new { firstName = "Otro" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        AssertMatches(Schema("ProblemDetails"), await ReadJson(response));
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-18: DTOs and enums match the contract schemas
    // ═══════════════════════════════════════════════════════════

    [Theory]
    [Trait("AC", "AC-002-18")]
    [Trait("REQ", "REQ-002-12")]
    [InlineData(typeof(SaveOnboardingDraftRequest), "SaveOnboardingDraftRequest")]
    [InlineData(typeof(OnboardingResponse), "OnboardingResponse")]
    public void Dto_Properties_MatchContractSchema(Type dto, string schemaName)
    {
        var dtoProperties = dto.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => JsonNamingPolicy.CamelCase.ConvertName(p.Name))
            .OrderBy(n => n, StringComparer.Ordinal);
        var schema = Schema(schemaName);

        Assert.Equal(schema.Properties.Keys.OrderBy(n => n, StringComparer.Ordinal), dtoProperties);
    }

    [Theory]
    [Trait("AC", "AC-002-18")]
    [Trait("REQ", "REQ-002-12")]
    [InlineData(typeof(DocumentType), "DocumentType")]
    [InlineData(typeof(OnboardingStatus), "OnboardingStatus")]
    public void Enum_Values_MatchContractSchema(Type enumType, string schemaName)
    {
        var contractValues = Schema(schemaName).Enum.Select(OpenApiSchemaValidator.EnumValue);
        Assert.Equal(Enum.GetNames(enumType), contractValues);
    }
}
