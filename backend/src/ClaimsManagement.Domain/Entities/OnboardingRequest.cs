using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Domain.Entities;

public class OnboardingRequest
{
    public static readonly TimeSpan DraftTimeToLive = TimeSpan.FromDays(30);
    public static readonly TimeSpan PendingVerificationTimeToLive = TimeSpan.FromDays(30);

    private static readonly OnboardingStatus[] ActiveStatuses =
    [
        OnboardingStatus.PendienteVerificacion,
        OnboardingStatus.Verificada,
        OnboardingStatus.ClienteCreado,
    ];

    public Guid Id { get; private set; }
    public string? FirstName { get; private set; }
    public string? LastName { get; private set; }
    public DocumentType? DocumentType { get; private set; }
    public string? DocumentNumber { get; private set; }
    public DateTime? BirthDate { get; private set; }
    public string? Email { get; private set; }
    public string? MobilePhone { get; private set; }
    public bool? AcceptsPrivacyPolicy { get; private set; }
    public bool AcceptsMarketing { get; private set; }
    public OnboardingStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? SubmittedAt { get; private set; }
    public DateTime? VerifiedAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public string? RejectionReason { get; private set; }

    private OnboardingRequest() { }

    public bool IsActive => ActiveStatuses.Contains(Status);

    public static OnboardingRequest CreateDraft(
        string? firstName,
        string? lastName,
        DocumentType? documentType,
        string? documentNumber,
        DateTime? birthDate,
        string? email,
        string? mobilePhone,
        bool? acceptsPrivacyPolicy,
        bool acceptsMarketing,
        DateTime now)
    {
        return new OnboardingRequest
        {
            Id = Guid.NewGuid(),
            FirstName = firstName,
            LastName = lastName,
            DocumentType = documentType,
            DocumentNumber = documentNumber,
            BirthDate = birthDate,
            Email = email,
            MobilePhone = mobilePhone,
            AcceptsPrivacyPolicy = acceptsPrivacyPolicy,
            AcceptsMarketing = acceptsMarketing,
            Status = OnboardingStatus.Borrador,
            CreatedAt = now,
            UpdatedAt = now,
            ExpiresAt = now + DraftTimeToLive,
        };
    }

    public void UpdateDraft(
        string? firstName,
        string? lastName,
        DocumentType? documentType,
        string? documentNumber,
        DateTime? birthDate,
        string? email,
        string? mobilePhone,
        bool? acceptsPrivacyPolicy,
        bool? acceptsMarketing,
        DateTime now)
    {
        EnsureStatus(OnboardingStatus.Borrador, "modificar");

        if (firstName is not null) FirstName = firstName;
        if (lastName is not null) LastName = lastName;
        if (documentType is not null) DocumentType = documentType;
        if (documentNumber is not null) DocumentNumber = documentNumber;
        if (birthDate is not null) BirthDate = birthDate;
        if (email is not null) Email = email;
        if (mobilePhone is not null) MobilePhone = mobilePhone;
        if (acceptsPrivacyPolicy is not null) AcceptsPrivacyPolicy = acceptsPrivacyPolicy;
        if (acceptsMarketing is not null) AcceptsMarketing = acceptsMarketing.Value;
        UpdatedAt = now;
    }

    public void Submit(DateTime now)
    {
        EnsureStatus(OnboardingStatus.Borrador, "enviar");

        Status = OnboardingStatus.PendienteVerificacion;
        SubmittedAt = now;
        UpdatedAt = now;
        ExpiresAt = now + PendingVerificationTimeToLive;
    }

    public void ApplyVerification(bool verified, string? rejectionReason, DateTime now)
    {
        EnsureStatus(OnboardingStatus.PendienteVerificacion, "verificar");

        Status = verified ? OnboardingStatus.Verificada : OnboardingStatus.Rechazada;
        RejectionReason = verified ? null : rejectionReason;
        VerifiedAt = now;
        UpdatedAt = now;
        ExpiresAt = null;
    }

    public void Complete(DateTime now)
    {
        EnsureStatus(OnboardingStatus.Verificada, "completar");

        Status = OnboardingStatus.ClienteCreado;
        UpdatedAt = now;
    }

    public void ExpireIfNeeded(DateTime now)
    {
        if ((Status == OnboardingStatus.Borrador || Status == OnboardingStatus.PendienteVerificacion)
            && ExpiresAt is not null && now >= ExpiresAt)
        {
            Status = OnboardingStatus.Caducada;
            UpdatedAt = now;
        }
    }

    private void EnsureStatus(OnboardingStatus expected, string operation)
    {
        if (Status != expected)
            throw new InvalidOperationException(
                $"La solicitud está en estado {Status}; no se puede {operation}.");
    }
}
