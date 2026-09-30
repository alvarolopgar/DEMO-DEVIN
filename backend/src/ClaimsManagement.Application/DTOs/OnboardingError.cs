namespace ClaimsManagement.Application.DTOs;

public sealed record OnboardingError(
    int Status,
    string Title,
    string Detail,
    IReadOnlyList<string>? ValidationErrors = null)
{
    public static OnboardingError NotFound() =>
        new(404, "Not Found", "No existe ninguna solicitud de alta con ese identificador.");

    public static OnboardingError Conflict(string detail, IReadOnlyList<string>? validationErrors = null) =>
        new(409, "Conflict", detail, validationErrors);
}
