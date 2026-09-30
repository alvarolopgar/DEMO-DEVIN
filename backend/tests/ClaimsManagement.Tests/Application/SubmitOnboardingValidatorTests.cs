using ClaimsManagement.Application.Validators;
using ClaimsManagement.Domain.Entities;
using ClaimsManagement.Domain.Enums;
using ClaimsManagement.Tests.Helpers;

namespace ClaimsManagement.Tests.Application;

/// <summary>
/// Tests for SubmitOnboardingValidator - business validation applied on submit.
/// Maps to SPEC-002 acceptance criteria.
/// </summary>
public class SubmitOnboardingValidatorTests
{
    private static readonly DateTime Now = new(2026, 9, 30, 12, 0, 0, DateTimeKind.Utc);
    private static readonly TimeProvider Clock = FixedTimeProvider.AtUtc("2026-09-30T12:00:00Z");

    private static OnboardingRequest ValidDraft(
        string? firstName = "María",
        string? lastName = "García López",
        DocumentType? documentType = DocumentType.Dni,
        string? documentNumber = "12345678Z",
        DateTime? birthDate = null,
        string? email = "maria.garcia@example.com",
        string? mobilePhone = "612345678",
        bool? acceptsPrivacyPolicy = true)
    {
        return OnboardingRequest.CreateDraft(
            firstName, lastName, documentType, documentNumber,
            birthDate ?? new DateTime(1990, 5, 12),
            email, mobilePhone, acceptsPrivacyPolicy, acceptsMarketing: false,
            Now);
    }

    [Fact]
    public void Validate_AllValid_ReturnsNoErrors()
    {
        Assert.Empty(SubmitOnboardingValidator.Validate(ValidDraft(), Clock));
    }

    [Theory]
    [Trait("AC", "AC-002-04")]
    [Trait("REQ", "REQ-002-01")]
    [InlineData("nombre", "El nombre es obligatorio.")]
    [InlineData("apellidos", "Los apellidos son obligatorios.")]
    [InlineData("tipo de documento", "El tipo de documento es obligatorio.")]
    [InlineData("número de documento", "El número de documento es obligatorio.")]
    [InlineData("fecha de nacimiento", "La fecha de nacimiento es obligatoria.")]
    [InlineData("correo electrónico", "El correo electrónico es obligatorio.")]
    [InlineData("teléfono móvil", "El teléfono móvil es obligatorio.")]
    public void Validate_MissingMandatoryField_ReturnsItsMessage(string campo, string expectedMessage)
    {
        var draft = campo switch
        {
            "nombre" => ValidDraft(firstName: null),
            "apellidos" => ValidDraft(lastName: null),
            "tipo de documento" => ValidDraft(documentType: null),
            "número de documento" => ValidDraft(documentNumber: null),
            "fecha de nacimiento" => OnboardingRequest.CreateDraft(
                "María", "García López", DocumentType.Dni, "12345678Z", null,
                "maria.garcia@example.com", "612345678", true, false, Now),
            "correo electrónico" => ValidDraft(email: null),
            "teléfono móvil" => ValidDraft(mobilePhone: null),
            _ => throw new ArgumentOutOfRangeException(nameof(campo)),
        };

        var errors = SubmitOnboardingValidator.Validate(draft, Clock);

        Assert.Contains(expectedMessage, errors);
    }

    [Theory]
    [Trait("AC", "AC-002-05")]
    [Trait("REQ", "REQ-002-02")]
    [InlineData("   ")]
    [InlineData(" \t \n ")]
    public void Validate_WhitespaceOnlyText_TreatedAsMissing(string whitespace)
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(firstName: whitespace), Clock);

        Assert.Contains("El nombre es obligatorio.", errors);
    }

    [Fact]
    [Trait("AC", "AC-002-06a")]
    [Trait("REQ", "REQ-002-04")]
    public void Validate_Turns18Today_ReturnsNoBirthDateError()
    {
        var errors = SubmitOnboardingValidator.Validate(
            ValidDraft(birthDate: new DateTime(2008, 9, 30)), Clock);

        Assert.DoesNotContain("Debes ser mayor de edad para darte de alta.", errors);
    }

    [Fact]
    [Trait("AC", "AC-002-06b")]
    [Trait("REQ", "REQ-002-04")]
    public void Validate_Turns18Tomorrow_ReturnsUnderAgeError()
    {
        var errors = SubmitOnboardingValidator.Validate(
            ValidDraft(birthDate: new DateTime(2008, 10, 1)), Clock);

        Assert.Contains("Debes ser mayor de edad para darte de alta.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-06c")]
    [Trait("REQ", "REQ-002-04")]
    [InlineData("2015-01-01")]
    [InlineData("2027-01-01")]
    public void Validate_UnderAge_ReturnsUnderAgeError(string birthDate)
    {
        var errors = SubmitOnboardingValidator.Validate(
            ValidDraft(birthDate: DateTime.Parse(birthDate)), Clock);

        Assert.Contains("Debes ser mayor de edad para darte de alta.", errors);
    }

    [Fact]
    [Trait("AC", "AC-002-06d")]
    [Trait("REQ", "REQ-002-04")]
    public void Validate_Born29Feb_Turns18On28FebOfNonLeapYear()
    {
        var clock = FixedTimeProvider.AtUtc("2026-02-28T10:00:00Z");
        var errors = SubmitOnboardingValidator.Validate(
            ValidDraft(birthDate: new DateTime(2008, 2, 29)), clock);

        Assert.DoesNotContain("Debes ser mayor de edad para darte de alta.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-07a")]
    [Trait("REQ", "REQ-002-05")]
    [InlineData("12345678Z")]
    [InlineData("00000001R")]
    [InlineData("87654321X")]
    public void Validate_ValidDni_ReturnsNoDocumentError(string dni)
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(documentNumber: dni), Clock);

        Assert.DoesNotContain("El número de documento no es válido.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-07b")]
    [Trait("REQ", "REQ-002-05")]
    [InlineData("12345678A")]
    public void Validate_DniWrongControlLetter_ReturnsDocumentError(string dni)
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(documentNumber: dni), Clock);

        Assert.Contains("El número de documento no es válido.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-07c")]
    [Trait("REQ", "REQ-002-05")]
    [InlineData("1234567")]
    [InlineData("123456789")]
    [InlineData("12345678")]
    [InlineData("1234567Z")]
    [InlineData("1234A678Z")]
    [InlineData("123456780")]
    public void Validate_DniInvalidFormat_ReturnsDocumentError(string dni)
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(documentNumber: dni), Clock);

        Assert.Contains("El número de documento no es válido.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-08a")]
    [Trait("REQ", "REQ-002-06")]
    [InlineData("X1234567L")]
    [InlineData("Z9876543A")]
    public void Validate_ValidNie_ReturnsNoDocumentError(string nie)
    {
        var errors = SubmitOnboardingValidator.Validate(
            ValidDraft(documentType: DocumentType.Nie, documentNumber: nie), Clock);

        Assert.DoesNotContain("El número de documento no es válido.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-08b")]
    [Trait("REQ", "REQ-002-06")]
    [InlineData("W1234567L")]
    [InlineData("X1234567A")]
    [InlineData("X123456L")]
    [InlineData("X12345678")]
    public void Validate_InvalidNie_ReturnsDocumentError(string nie)
    {
        var errors = SubmitOnboardingValidator.Validate(
            ValidDraft(documentType: DocumentType.Nie, documentNumber: nie), Clock);

        Assert.Contains("El número de documento no es válido.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-09")]
    [Trait("REQ", "REQ-002-07")]
    [InlineData("PAA123456")]
    [InlineData("AA-123456-B")]
    public void Validate_PassportAnyValue_ReturnsNoDocumentError(string pasaporte)
    {
        var errors = SubmitOnboardingValidator.Validate(
            ValidDraft(documentType: DocumentType.Pasaporte, documentNumber: pasaporte), Clock);

        Assert.DoesNotContain("El número de documento no es válido.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-10")]
    [Trait("REQ", "REQ-002-08")]
    [InlineData("12345678z")]
    [InlineData("12345678 Z")]
    [InlineData("12345678-Z")]
    [InlineData("12345678Z ")]
    public void Validate_DocumentNeedsNormalizing_ValidatesAfterNormalize(string entrada)
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(documentNumber: entrada), Clock);

        Assert.DoesNotContain("El número de documento no es válido.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-11a")]
    [Trait("REQ", "REQ-002-09")]
    [InlineData("cliente@example.com")]
    [InlineData("nombre.apellido@banco.es")]
    [InlineData("cliente+tag@dominio.io")]
    public void Validate_ValidEmail_ReturnsNoEmailError(string email)
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(email: email), Clock);

        Assert.DoesNotContain("El correo electrónico no es válido.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-11b")]
    [Trait("REQ", "REQ-002-09")]
    [InlineData("cliente")]
    [InlineData("cliente@")]
    [InlineData("@dominio.com")]
    [InlineData("cliente@dominio")]
    [InlineData("cliente dominio.es")]
    public void Validate_InvalidEmail_ReturnsEmailError(string email)
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(email: email), Clock);

        Assert.Contains("El correo electrónico no es válido.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-12a")]
    [Trait("REQ", "REQ-002-10")]
    [InlineData("612345678")]
    [InlineData("700123456")]
    public void Validate_ValidMobile_ReturnsNoPhoneError(string phone)
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(mobilePhone: phone), Clock);

        Assert.DoesNotContain("El teléfono móvil debe tener 9 dígitos y empezar por 6 o 7.", errors);
    }

    [Theory]
    [Trait("AC", "AC-002-12b")]
    [Trait("REQ", "REQ-002-10")]
    [InlineData("512345678")]
    [InlineData("912345678")]
    [InlineData("61234567")]
    [InlineData("6123456789")]
    [InlineData("+34612345678")]
    [InlineData("61 234 56 78")]
    public void Validate_InvalidMobile_ReturnsPhoneError(string phone)
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(mobilePhone: phone), Clock);

        Assert.Contains("El teléfono móvil debe tener 9 dígitos y empezar por 6 o 7.", errors);
    }

    [Fact]
    [Trait("AC", "AC-002-13a")]
    [Trait("REQ", "REQ-002-11")]
    public void Validate_PrivacyPolicyNotAccepted_ReturnsConsentError()
    {
        var errors = SubmitOnboardingValidator.Validate(ValidDraft(acceptsPrivacyPolicy: false), Clock);

        Assert.Contains("Debes aceptar la política de protección de datos.", errors);
    }

    [Fact]
    [Trait("AC", "AC-002-14")]
    [Trait("REQ", "REQ-002-13")]
    public void Validate_SeveralInvalidFields_ReturnsAllErrorsAtOnce()
    {
        var draft = ValidDraft(
            firstName: null,
            lastName: " ",
            documentNumber: null,
            birthDate: new DateTime(2015, 1, 1),
            email: "cliente");

        var errors = SubmitOnboardingValidator.Validate(draft, Clock);

        Assert.Contains("El nombre es obligatorio.", errors);
        Assert.Contains("Los apellidos son obligatorios.", errors);
        Assert.Contains("El número de documento es obligatorio.", errors);
        Assert.Contains("Debes ser mayor de edad para darte de alta.", errors);
        Assert.Contains("El correo electrónico no es válido.", errors);
        Assert.True(errors.Count >= 5);
    }
}
