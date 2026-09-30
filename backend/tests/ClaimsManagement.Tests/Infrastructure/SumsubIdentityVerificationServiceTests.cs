using System.Net;
using System.Security.Cryptography;
using System.Text;
using ClaimsManagement.Application.Verification;
using ClaimsManagement.Infrastructure.Verification;

namespace ClaimsManagement.Tests.Infrastructure;

/// <summary>
/// Tests del proveedor Sumsub con HttpClient sustituido por un handler simulado
/// (SPEC-002, REQ-002-29, AC-002-40).
/// </summary>
public sealed class SumsubIdentityVerificationServiceTests
{
    private static readonly SumsubOptions Options = new()
    {
        BaseUrl = "https://api.sumsub.test",
        AppToken = "test-token",
        SecretKey = "test-secret",
        LevelName = "id-verification",
    };

    private static IdentityVerificationRequest Request() => new(
        "Dni", "12345678Z", "María", "García", new DateOnly(1990, 5, 15));

    private static SumsubIdentityVerificationService CreateService(StubHttpHandler handler) =>
        new(new HttpClient(handler) { BaseAddress = new Uri(Options.BaseUrl) }, Options);

    [Fact(DisplayName = "AC-002-40 | Respuesta GREEN del proveedor → verificada")]
    [Trait("AC", "AC-002-40")]
    public async Task VerifyAsync_GreenAnswer_ReturnsVerified()
    {
        var handler = new StubHttpHandler("GREEN");
        var service = CreateService(handler);

        var result = await service.VerifyAsync(Request());
        Assert.Equal(IdentityVerificationOutcome.Verified, result.Outcome);
        Assert.Null(result.Reason);
        Assert.Equal(3, handler.Requests.Count); // crear applicant + pending + status
    }

    [Fact(DisplayName = "AC-002-40 | Respuesta RED con motivo → rechazada con ese motivo")]
    [Trait("AC", "AC-002-40")]
    public async Task VerifyAsync_RedAnswer_ReturnsRejectedWithReason()
    {
        var handler = new StubHttpHandler(
            "RED",
            reviewRejectComment: "Documento manipulado",
            rejectLabels: ["FORGERY"]);
        var service = CreateService(handler);

        var result = await service.VerifyAsync(Request());
        Assert.Equal(IdentityVerificationOutcome.Rejected, result.Outcome);
        Assert.Equal("Documento manipulado", result.Reason);
    }

    [Fact(DisplayName = "AC-002-40 | Error HTTP del proveedor propaga la excepción")]
    [Trait("AC", "AC-002-40")]
    public async Task VerifyAsync_ProviderError_Throws()
    {
        var handler = new StubHttpHandler("GREEN") { FailOnRequest = 0 };
        var service = CreateService(handler);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.VerifyAsync(Request()));
    }

    [Fact(DisplayName = "AC-002-40 | La firma HMAC-SHA256 acompaña a cada petición")]
    [Trait("AC", "AC-002-40")]
    public async Task VerifyAsync_SendsSignedHeaders()
    {
        var handler = new StubHttpHandler("GREEN");
        var service = CreateService(handler);
        await service.VerifyAsync(Request());

        var sent = handler.Requests[0];
        Assert.Equal("test-token", sent.Headers.GetValues("X-App-Token").Single());
        var ts = sent.Headers.GetValues("X-App-Access-Ts").Single();
        var sig = sent.Headers.GetValues("X-App-Access-Sig").Single();

        var body = handler.Bodies[0];
        var path = sent.RequestUri!.AbsolutePath + sent.RequestUri.Query;
        var expected = ExpectedSignature(ts, "POST", path, body);
        Assert.Equal(expected, sig);
    }

    private static string ExpectedSignature(string ts, string method, string path, string body)
    {
        var payload = ts + method + path + body;
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(Options.SecretKey!));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
    }

    private sealed class StubHttpHandler : HttpMessageHandler
    {
        private readonly string _answer;
        private readonly string? _rejectComment;
        private readonly List<string>? _rejectLabels;

        public List<HttpRequestMessage> Requests { get; } = [];
        public List<string> Bodies { get; } = [];
        public int FailOnRequest { get; set; } = -1;

        public StubHttpHandler(string answer, string? reviewRejectComment = null, List<string>? rejectLabels = null)
        {
            _answer = answer;
            _rejectComment = reviewRejectComment;
            _rejectLabels = rejectLabels;
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            Bodies.Add(request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken));

            if (Requests.Count - 1 == FailOnRequest)
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);

            var path = request.RequestUri!.AbsolutePath;
            var json = (request.Method, path) switch
            {
                (var m, var p) when m == HttpMethod.Post && p == "/resources/applicants" =>
                    "{\"id\":\"app-123\"}",
                (var m, var p) when m == HttpMethod.Post && p.EndsWith("/status/pending") =>
                    "{}",
                (var m, var p) when m == HttpMethod.Get && p.EndsWith("/status") =>
                    BuildStatusJson(),
                _ => "{\"id\":\"app-123\"}",
            };

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json"),
            };
        }

        private string BuildStatusJson()
        {
            var comment = _rejectComment is null
                ? string.Empty
                : $",\"reviewRejectComment\":\"{_rejectComment}\"";
            var labels = _rejectLabels is null
                ? string.Empty
                : $",\"rejectLabels\":[\"{string.Join("\",\"", _rejectLabels)}\"]";
            return "{\"reviewStatus\":\"completed\",\"reviewResult\":{\"reviewAnswer\":\""
                + _answer + "\"" + comment + labels + "}}";
        }
    }
}
