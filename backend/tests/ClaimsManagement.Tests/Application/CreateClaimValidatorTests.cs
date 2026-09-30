using ClaimsManagement.Application.Validators;
using ClaimsManagement.Domain.Enums;
using ClaimsManagement.Tests.Helpers;

namespace ClaimsManagement.Tests.Application;

/// <summary>
/// Tests for CreateClaimValidator - Business rule validation.
/// Maps to KAN-5 acceptance criteria:
///   AC-04: Date cannot be in the future
///   AC-05: Postal code must be exactly 5 digits
///   AC-06: All mandatory fields are validated
///   AC-07: Multiple validation errors returned simultaneously
/// Edge cases: whitespace-only fields, boundary dates, postal code formats
/// </summary>
public class CreateClaimValidatorTests
{
    // ═══════════════════════════════════════════════════════════
    // AC-06: MANDATORY FIELD VALIDATIONS
    // Given a request with empty/null fields,
    // When validated, Then appropriate error messages are returned
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-001-04")]
    [Trait("REQ", "REQ-001-01")]
    public void Validate_EmptyPolicyNumber_ShouldReturnError()
    {
        var request = TestDataBuilder.ValidRequest(policyNumber: "");
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("El número de póliza es obligatorio.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-05")]
    [Trait("REQ", "REQ-001-02")]
    public void Validate_WhitespaceOnlyPolicyNumber_ShouldReturnError()
    {
        var request = TestDataBuilder.ValidRequest(policyNumber: "   ");
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("El número de póliza es obligatorio.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-04")]
    [Trait("REQ", "REQ-001-01")]
    public void Validate_EmptyVehiclePlate_ShouldReturnError()
    {
        var request = TestDataBuilder.ValidRequest(vehiclePlate: "");
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("La matrícula del vehículo es obligatoria.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-04")]
    [Trait("REQ", "REQ-001-01")]
    public void Validate_EmptyInsuredName_ShouldReturnError()
    {
        var request = TestDataBuilder.ValidRequest(insuredName: "");
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("El nombre del asegurado es obligatorio.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-04")]
    [Trait("REQ", "REQ-001-01")]
    public void Validate_EmptyPhone_ShouldReturnError()
    {
        var request = TestDataBuilder.ValidRequest(phone: "");
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("El teléfono es obligatorio.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-04")]
    [Trait("REQ", "REQ-001-01")]
    public void Validate_EmptyAddress_ShouldReturnError()
    {
        var request = TestDataBuilder.ValidRequest(address: "");
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("La dirección es obligatoria.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-04")]
    [Trait("REQ", "REQ-001-01")]
    public void Validate_EmptyPostalCode_ShouldReturnError()
    {
        var request = TestDataBuilder.ValidRequest(postalCode: "");
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("El código postal es obligatorio.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-04")]
    [Trait("REQ", "REQ-001-01")]
    public void Validate_EmptyDescription_ShouldReturnError()
    {
        var request = TestDataBuilder.ValidRequest(description: "");
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("La descripción es obligatoria.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-05")]
    [Trait("REQ", "REQ-001-02")]
    public void Validate_WhitespaceOnlyDescription_ShouldReturnError()
    {
        var request = TestDataBuilder.ValidRequest(description: "   \t\n  ");
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("La descripción es obligatoria.", errors);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-04: DATE VALIDATION - Future dates rejected
    // Given a claim date in the future,
    // When validated, Then error "fecha no puede ser futura" is returned
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-001-06a")]
    [Trait("REQ", "REQ-001-04")]
    public void Validate_FutureDate_ShouldReturnError()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(10);
        var request = TestDataBuilder.ValidRequest(claimDate: futureDate);
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("La fecha del siniestro no puede ser futura.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-06a")]
    [Trait("REQ", "REQ-001-04")]
    public void Validate_DateFarInFuture_ShouldReturnError()
    {
        var futureDate = DateTime.UtcNow.Date.AddYears(1);
        var request = TestDataBuilder.ValidRequest(claimDate: futureDate);
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("La fecha del siniestro no puede ser futura.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-06a")]
    [Trait("REQ", "REQ-001-04")]
    public void Validate_TomorrowDate_ShouldReturnError()
    {
        var tomorrow = DateTime.UtcNow.Date.AddDays(1);
        var request = TestDataBuilder.ValidRequest(claimDate: tomorrow);
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("La fecha del siniestro no puede ser futura.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-06e")]
    [Trait("REQ", "REQ-001-04")]
    public void Validate_TodayDate_ShouldNotReturnDateError()
    {
        var today = DateTime.UtcNow.Date;
        var request = TestDataBuilder.ValidRequest(claimDate: today);
        var errors = CreateClaimValidator.Validate(request);
        Assert.DoesNotContain("La fecha del siniestro no puede ser futura.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-06e")]
    [Trait("REQ", "REQ-001-04")]
    public void Validate_YesterdayDate_ShouldNotReturnDateError()
    {
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var request = TestDataBuilder.ValidRequest(claimDate: yesterday);
        var errors = CreateClaimValidator.Validate(request);
        Assert.DoesNotContain("La fecha del siniestro no puede ser futura.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-06e")]
    [Trait("REQ", "REQ-001-04")]
    public void Validate_DateInDistantPast_ShouldNotReturnDateError()
    {
        var pastDate = new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var request = TestDataBuilder.ValidRequest(claimDate: pastDate);
        var errors = CreateClaimValidator.Validate(request);
        Assert.DoesNotContain("La fecha del siniestro no puede ser futura.", errors);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-05: POSTAL CODE VALIDATION - Must be exactly 5 digits
    // Given a postal code not matching ^\d{5}$,
    // When validated, Then error "código postal 5 dígitos" is returned
    // ═══════════════════════════════════════════════════════════

    [Theory]
    [Trait("AC", "AC-001-07b")]
    [Trait("REQ", "REQ-001-05")]
    [InlineData("1234")]       // 4 digits - too short
    [InlineData("123456")]     // 6 digits - too long
    [InlineData("123")]        // 3 digits
    [InlineData("1")]          // 1 digit
    [InlineData("ABCDE")]      // letters
    [InlineData("1234A")]      // mixed
    [InlineData("28 01")]      // space in middle
    [InlineData("280.1")]      // dot
    public void Validate_InvalidPostalCode_ShouldReturnFormatError(string postalCode)
    {
        var request = TestDataBuilder.ValidRequest(postalCode: postalCode);
        var errors = CreateClaimValidator.Validate(request);
        Assert.Contains("El código postal debe tener exactamente 5 dígitos.", errors);
    }

    [Theory]
    [Trait("AC", "AC-001-07a")]
    [Trait("REQ", "REQ-001-05")]
    [InlineData("28001")]      // Madrid
    [InlineData("08001")]      // Barcelona - leading zero
    [InlineData("00001")]      // Leading zeros
    [InlineData("99999")]      // Max value
    [InlineData("00000")]      // All zeros
    public void Validate_ValidPostalCode_ShouldNotReturnPostalCodeError(string postalCode)
    {
        var request = TestDataBuilder.ValidRequest(postalCode: postalCode);
        var errors = CreateClaimValidator.Validate(request);
        Assert.DoesNotContain("El código postal debe tener exactamente 5 dígitos.", errors);
        Assert.DoesNotContain("El código postal es obligatorio.", errors);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-07: MULTIPLE ERRORS - All errors returned at once
    // Given a request with multiple invalid fields,
    // When validated, Then all errors are returned simultaneously
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-001-09")]
    [Trait("REQ", "REQ-001-08")]
    public void Validate_AllFieldsEmpty_ShouldReturnMultipleErrors()
    {
        var request = TestDataBuilder.ValidRequest(
            policyNumber: "",
            claimDate: DateTime.UtcNow.Date.AddDays(10),
            vehiclePlate: "",
            insuredName: "",
            phone: "",
            address: "",
            postalCode: "",
            description: "");

        var errors = CreateClaimValidator.Validate(request);

        // Should have errors for every mandatory field + date
        Assert.True(errors.Count >= 8, $"Expected at least 8 errors, got {errors.Count}");
        Assert.Contains("El número de póliza es obligatorio.", errors);
        Assert.Contains("La fecha del siniestro no puede ser futura.", errors);
        Assert.Contains("La matrícula del vehículo es obligatoria.", errors);
        Assert.Contains("El nombre del asegurado es obligatorio.", errors);
        Assert.Contains("El teléfono es obligatorio.", errors);
        Assert.Contains("La dirección es obligatoria.", errors);
        Assert.Contains("El código postal es obligatorio.", errors);
        Assert.Contains("La descripción es obligatoria.", errors);
    }

    [Fact]
    [Trait("AC", "AC-001-09")]
    [Trait("REQ", "REQ-001-08")]
    public void Validate_FutureDateAndInvalidPostalCode_ShouldReturnBothErrors()
    {
        var request = TestDataBuilder.ValidRequest(
            claimDate: DateTime.UtcNow.Date.AddDays(5),
            postalCode: "123");

        var errors = CreateClaimValidator.Validate(request);

        Assert.Contains("La fecha del siniestro no puede ser futura.", errors);
        Assert.Contains("El código postal debe tener exactamente 5 dígitos.", errors);
    }

    // ═══════════════════════════════════════════════════════════
    // HAPPY PATH: Valid request has no errors
    // ═══════════════════════════════════════════════════════════

    [Fact]
    [Trait("AC", "AC-001-01")]
    [Trait("REQ", "REQ-001-01")]
    public void Validate_ValidRequest_ShouldReturnNoErrors()
    {
        var request = TestDataBuilder.ValidRequest();
        var errors = CreateClaimValidator.Validate(request);
        Assert.Empty(errors);
    }

    [Fact]
    [Trait("AC", "AC-001-08a")]
    [Trait("REQ", "REQ-001-06")]
    public void Validate_ValidRequestWithEachClaimType_ShouldReturnNoErrors()
    {
        foreach (var type in Enum.GetValues<ClaimType>())
        {
            var request = TestDataBuilder.ValidRequest(claimType: type);
            var errors = CreateClaimValidator.Validate(request);
            Assert.Empty(errors);
        }
    }
}
