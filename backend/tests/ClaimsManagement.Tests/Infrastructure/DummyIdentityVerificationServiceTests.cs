using ClaimsManagement.Application.Verification;
using ClaimsManagement.Infrastructure.Verification;

namespace ClaimsManagement.Tests.Infrastructure;

/// <summary>
/// Tests for DummyIdentityVerificationService - SPEC-002 identity verification dummy.
/// Document convention: numbers starting with "99" are rejected, all others verified.
/// Tests deliberately carry no AC/REQ traits: the dummy is scaffolding decided in C-002-01,
/// not an implementation of spec-002 acceptance criteria.
/// </summary>
public class DummyIdentityVerificationServiceTests
{
    private readonly DummyIdentityVerificationService _service = new();

    [Theory]
    [InlineData("12345678Z", "Dni")]
    [InlineData("X1234567L", "Nie")]
    [InlineData("PAA123456", "Pasaporte")]
    public async Task VerifyAsync_NormalDocument_ShouldReturnVerified(string documentNumber, string documentType)
    {
        var request = new IdentityVerificationRequest(
            documentType, documentNumber, "María", "García López", new DateOnly(1990, 5, 12));

        var result = await _service.VerifyAsync(request);

        Assert.Equal(IdentityVerificationOutcome.Verified, result.Outcome);
        Assert.Null(result.Reason);
    }

    [Theory]
    [InlineData("99123456B")]
    [InlineData("99000000R")]
    public async Task VerifyAsync_DocumentStartingWith99_ShouldReturnRejected(string documentNumber)
    {
        var request = new IdentityVerificationRequest(
            "Dni", documentNumber, "María", "García López", new DateOnly(1990, 5, 12));

        var result = await _service.VerifyAsync(request);

        Assert.Equal(IdentityVerificationOutcome.Rejected, result.Outcome);
        Assert.Equal(DummyIdentityVerificationService.RejectionReason, result.Reason);
    }

    [Theory]
    [InlineData("99-123-456-b")]
    [InlineData(" 99 123456B ")]
    public async Task VerifyAsync_DocumentStartingWith99NotNormalized_ShouldStillReturnRejected(string documentNumber)
    {
        var request = new IdentityVerificationRequest(
            "Dni", documentNumber, "María", "García López", new DateOnly(1990, 5, 12));

        var result = await _service.VerifyAsync(request);

        Assert.Equal(IdentityVerificationOutcome.Rejected, result.Outcome);
    }

    [Fact]
    public async Task VerifyAsync_SameDocumentTwice_ShouldReturnDeterministicResult()
    {
        var request = new IdentityVerificationRequest(
            "Dni", "12345678Z", "María", "García López", new DateOnly(1990, 5, 12));

        var first = await _service.VerifyAsync(request);
        var second = await _service.VerifyAsync(request);

        Assert.Equal(first.Outcome, second.Outcome);
    }

    [Fact]
    public async Task VerifyAsync_NullRequest_ShouldThrow()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _service.VerifyAsync(null!));
    }
}
