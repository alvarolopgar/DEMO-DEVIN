using System.Text.RegularExpressions;
using ClaimsManagement.Application.Common;
using ClaimsManagement.Domain.Entities;
using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Application.Validators;

public static partial class SubmitOnboardingValidator
{
    public const string DuplicateDocumentMessage = "Ya existe una solicitud de alta con ese documento de identidad.";

    public static List<string> Validate(OnboardingRequest request, TimeProvider? timeProvider = null)
    {
        var clock = timeProvider ?? TimeProvider.System;
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.FirstName))
            errors.Add("El nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.LastName))
            errors.Add("Los apellidos son obligatorios.");

        if (request.DocumentType is null || !Enum.IsDefined(request.DocumentType.Value))
            errors.Add("El tipo de documento es obligatorio.");
        else if (string.IsNullOrWhiteSpace(request.DocumentNumber))
            errors.Add("El número de documento es obligatorio.");
        else if (!IsValidDocumentNumber(request.DocumentType.Value, SpanishIdDocument.Normalize(request.DocumentNumber)))
            errors.Add("El número de documento no es válido.");

        if (request.BirthDate is null)
            errors.Add("La fecha de nacimiento es obligatoria.");
        else if (!IsOfAge(request.BirthDate.Value, clock))
            errors.Add("Debes ser mayor de edad para darte de alta.");

        if (string.IsNullOrWhiteSpace(request.Email))
            errors.Add("El correo electrónico es obligatorio.");
        else if (!EmailRegex().IsMatch(request.Email.Trim()))
            errors.Add("El correo electrónico no es válido.");

        if (string.IsNullOrWhiteSpace(request.MobilePhone))
            errors.Add("El teléfono móvil es obligatorio.");
        else if (!MobilePhoneRegex().IsMatch(request.MobilePhone))
            errors.Add("El teléfono móvil debe tener 9 dígitos y empezar por 6 o 7.");

        if (request.AcceptsPrivacyPolicy != true)
            errors.Add("Debes aceptar la política de protección de datos.");

        return errors;
    }

    public static bool IsValidDocumentNumber(DocumentType type, string normalizedDocument) =>
        type switch
        {
            DocumentType.Dni => SpanishIdDocument.IsValidDni(normalizedDocument),
            DocumentType.Nie => SpanishIdDocument.IsValidNie(normalizedDocument),
            DocumentType.Pasaporte => normalizedDocument.Length > 0,
            _ => false,
        };

    public static bool IsOfAge(DateTime birthDate, TimeProvider clock) =>
        DateOnly.FromDateTime(birthDate).AddYears(18) <= BusinessDate.Today(clock);

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"^[67]\d{8}$")]
    private static partial Regex MobilePhoneRegex();
}
