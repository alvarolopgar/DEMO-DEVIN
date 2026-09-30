using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Application.Verification;

namespace ClaimsManagement.Infrastructure.Verification;

/// Proveedor externo de verificación contra la API REST de Sumsub (SPEC-002, REQ-002-29, C-002-11).
/// Firmado HMAC-SHA256 según https://developers.sumsub.com/api-reference/#request-authentication:
/// X-App-Token, X-App-Access-Ts (epoch s), X-App-Access-Sig = hex(HMAC(ts + METHOD + path + body)).
/// Flujo: crea el applicant, solicita el check y lee el reviewResult (GREEN → verificada,
/// RED → rechazada con el motivo del proveedor). Un error HTTP del proveedor propaga la
/// excepción y la solicitud queda en PendienteVerificacion (NFR-002-10).
public sealed class SumsubIdentityVerificationService : IIdentityVerificationService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HttpClient _httpClient;
    private readonly SumsubOptions _options;
    private readonly TimeProvider _timeProvider;

    public SumsubIdentityVerificationService(
        HttpClient httpClient,
        SumsubOptions options,
        TimeProvider? timeProvider = null)
    {
        _httpClient = httpClient;
        _options = options;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<IdentityVerificationResult> VerifyAsync(
        IdentityVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var applicantId = await CreateApplicantAsync(request, cancellationToken);
        await SendSignedAsync(HttpMethod.Post, $"/resources/applicants/{applicantId}/status/pending", null, cancellationToken);
        var status = await SendSignedAsync(
            HttpMethod.Get,
            $"/resources/applicants/{applicantId}/status",
            null,
            cancellationToken);

        var answer = status?.ReviewResult?.ReviewAnswer;
        if (string.Equals(answer, "GREEN", StringComparison.OrdinalIgnoreCase))
            return IdentityVerificationResult.Verified();

        if (string.Equals(answer, "RED", StringComparison.OrdinalIgnoreCase))
            return IdentityVerificationResult.Rejected(
                status!.ReviewResult!.RejectionReason() ?? RejectedFallbackReason);

        throw new InvalidOperationException(
            $"El proveedor de verificación no devolvió un resultado concluyente (estado '{status?.ReviewStatus ?? "desconocido"}').");
    }

    internal const string RejectedFallbackReason = "La verificación de identidad no ha sido superada.";

    private async Task<string> CreateApplicantAsync(
        IdentityVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var body = new
        {
            externalUserId = Guid.NewGuid().ToString("N"),
            info = new
            {
                firstName = request.FirstName,
                lastName = request.LastName,
                dob = request.BirthDate.ToString("yyyy-MM-dd"),
                country = "ESP",
                idDocs = new[]
                {
                    new
                    {
                        idDocType = MapDocumentType(request.DocumentType),
                        number = request.DocumentNumber,
                    },
                },
            },
        };

        var response = await SendSignedAsync(
            HttpMethod.Post,
            $"/resources/applicants?levelName={Uri.EscapeDataString(_options.LevelName!)}",
            body,
            cancellationToken);

        return response?.Id
            ?? throw new InvalidOperationException("El proveedor de verificación no devolvió el identificador del solicitante.");
    }

    private static string MapDocumentType(string documentType) =>
        string.Equals(documentType, "Pasaporte", StringComparison.OrdinalIgnoreCase)
            ? "PASSPORT"
            : "ID_CARD";

    private async Task<SumsubApplicantResponse?> SendSignedAsync(
        HttpMethod method,
        string pathAndQuery,
        object? body,
        CancellationToken cancellationToken)
    {
        var json = body is null ? null : JsonSerializer.Serialize(body, JsonOptions);
        var ts = _timeProvider.GetUtcNow().ToUnixTimeSeconds().ToString();

        var signature = Sign(ts, method.Method, pathAndQuery, json ?? string.Empty);

        using var message = new HttpRequestMessage(method, $"{_options.BaseUrl}{pathAndQuery}");
        message.Headers.Add("X-App-Token", _options.AppToken);
        message.Headers.Add("X-App-Access-Ts", ts);
        message.Headers.Add("X-App-Access-Sig", signature);
        if (json is not null)
            message.Content = new StringContent(json, Encoding.UTF8, "application/json");

        using var response = await _httpClient.SendAsync(message, cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException(
                $"El proveedor de verificación respondió con código {(int)response.StatusCode}.");

        return await response.Content.ReadFromJsonAsync<SumsubApplicantResponse>(JsonOptions, cancellationToken);
    }

    private string Sign(string ts, string method, string pathAndQuery, string body)
    {
        var payload = ts + method.ToUpperInvariant() + pathAndQuery + body;
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_options.SecretKey!));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
    }

    private sealed class SumsubApplicantResponse
    {
        public string? Id { get; set; }
        public string? ReviewStatus { get; set; }
        public SumsubReviewResult? ReviewResult { get; set; }
    }

    private sealed class SumsubReviewResult
    {
        public string? ReviewAnswer { get; set; }
        public string? ReviewRejectComment { get; set; }
        public List<string>? RejectLabels { get; set; }

        public string? RejectionReason() =>
            !string.IsNullOrWhiteSpace(ReviewRejectComment)
                ? ReviewRejectComment
                : RejectLabels is { Count: > 0 } ? string.Join(", ", RejectLabels) : null;
    }
}
