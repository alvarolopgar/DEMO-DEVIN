using ClaimsManagement.Domain.Entities;
using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Application.DTOs;

public sealed record OnboardingResponse(
    Guid Id,
    string? FirstName,
    string? LastName,
    DocumentType? DocumentType,
    string? DocumentNumber,
    DateTime? BirthDate,
    string? Email,
    string? MobilePhone,
    bool? AcceptsPrivacyPolicy,
    bool AcceptsMarketing,
    OnboardingStatus Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? SubmittedAt,
    DateTime? VerifiedAt,
    DateTime? ExpiresAt,
    string? RejectionReason)
{
    public static OnboardingResponse FromEntity(OnboardingRequest request) =>
        new(
            request.Id,
            request.FirstName,
            request.LastName,
            request.DocumentType,
            request.DocumentNumber,
            request.BirthDate,
            request.Email,
            request.MobilePhone,
            request.AcceptsPrivacyPolicy,
            request.AcceptsMarketing,
            request.Status,
            request.CreatedAt,
            request.UpdatedAt,
            request.SubmittedAt,
            request.VerifiedAt,
            request.ExpiresAt,
            request.RejectionReason);
}
