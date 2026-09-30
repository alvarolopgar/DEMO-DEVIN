using ClaimsManagement.Application.DTOs;
using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Application.Services;
using ClaimsManagement.Application.Verification;
using ClaimsManagement.Domain.Enums;
using ClaimsManagement.Infrastructure.Repositories;
using ClaimsManagement.Infrastructure.Verification;
using ClaimsManagement.Tests.Helpers;

namespace ClaimsManagement.Tests.Application;

/// <summary>
/// Tests for OnboardingService - SPEC-002 lifecycle: drafts, submit, verification, completion, expiry.
/// Maps to SPEC-002 acceptance criteria.
/// </summary>
public class OnboardingServiceTests
{
    private const string RejectionReason = "La verificación de identidad no ha sido superada.";

    private readonly InMemoryOnboardingRepository _repository = new();
    private readonly MutableTimeProvider _clock = MutableTimeProvider.AtUtc("2026-09-30T12:00:00Z");

    private OnboardingService CreateService(IIdentityVerificationService? verification = null) =>
        new(_repository, verification ?? new DummyIdentityVerificationService(), _clock);

    private static SaveOnboardingDraftRequest ValidDraftRequest(
        string documentNumber = "12345678Z",
        DocumentType documentType = DocumentType.Dni,
        bool? marketing = null) =>
        new(
            FirstName: "María",
            LastName: "García López",
            DocumentType: documentType,
            DocumentNumber: documentNumber,
            BirthDate: new DateTime(1990, 5, 12),
            Email: "maria.garcia@example.com",
            MobilePhone: "612345678",
            AcceptsPrivacyPolicy: true,
            AcceptsMarketing: marketing);

    private async Task<OnboardingResponse> CreateAndSubmitAsync(
        OnboardingService service, string documentNumber = "12345678Z",
        DocumentType documentType = DocumentType.Dni)
    {
        var draft = await service.CreateDraftAsync(ValidDraftRequest(documentNumber, documentType));
        var (response, errors, error) = await service.SubmitAsync(draft.Id);
        Assert.Empty(errors);
        Assert.Null(error);
        Assert.NotNull(response);
        return response!;
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-01: valid submit registers request in PendienteVerificacion
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-01")]
    [Trait("REQ", "REQ-002-01")]
    [Trait("REQ", "REQ-002-12")]
    [Trait("REQ", "REQ-002-20")]
    public async Task SubmitAsync_ValidData_RegistersAsPendingVerification()
    {
        var service = CreateService();
        var draft = await service.CreateDraftAsync(ValidDraftRequest(marketing: true));

        var (response, errors, error) = await service.SubmitAsync(draft.Id);

        Assert.Empty(errors);
        Assert.Null(error);
        Assert.NotNull(response);
        Assert.Equal(draft.Id, response!.Id);
        Assert.Equal(OnboardingStatus.PendienteVerificacion, response.Status);
        Assert.Equal("María", response.FirstName);
        Assert.Equal("García López", response.LastName);
        Assert.Equal(DocumentType.Dni, response.DocumentType);
        Assert.Equal("12345678Z", response.DocumentNumber);
        Assert.Equal(new DateTime(1990, 5, 12), response.BirthDate);
        Assert.Equal("maria.garcia@example.com", response.Email);
        Assert.Equal("612345678", response.MobilePhone);
        Assert.True(response.AcceptsPrivacyPolicy);
        Assert.True(response.AcceptsMarketing);
        Assert.Equal(_clock.UtcNow.UtcDateTime, response.SubmittedAt);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-02: status is decided by the system, not the user
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-02")]
    [Trait("REQ", "REQ-002-03")]
    public async Task CreateDraftAsync_AnyData_AlwaysCreatesBorrador()
    {
        var service = CreateService();

        var response = await service.CreateDraftAsync(ValidDraftRequest());

        Assert.Equal(OnboardingStatus.Borrador, response.Status);
        Assert.Null(response.SubmittedAt);

        var submitted = await service.SubmitAsync(response.Id);
        Assert.Equal(OnboardingStatus.PendienteVerificacion, submitted.Response!.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-03: unique identifier per request
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-03")]
    [Trait("REQ", "REQ-002-12")]
    public async Task CreateDraftAsync_TwoRequests_DistinctNonEmptyIds()
    {
        var service = CreateService();

        var first = await service.CreateDraftAsync(ValidDraftRequest());
        var second = await service.CreateDraftAsync(ValidDraftRequest());

        Assert.NotEqual(Guid.Empty, first.Id);
        Assert.NotEqual(Guid.Empty, second.Id);
        Assert.NotEqual(first.Id, second.Id);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-10: document number stored normalized
    // ═══════════════════════════════════════════════════════════

    [Theory]
    [Trait("AC", "AC-002-10")]
    [Trait("REQ", "REQ-002-08")]
    [InlineData("12345678z")]
    [InlineData("12345678 Z")]
    [InlineData("12345678-Z")]
    public async Task CreateDraftAsync_DocumentNotNormalized_StoresNormalized(string entrada)
    {
        var service = CreateService();

        var response = await service.CreateDraftAsync(ValidDraftRequest(documentNumber: entrada));

        Assert.Equal("12345678Z", response.DocumentNumber);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-13b: marketing consent optional, defaults to false
    // ═══════════════════════════════════════════════════════════

    [Theory]
    [Trait("AC", "AC-002-13b")]
    [Trait("REQ", "REQ-002-11")]
    [InlineData(true, true)]
    [InlineData(false, false)]
    public async Task SubmitAsync_MarketingConsent_RecordedAsGiven(bool marketing, bool expected)
    {
        var service = CreateService();
        var draft = await service.CreateDraftAsync(ValidDraftRequest(marketing: marketing));

        var (response, _, _) = await service.SubmitAsync(draft.Id);

        Assert.Equal(expected, response!.AcceptsMarketing);
    }

    [Fact]
    [Trait("AC", "AC-002-13b")]
    [Trait("REQ", "REQ-002-11")]
    public async Task CreateDraftAsync_MarketingNotInformed_RecordedAsFalse()
    {
        var service = CreateService();

        var informed = await service.CreateDraftAsync(ValidDraftRequest(marketing: true));
        var notInformed = await service.CreateDraftAsync(ValidDraftRequest(marketing: null));

        Assert.True(informed.AcceptsMarketing);
        Assert.False(notInformed.AcceptsMarketing);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-15: invalid submit keeps the request in Borrador
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-15")]
    [Trait("REQ", "REQ-002-14")]
    public async Task SubmitAsync_InvalidData_StaysInBorrador()
    {
        var service = CreateService();
        var draft = await service.CreateDraftAsync(
            new SaveOnboardingDraftRequest(FirstName: "María"));

        var (response, errors, error) = await service.SubmitAsync(draft.Id);

        Assert.Null(response);
        Assert.Null(error);
        Assert.NotEmpty(errors);
        var reloaded = await service.GetByIdAsync(draft.Id);
        Assert.Equal(OnboardingStatus.Borrador, reloaded!.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-16a: request recoverable by id in any state
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-16a")]
    [Trait("REQ", "REQ-002-15")]
    public async Task GetByIdAsync_AnyState_ReturnsCurrentRequest()
    {
        var service = CreateService();
        var draft = await service.CreateDraftAsync(ValidDraftRequest());

        var asDraft = await service.GetByIdAsync(draft.Id);
        Assert.Equal(OnboardingStatus.Borrador, asDraft!.Status);

        await service.SubmitAsync(draft.Id);
        var submitted = await service.GetByIdAsync(draft.Id);
        Assert.Equal(OnboardingStatus.PendienteVerificacion, submitted!.Status);
        Assert.Equal("María", submitted.FirstName);
        Assert.Equal("12345678Z", submitted.DocumentNumber);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-17a: document with an active request conflicts
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-17a")]
    [Trait("REQ", "REQ-002-16")]
    public async Task SubmitAsync_DocumentWithActiveRequest_Conflicts()
    {
        var service = CreateService();
        await CreateAndSubmitAsync(service);

        var second = await service.CreateDraftAsync(new SaveOnboardingDraftRequest(
            FirstName: "Otro",
            LastName: "Solicitante",
            DocumentType: DocumentType.Dni,
            DocumentNumber: "12 345 678-z",
            BirthDate: new DateTime(1985, 1, 1),
            Email: "otro@example.com",
            MobilePhone: "700123456",
            AcceptsPrivacyPolicy: true));

        var (response, errors, error) = await service.SubmitAsync(second.Id);

        Assert.Null(response);
        Assert.Empty(errors);
        Assert.NotNull(error);
        Assert.Equal(409, error!.Status);
        Assert.Equal("Ya existe una solicitud de alta con ese documento de identidad.", error.Detail);

        var reloaded = await service.GetByIdAsync(second.Id);
        Assert.Equal(OnboardingStatus.Borrador, reloaded!.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-17b: same number with another document type is not a duplicate
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-17b")]
    [Trait("REQ", "REQ-002-16")]
    public async Task SubmitAsync_SameNumberOtherDocumentType_NotDuplicate()
    {
        var service = CreateService();
        await CreateAndSubmitAsync(service, "12345678Z", DocumentType.Pasaporte);

        var response = await CreateAndSubmitAsync(service, "12345678Z", DocumentType.Dni);

        Assert.Equal(OnboardingStatus.PendienteVerificacion, response.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-23: partial draft can be saved
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-23")]
    [Trait("REQ", "REQ-002-18")]
    public async Task CreateDraftAsync_PartialData_CreatesBorrador()
    {
        var service = CreateService();

        var response = await service.CreateDraftAsync(new SaveOnboardingDraftRequest(
            FirstName: "María",
            DocumentType: DocumentType.Dni,
            DocumentNumber: "12345678Z"));

        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.Equal(OnboardingStatus.Borrador, response.Status);
        Assert.Equal("María", response.FirstName);
        Assert.Null(response.LastName);
        Assert.Null(response.Email);

        var empty = await service.CreateDraftAsync(new SaveOnboardingDraftRequest());
        Assert.Equal(OnboardingStatus.Borrador, empty.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-24: draft can be modified while in Borrador
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-24")]
    [Trait("REQ", "REQ-002-19")]
    public async Task UpdateDraftAsync_InBorrador_UpdatesDataKeepsState()
    {
        var service = CreateService();
        var draft = await service.CreateDraftAsync(new SaveOnboardingDraftRequest(FirstName: "María"));

        _clock.Advance(TimeSpan.FromHours(2));
        var (response, error) = await service.UpdateDraftAsync(draft.Id,
            new SaveOnboardingDraftRequest(LastName: "García López", Email: "maria@banco.es"));

        Assert.Null(error);
        Assert.Equal("María", response!.FirstName);
        Assert.Equal("García López", response.LastName);
        Assert.Equal("maria@banco.es", response.Email);
        Assert.Equal(OnboardingStatus.Borrador, response.Status);
        Assert.True(response.UpdatedAt > response.CreatedAt);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-25: submitting an incomplete draft returns all errors
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-25")]
    [Trait("REQ", "REQ-002-20")]
    public async Task SubmitAsync_IncompleteDraft_ReturnsAllErrorsStaysBorrador()
    {
        var service = CreateService();
        var draft = await service.CreateDraftAsync(new SaveOnboardingDraftRequest(
            FirstName: "María"));

        var (response, errors, error) = await service.SubmitAsync(draft.Id);

        Assert.Null(response);
        Assert.Null(error);
        Assert.Contains("Los apellidos son obligatorios.", errors);
        Assert.Contains("El tipo de documento es obligatorio.", errors);
        Assert.Contains("La fecha de nacimiento es obligatoria.", errors);
        Assert.Contains("El correo electrónico es obligatorio.", errors);
        Assert.Contains("El teléfono móvil es obligatorio.", errors);
        Assert.Contains("Debes aceptar la política de protección de datos.", errors);

        var reloaded = await service.GetByIdAsync(draft.Id);
        Assert.Equal(OnboardingStatus.Borrador, reloaded!.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-27: successful verification → Verificada
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-27")]
    [Trait("REQ", "REQ-002-21")]
    [Trait("REQ", "REQ-002-22")]
    public async Task VerifyAsync_Verified_MovesToVerificada()
    {
        var service = CreateService();
        var submitted = await CreateAndSubmitAsync(service);

        _clock.Advance(TimeSpan.FromMinutes(5));
        var (response, error) = await service.VerifyAsync(submitted.Id);

        Assert.Null(error);
        Assert.Equal(OnboardingStatus.Verificada, response!.Status);
        Assert.Equal(_clock.UtcNow.UtcDateTime, response.VerifiedAt);
        Assert.Null(response.ExpiresAt);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-28: rejected verification → Rechazada with reason
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-28")]
    [Trait("REQ", "REQ-002-21")]
    [Trait("REQ", "REQ-002-22")]
    public async Task VerifyAsync_DocumentStartingWith99_MovesToRechazada()
    {
        var service = CreateService();
        var submitted = await CreateAndSubmitAsync(service, "99123456B");

        var (response, error) = await service.VerifyAsync(submitted.Id);

        Assert.Null(error);
        Assert.Equal(OnboardingStatus.Rechazada, response!.Status);
        Assert.Equal(RejectionReason, response.RejectionReason);
        Assert.NotNull(response.VerifiedAt);
    }

    [Fact]
    [Trait("AC", "AC-002-28")]
    [Trait("REQ", "REQ-002-22")]
    public async Task VerifyAsync_ProviderRejects_MovesToRechazada()
    {
        var service = CreateService(new StubIdentityVerificationService(
            IdentityVerificationResult.Rejected("Documento no verificable.")));
        var submitted = await CreateAndSubmitAsync(service);

        var (response, error) = await service.VerifyAsync(submitted.Id);

        Assert.Null(error);
        Assert.Equal(OnboardingStatus.Rechazada, response!.Status);
        Assert.Equal("Documento no verificable.", response.RejectionReason);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-29: completing a verified request creates the client
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-29")]
    [Trait("REQ", "REQ-002-23")]
    public async Task CompleteAsync_Verified_MovesToClienteCreado()
    {
        var service = CreateService();
        var submitted = await CreateAndSubmitAsync(service);
        await service.VerifyAsync(submitted.Id);

        var (response, error) = await service.CompleteAsync(submitted.Id);

        Assert.Null(error);
        Assert.Equal(OnboardingStatus.ClienteCreado, response!.Status);
        Assert.Null(response.ExpiresAt);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-30: abandoned draft expires after 30 days
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-30")]
    [Trait("REQ", "REQ-002-24")]
    public async Task GetByIdAsync_DraftOlderThan30Days_ReturnsCaducada()
    {
        var service = CreateService();
        var draft = await service.CreateDraftAsync(ValidDraftRequest());

        _clock.Advance(TimeSpan.FromDays(31));

        var expired = await service.GetByIdAsync(draft.Id);
        Assert.Equal(OnboardingStatus.Caducada, expired!.Status);

        var (patched, patchError) = await service.UpdateDraftAsync(draft.Id, new SaveOnboardingDraftRequest(FirstName: "Otro"));
        Assert.Null(patched);
        Assert.Equal(409, patchError!.Status);

        var (submitted, _, submitError) = await service.SubmitAsync(draft.Id);
        Assert.Null(submitted);
        Assert.Equal(409, submitError!.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-31: pending verification expires 30 days after submit
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-31")]
    [Trait("REQ", "REQ-002-24")]
    public async Task GetByIdAsync_PendingVerificationOlderThan30Days_ReturnsCaducada()
    {
        var service = CreateService();
        var submitted = await CreateAndSubmitAsync(service);

        _clock.Advance(TimeSpan.FromDays(31));

        var expired = await service.GetByIdAsync(submitted.Id);
        Assert.Equal(OnboardingStatus.Caducada, expired!.Status);

        var (verified, error) = await service.VerifyAsync(submitted.Id);
        Assert.Null(verified);
        Assert.Equal(409, error!.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-32: invalid transitions are rejected with 409
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-32")]
    [Trait("REQ", "REQ-002-25")]
    public async Task UpdateDraftAsync_NotInBorrador_Conflicts()
    {
        var service = CreateService();
        var submitted = await CreateAndSubmitAsync(service);

        var (response, error) = await service.UpdateDraftAsync(
            submitted.Id, new SaveOnboardingDraftRequest(FirstName: "Otro"));

        Assert.Null(response);
        Assert.Equal(409, error!.Status);
        var reloaded = await service.GetByIdAsync(submitted.Id);
        Assert.Equal(OnboardingStatus.PendienteVerificacion, reloaded!.Status);
    }

    [Fact]
    [Trait("AC", "AC-002-32")]
    [Trait("REQ", "REQ-002-25")]
    public async Task VerifyAsync_InBorrador_Conflicts()
    {
        var service = CreateService();
        var draft = await service.CreateDraftAsync(ValidDraftRequest());

        var (response, error) = await service.VerifyAsync(draft.Id);

        Assert.Null(response);
        Assert.Equal(409, error!.Status);
        Assert.Equal(OnboardingStatus.Borrador, (await service.GetByIdAsync(draft.Id))!.Status);
    }

    [Fact]
    [Trait("AC", "AC-002-32")]
    [Trait("REQ", "REQ-002-25")]
    public async Task CompleteAsync_InPendienteVerificacion_Conflicts()
    {
        var service = CreateService();
        var submitted = await CreateAndSubmitAsync(service);

        var (response, error) = await service.CompleteAsync(submitted.Id);

        Assert.Null(response);
        Assert.Equal(409, error!.Status);
    }

    [Fact]
    [Trait("AC", "AC-002-32")]
    [Trait("REQ", "REQ-002-25")]
    public async Task SubmitAsync_AlreadySubmitted_Conflicts()
    {
        var service = CreateService();
        var submitted = await CreateAndSubmitAsync(service);

        var (response, _, error) = await service.SubmitAsync(submitted.Id);

        Assert.Null(response);
        Assert.Equal(409, error!.Status);
    }

    [Fact]
    [Trait("AC", "AC-002-32")]
    [Trait("REQ", "REQ-002-25")]
    public async Task AnyOperation_OnRechazada_Conflicts()
    {
        var service = CreateService();
        var rejected = await CreateAndSubmitAsync(service, "99123456B");
        await service.VerifyAsync(rejected.Id);

        Assert.Equal(409, (await service.UpdateDraftAsync(rejected.Id, new SaveOnboardingDraftRequest(FirstName: "Otro"))).Error!.Status);
        Assert.Equal(409, (await service.SubmitAsync(rejected.Id)).Error!.Status);
        Assert.Equal(409, (await service.VerifyAsync(rejected.Id)).Error!.Status);
        Assert.Equal(409, (await service.CompleteAsync(rejected.Id)).Error!.Status);
        Assert.Equal(OnboardingStatus.Rechazada, (await service.GetByIdAsync(rejected.Id))!.Status);
    }

    [Fact]
    [Trait("AC", "AC-002-32")]
    [Trait("REQ", "REQ-002-25")]
    public async Task AnyOperation_OnClienteCreado_Conflicts()
    {
        var service = CreateService();
        var submitted = await CreateAndSubmitAsync(service);
        await service.VerifyAsync(submitted.Id);
        await service.CompleteAsync(submitted.Id);

        Assert.Equal(409, (await service.UpdateDraftAsync(submitted.Id, new SaveOnboardingDraftRequest(FirstName: "Otro"))).Error!.Status);
        Assert.Equal(409, (await service.SubmitAsync(submitted.Id)).Error!.Status);
        Assert.Equal(409, (await service.VerifyAsync(submitted.Id)).Error!.Status);
        Assert.Equal(409, (await service.CompleteAsync(submitted.Id)).Error!.Status);
        Assert.Equal(OnboardingStatus.ClienteCreado, (await service.GetByIdAsync(submitted.Id))!.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-33: drafts don't block each other; the block applies on submit
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-33")]
    [Trait("REQ", "REQ-002-16")]
    public async Task SubmitAsync_TwoDraftsSameDocument_SecondConflictsOnlyOnSubmit()
    {
        var service = CreateService();
        var first = await service.CreateDraftAsync(ValidDraftRequest());
        var second = await service.CreateDraftAsync(ValidDraftRequest());

        Assert.Equal(OnboardingStatus.Borrador, first.Status);
        Assert.Equal(OnboardingStatus.Borrador, second.Status);

        var (firstResponse, _, firstError) = await service.SubmitAsync(first.Id);
        Assert.Null(firstError);
        Assert.Equal(OnboardingStatus.PendienteVerificacion, firstResponse!.Status);

        var (secondResponse, _, secondError) = await service.SubmitAsync(second.Id);
        Assert.Null(secondResponse);
        Assert.Equal(409, secondError!.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-002-34: Rechazada / Caducada don't block a new request
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-002-34")]
    [Trait("REQ", "REQ-002-16")]
    public async Task SubmitAsync_DocumentFromRechazada_DoesNotBlock()
    {
        var service = CreateService();
        var rejected = await CreateAndSubmitAsync(service, "99123456B");
        await service.VerifyAsync(rejected.Id);

        var again = await CreateAndSubmitAsync(service, "99123456B");

        Assert.Equal(OnboardingStatus.PendienteVerificacion, again.Status);
    }

    [Fact]
    [Trait("AC", "AC-002-34")]
    [Trait("REQ", "REQ-002-16")]
    public async Task SubmitAsync_DocumentFromCaducada_DoesNotBlock()
    {
        var service = CreateService();
        var draft = await service.CreateDraftAsync(ValidDraftRequest());
        _clock.Advance(TimeSpan.FromDays(31));
        var expired = await service.GetByIdAsync(draft.Id);
        Assert.Equal(OnboardingStatus.Caducada, expired!.Status);

        var again = await CreateAndSubmitAsync(service);

        Assert.Equal(OnboardingStatus.PendienteVerificacion, again.Status);
    }
}
