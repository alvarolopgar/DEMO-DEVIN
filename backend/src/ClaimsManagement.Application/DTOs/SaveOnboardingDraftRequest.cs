using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Application.DTOs;

public sealed record SaveOnboardingDraftRequest(
    string? FirstName = null,
    string? LastName = null,
    DocumentType? DocumentType = null,
    string? DocumentNumber = null,
    DateTime? BirthDate = null,
    string? Email = null,
    string? MobilePhone = null,
    bool? AcceptsPrivacyPolicy = null,
    bool? AcceptsMarketing = null);
