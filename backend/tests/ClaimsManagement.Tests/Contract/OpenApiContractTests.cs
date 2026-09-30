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

public sealed class OpenApiContractTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string ClaimsPath = "/api/claims";

    private static readonly Lazy<OpenApiDocument> Contract = new(LoadContract);

    private readonly HttpClient _client;

    public OpenApiContractTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    private static OpenApiDocument LoadContract()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Contract", "openapi.yaml");
        using var stream = File.OpenRead(path);
        var document = new OpenApiStreamReader().Read(stream, out var diagnostic);
        Assert.Empty(diagnostic.Errors);
        return document;
    }

    private static OpenApiOperation CreateClaimOperation =>
        Contract.Value.Paths[ClaimsPath].Operations[OperationType.Post];

    private static OpenApiSchema Schema(string name) => Contract.Value.Components.Schemas[name];

    private static JsonObject ContractExampleRequest()
    {
        var example = CreateClaimOperation.RequestBody.Content["application/json"].Examples["valido"].Value;
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

    [Fact]
    [Trait("AC", "AC-001-01")]
    [Trait("REQ", "REQ-001-07")]
    public async Task Post_ContractExample_Returns201MatchingClaimResponseSchema()
    {
        var response = await _client.PostAsJsonAsync(ClaimsPath, ContractExampleRequest());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.True(CreateClaimOperation.Responses["201"].Content.ContainsKey(response.Content.Headers.ContentType!.MediaType!));
        AssertMatches(Schema("ClaimResponse"), await ReadJson(response));
    }

    [Fact]
    [Trait("AC", "AC-001-02")]
    [Trait("REQ", "REQ-001-03")]
    public async Task Post_WithStatusApproved_IgnoresItAndReturnsDraft()
    {
        var request = ContractExampleRequest();
        request["status"] = "Approved";

        var response = await _client.PostAsJsonAsync(ClaimsPath, request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await ReadJson(response);
        AssertMatches(Schema("ClaimResponse"), body);
        Assert.Equal(nameof(ClaimStatus.Draft), body.GetProperty("status").GetString());
    }

    [Fact]
    [Trait("AC", "AC-001-16")]
    [Trait("REQ", "REQ-001-08")]
    public async Task Post_InvalidBusinessData_Returns400ProblemDetailsMatchingContract()
    {
        var request = ContractExampleRequest();
        request["claimDate"] = DateTime.UtcNow.AddDays(5).ToString("yyyy-MM-dd");
        request["postalCode"] = "123";

        var response = await _client.PostAsJsonAsync(ClaimsPath, request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var mediaType = response.Content.Headers.ContentType!.MediaType!;
        Assert.Equal("application/problem+json", mediaType);
        Assert.True(CreateClaimOperation.Responses["400"].Content.ContainsKey(mediaType));
        var body = await ReadJson(response);
        AssertMatches(Schema("ValidationProblemDetails"), body);
        var messages = body.GetProperty("errors").GetProperty("validationErrors")
            .EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.Contains("La fecha del siniestro no puede ser futura.", messages);
        Assert.Contains("El código postal debe tener exactamente 5 dígitos.", messages);
    }

    [Fact]
    [Trait("AC", "AC-001-08b")]
    [Trait("REQ", "REQ-001-06")]
    public async Task Post_ClaimTypeOutsideCatalog_Returns400ProblemDetailsMatchingContract()
    {
        var request = ContractExampleRequest();
        request["claimType"] = "Granizo";

        var response = await _client.PostAsJsonAsync(ClaimsPath, request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
        AssertMatches(Schema("ValidationProblemDetails"), await ReadJson(response));
    }

    [Theory]
    [Trait("AC", "AC-001-01")]
    [Trait("REQ", "REQ-001-01")]
    [InlineData(typeof(CreateClaimRequest), "CreateClaimRequest")]
    [InlineData(typeof(ClaimResponse), "ClaimResponse")]
    public void Dto_Properties_MatchContractSchema(Type dto, string schemaName)
    {
        var dtoProperties = dto.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => JsonNamingPolicy.CamelCase.ConvertName(p.Name))
            .OrderBy(n => n, StringComparer.Ordinal);
        var schema = Schema(schemaName);

        Assert.Equal(schema.Properties.Keys.OrderBy(n => n, StringComparer.Ordinal), dtoProperties);
        Assert.Equal(schema.Properties.Keys.OrderBy(n => n, StringComparer.Ordinal), schema.Required.OrderBy(n => n, StringComparer.Ordinal));
    }

    [Theory]
    [Trait("AC", "AC-001-08a")]
    [Trait("REQ", "REQ-001-06")]
    [InlineData(typeof(ClaimType), "ClaimType")]
    [InlineData(typeof(ClaimStatus), "ClaimStatus")]
    public void Enum_Values_MatchContractSchema(Type enumType, string schemaName)
    {
        var contractValues = Schema(schemaName).Enum.Select(OpenApiSchemaValidator.EnumValue);
        Assert.Equal(Enum.GetNames(enumType), contractValues);
    }
}
