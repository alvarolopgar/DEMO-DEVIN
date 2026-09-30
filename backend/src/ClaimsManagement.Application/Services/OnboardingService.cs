using ClaimsManagement.Application.Common;
using ClaimsManagement.Application.DTOs;
using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Application.Validators;
using ClaimsManagement.Application.Verification;
using ClaimsManagement.Domain.Entities;
using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Application.Services;

public class OnboardingService
{
    private readonly IOnboardingRequestRepository _repository;
    private readonly IIdentityVerificationService _verificationService;
    private readonly TimeProvider _timeProvider;

    public OnboardingService(
        IOnboardingRequestRepository repository,
        IIdentityVerificationService verificationService,
        TimeProvider? timeProvider = null)
    {
        _repository = repository;
        _verificationService = verificationService;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    private DateTime Now => _timeProvider.GetUtcNow().UtcDateTime;

    public async Task<OnboardingResponse> CreateDraftAsync(
        SaveOnboardingDraftRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = Now;
        var entity = OnboardingRequest.CreateDraft(
            request.FirstName,
            request.LastName,
            request.DocumentType,
            SpanishIdDocument.Normalize(request.DocumentNumber),
            request.BirthDate,
            request.Email,
            request.MobilePhone,
            request.AcceptsPrivacyPolicy,
            request.AcceptsMarketing ?? false,
            now);

        var saved = await _repository.AddAsync(entity, cancellationToken);
        return OnboardingResponse.FromEntity(saved);
    }

    public async Task<OnboardingResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetFreshAsync(id, cancellationToken);
        return entity is null ? null : OnboardingResponse.FromEntity(entity);
    }

    public async Task<(OnboardingResponse? Response, OnboardingError? Error)> UpdateDraftAsync(
        Guid id,
        SaveOnboardingDraftRequest request,
        CancellationToken cancellationToken = default)
    {
        var entity = await GetFreshAsync(id, cancellationToken);
        if (entity is null)
            return (null, OnboardingError.NotFound());
        if (entity.Status != OnboardingStatus.Borrador)
            return (null, OnboardingError.Conflict(
                $"La solicitud está en estado {entity.Status}; no se puede modificar."));

        entity.UpdateDraft(
            request.FirstName,
            request.LastName,
            request.DocumentType,
            request.DocumentNumber is null ? null : SpanishIdDocument.Normalize(request.DocumentNumber),
            request.BirthDate,
            request.Email,
            request.MobilePhone,
            request.AcceptsPrivacyPolicy,
            request.AcceptsMarketing,
            Now);

        var saved = await _repository.UpdateAsync(entity, cancellationToken);
        return (OnboardingResponse.FromEntity(saved), null);
    }

    public async Task<(OnboardingResponse? Response, List<string> Errors, OnboardingError? Error)> SubmitAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var entity = await GetFreshAsync(id, cancellationToken);
        if (entity is null)
            return (null, [], OnboardingError.NotFound());
        if (entity.Status != OnboardingStatus.Borrador)
            return (null, [], OnboardingError.Conflict(
                $"La solicitud está en estado {entity.Status}; no se puede enviar."));

        var errors = SubmitOnboardingValidator.Validate(entity, _timeProvider);
        if (errors.Count > 0)
            return (null, errors, null);

        var hasActiveDuplicate = await _repository.HasActiveRequestWithDocumentAsync(
            entity.DocumentType!.Value, entity.DocumentNumber!, entity.Id, cancellationToken);
        if (hasActiveDuplicate)
            return (null, [], OnboardingError.Conflict(
                SubmitOnboardingValidator.DuplicateDocumentMessage,
                [SubmitOnboardingValidator.DuplicateDocumentMessage]));

        entity.Submit(Now);
        var saved = await _repository.UpdateAsync(entity, cancellationToken);
        return (OnboardingResponse.FromEntity(saved), [], null);
    }

    public async Task<(OnboardingResponse? Response, OnboardingError? Error)> VerifyAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var entity = await GetFreshAsync(id, cancellationToken);
        if (entity is null)
            return (null, OnboardingError.NotFound());
        if (entity.Status != OnboardingStatus.PendienteVerificacion)
            return (null, OnboardingError.Conflict(
                $"La solicitud está en estado {entity.Status}; no se puede verificar."));

        var result = await _verificationService.VerifyAsync(
            new IdentityVerificationRequest(
                entity.DocumentType!.Value.ToString(),
                entity.DocumentNumber!,
                entity.FirstName!,
                entity.LastName!,
                DateOnly.FromDateTime(entity.BirthDate!.Value)),
            cancellationToken);

        entity.ApplyVerification(
            result.Outcome == IdentityVerificationOutcome.Verified,
            result.Reason,
            Now);
        var saved = await _repository.UpdateAsync(entity, cancellationToken);
        return (OnboardingResponse.FromEntity(saved), null);
    }

    public async Task<(OnboardingResponse? Response, OnboardingError? Error)> CompleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var entity = await GetFreshAsync(id, cancellationToken);
        if (entity is null)
            return (null, OnboardingError.NotFound());
        if (entity.Status != OnboardingStatus.Verificada)
            return (null, OnboardingError.Conflict(
                $"La solicitud está en estado {entity.Status}; no se puede completar."));

        entity.Complete(Now);
        var saved = await _repository.UpdateAsync(entity, cancellationToken);
        return (OnboardingResponse.FromEntity(saved), null);
    }

    private async Task<OnboardingRequest?> GetFreshAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        entity?.ExpireIfNeeded(Now);
        return entity;
    }
}
