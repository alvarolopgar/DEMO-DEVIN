// =============================================================================
// KAN-5 – Tests Unitarios: Domain Layer (Claim.Create)
// =============================================================================
// MATRIZ DE TRAZABILIDAD  Criterio → Test
// ─────────────────────────────────────────────────────────────────────────────
// AC1 (Crear siniestro)     → AC1_Create_ValidData_ReturnsClaimWithDraftStatus
//                            → AC1_Create_ValidData_GeneratesClaimNumber
//                            → AC1_Create_ValidData_GeneratesUniqueId
//                            → AC1_Create_ValidData_SetsCreatedAt
//                            → AC1_Create_ValidData_AllFieldsMapped
// AC2 (Campos obligatorios) → AC2_Create_EmptyPolicyNumber_ThrowsValidation
//                            → AC2_Create_EmptyLicensePlate_ThrowsValidation
//                            → AC2_Create_EmptyInsuredName_ThrowsValidation
//                            → AC2_Create_EmptyPhone_ThrowsValidation
//                            → AC2_Create_EmptyAddress_ThrowsValidation
//                            → AC2_Create_EmptyPostalCode_ThrowsValidation
//                            → AC2_Create_EmptyDescription_ThrowsValidation
//                            → AC2_Create_MultipleEmptyFields_ReturnsAllErrors
//                            → AC2_Create_WhitespaceOnlyField_ThrowsValidation
// AC3 (Fecha no futura)     → AC3_Create_FutureDate_ThrowsValidation
//                            → AC3_Create_TodayDate_Succeeds
//                            → AC3_Create_PastDate_Succeeds
//                            → AC3_Create_FarFutureDate_ThrowsValidation
// AC4 (CP 5 dígitos)        → AC4_Create_PostalCode4Digits_ThrowsValidation
//                            → AC4_Create_PostalCode6Digits_ThrowsValidation
//                            → AC4_Create_PostalCodeLetters_ThrowsValidation
//                            → AC4_Create_PostalCodeMixed_ThrowsValidation
//                            → AC4_Create_PostalCode5Digits_Succeeds
// Casos límite              → Edge_Create_AllFieldsInvalid_ReturnsAllErrors
//                            → Edge_Create_TrimsWhitespace
//                            → Edge_Create_LicensePlateUppercased
//                            → Edge_Create_AllClaimTypesValid
//                            → Edge_Create_IncidentDateStripsTime
//                            → Edge_Create_ClaimNumberFormat
// =============================================================================

using GestionSiniestros.Domain.Entities;
using GestionSiniestros.Domain.Enums;
using GestionSiniestros.Domain.Exceptions;

namespace GestionSiniestros.Tests.Domain;

public class ClaimCreateTests
{
    // =========================================================================
    // AC1: El gestor puede crear un siniestro con todos los campos obligatorios
    //      y el estado inicial es Draft
    // =========================================================================

    [Fact]
    public void AC1_Create_ValidData_ReturnsClaimWithDraftStatus()
    {
        // Arrange & Act
        var claim = CreateValidClaim();

        // Assert – AC1: Estado inicial siempre Draft
        Assert.Equal(ClaimStatus.Draft, claim.Status);
    }

    [Fact]
    public void AC1_Create_ValidData_GeneratesClaimNumber()
    {
        var claim = CreateValidClaim();

        // AC1: Se genera ClaimNumber con formato CLM-YYYY-NNNNNN
        Assert.NotNull(claim.ClaimNumber);
        Assert.NotEmpty(claim.ClaimNumber);
        Assert.Matches(@"^CLM-\d{4}-\d{6}$", claim.ClaimNumber);
    }

    [Fact]
    public void AC1_Create_ValidData_GeneratesUniqueId()
    {
        var claim = CreateValidClaim();

        // AC1: Se genera ID único
        Assert.NotEqual(Guid.Empty, claim.Id);
    }

    [Fact]
    public void AC1_Create_ValidData_SetsCreatedAt()
    {
        var before = DateTime.UtcNow;
        var claim = CreateValidClaim();
        var after = DateTime.UtcNow;

        // AC1: CreatedAt se establece al momento de creación
        Assert.InRange(claim.CreatedAt, before, after);
    }

    [Fact]
    public void AC1_Create_ValidData_AllFieldsMapped()
    {
        var claim = Claim.Create(
            policyNumber: "POL-001",
            incidentDate: DateTime.UtcNow.Date.AddDays(-1),
            claimType: ClaimType.Robo,
            licensePlate: "1234abc",
            insuredName: "Ana Martínez",
            phone: "+34600111222",
            address: "Calle Sol 5",
            postalCode: "28002",
            description: "Robo de vehículo en parking subterráneo.");

        // AC1: Todos los campos se mapean correctamente
        Assert.Equal("POL-001", claim.PolicyNumber);
        Assert.Equal(DateTime.UtcNow.Date.AddDays(-1), claim.IncidentDate);
        Assert.Equal(ClaimType.Robo, claim.ClaimType);
        Assert.Equal("1234ABC", claim.LicensePlate); // Uppercase
        Assert.Equal("Ana Martínez", claim.InsuredName);
        Assert.Equal("+34600111222", claim.Phone);
        Assert.Equal("Calle Sol 5", claim.Address);
        Assert.Equal("28002", claim.PostalCode);
        Assert.Equal("Robo de vehículo en parking subterráneo.", claim.Description);
    }

    // =========================================================================
    // AC2: Todos los campos son obligatorios
    // =========================================================================

    [Fact]
    public void AC2_Create_EmptyPolicyNumber_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "28001", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "PolicyNumber");
    }

    [Fact]
    public void AC2_Create_EmptyLicensePlate_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "", "Juan", "+34600", "Calle 1", "28001", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "LicensePlate");
    }

    [Fact]
    public void AC2_Create_EmptyInsuredName_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "", "+34600", "Calle 1", "28001", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "InsuredName");
    }

    [Fact]
    public void AC2_Create_EmptyPhone_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "", "Calle 1", "28001", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "Phone");
    }

    [Fact]
    public void AC2_Create_EmptyAddress_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "", "28001", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "Address");
    }

    [Fact]
    public void AC2_Create_EmptyPostalCode_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "PostalCode");
    }

    [Fact]
    public void AC2_Create_EmptyDescription_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "28001", ""));

        Assert.Contains(ex.Errors, e => e.Field == "Description");
    }

    [Fact]
    public void AC2_Create_MultipleEmptyFields_ReturnsAllErrors()
    {
        // AC2: Si hay múltiples campos vacíos, devolver TODOS los errores
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("", DateTime.UtcNow.Date, ClaimType.Colision,
                "", "", "", "", "", ""));

        Assert.True(ex.Errors.Count >= 7, $"Expected at least 7 errors but got {ex.Errors.Count}");
        Assert.Contains(ex.Errors, e => e.Field == "PolicyNumber");
        Assert.Contains(ex.Errors, e => e.Field == "LicensePlate");
        Assert.Contains(ex.Errors, e => e.Field == "InsuredName");
        Assert.Contains(ex.Errors, e => e.Field == "Phone");
        Assert.Contains(ex.Errors, e => e.Field == "Address");
        Assert.Contains(ex.Errors, e => e.Field == "PostalCode");
        Assert.Contains(ex.Errors, e => e.Field == "Description");
    }

    [Fact]
    public void AC2_Create_WhitespaceOnlyField_ThrowsValidation()
    {
        // Caso límite: solo espacios en blanco = campo vacío
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("   ", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "28001", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "PolicyNumber");
    }

    // =========================================================================
    // AC3: La fecha del siniestro no puede ser futura
    // =========================================================================

    [Fact]
    public void AC3_Create_FutureDate_ThrowsValidation()
    {
        var tomorrow = DateTime.UtcNow.Date.AddDays(1);

        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", tomorrow, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "28001", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "IncidentDate");
    }

    [Fact]
    public void AC3_Create_TodayDate_Succeeds()
    {
        // Hoy es válido
        var today = DateTime.UtcNow.Date;

        var claim = Claim.Create("POL-001", today, ClaimType.Colision,
            "1234ABC", "Juan", "+34600", "Calle 1", "28001", "Desc");

        Assert.Equal(today, claim.IncidentDate);
    }

    [Fact]
    public void AC3_Create_PastDate_Succeeds()
    {
        var pastDate = new DateTime(2023, 6, 15);

        var claim = Claim.Create("POL-001", pastDate, ClaimType.Colision,
            "1234ABC", "Juan", "+34600", "Calle 1", "28001", "Desc");

        Assert.Equal(pastDate, claim.IncidentDate);
    }

    [Fact]
    public void AC3_Create_FarFutureDate_ThrowsValidation()
    {
        // Caso límite: fecha muy lejana en el futuro
        var farFuture = DateTime.UtcNow.Date.AddYears(10);

        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", farFuture, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "28001", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "IncidentDate");
    }

    // =========================================================================
    // AC4: Código postal debe tener exactamente 5 dígitos
    // =========================================================================

    [Fact]
    public void AC4_Create_PostalCode4Digits_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "2800", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "PostalCode" &&
            e.Message.Contains("5 dígitos"));
    }

    [Fact]
    public void AC4_Create_PostalCode6Digits_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "280011", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "PostalCode");
    }

    [Fact]
    public void AC4_Create_PostalCodeLetters_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "ABCDE", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "PostalCode");
    }

    [Fact]
    public void AC4_Create_PostalCodeMixed_ThrowsValidation()
    {
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
                "1234ABC", "Juan", "+34600", "Calle 1", "28A01", "Desc"));

        Assert.Contains(ex.Errors, e => e.Field == "PostalCode");
    }

    [Fact]
    public void AC4_Create_PostalCode5Digits_Succeeds()
    {
        var claim = Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
            "1234ABC", "Juan", "+34600", "Calle 1", "28001", "Desc");

        Assert.Equal("28001", claim.PostalCode);
    }

    // =========================================================================
    // Casos límite adicionales
    // =========================================================================

    [Fact]
    public void Edge_Create_AllFieldsInvalid_ReturnsAllErrors()
    {
        // Caso límite: todos los campos vacíos + fecha futura
        var ex = Assert.Throws<ClaimValidationException>(() =>
            Claim.Create("", DateTime.UtcNow.Date.AddDays(1), ClaimType.Colision,
                "", "", "", "", "", ""));

        // 7 campos vacíos + 1 fecha futura = al menos 8 errores
        Assert.True(ex.Errors.Count >= 8, $"Expected at least 8 errors but got {ex.Errors.Count}");
    }

    [Fact]
    public void Edge_Create_TrimsWhitespace()
    {
        // Nota: PostalCode se valida con regex antes de trim, así que se pasa limpio.
        // El resto de campos sí se trimean correctamente tras la validación.
        var claim = Claim.Create(
            "  POL-001  ", DateTime.UtcNow.Date, ClaimType.Colision,
            " 1234abc ", " Juan ", " +34600 ", " Calle 1 ", "28001", " Desc ");

        Assert.Equal("POL-001", claim.PolicyNumber);
        Assert.Equal("1234ABC", claim.LicensePlate);
        Assert.Equal("Juan", claim.InsuredName);
        Assert.Equal("+34600", claim.Phone);
        Assert.Equal("Calle 1", claim.Address);
        Assert.Equal("28001", claim.PostalCode);
        Assert.Equal("Desc", claim.Description);
    }

    [Fact]
    public void Edge_Create_LicensePlateUppercased()
    {
        var claim = Claim.Create("POL-001", DateTime.UtcNow.Date, ClaimType.Colision,
            "abcd1234", "Juan", "+34600", "Calle 1", "28001", "Desc");

        Assert.Equal("ABCD1234", claim.LicensePlate);
    }

    [Theory]
    [InlineData(ClaimType.Colision)]
    [InlineData(ClaimType.Robo)]
    [InlineData(ClaimType.Incendio)]
    [InlineData(ClaimType.Cristales)]
    public void Edge_Create_AllClaimTypesValid(ClaimType claimType)
    {
        var claim = Claim.Create("POL-001", DateTime.UtcNow.Date, claimType,
            "1234ABC", "Juan", "+34600", "Calle 1", "28001", "Desc");

        Assert.Equal(claimType, claim.ClaimType);
        Assert.Equal(ClaimStatus.Draft, claim.Status);
    }

    [Fact]
    public void Edge_Create_IncidentDateStripsTime()
    {
        // Caso límite: la fecha se almacena sin hora
        var dateWithTime = new DateTime(2024, 3, 15, 14, 30, 0, DateTimeKind.Utc);

        var claim = Claim.Create("POL-001", dateWithTime, ClaimType.Colision,
            "1234ABC", "Juan", "+34600", "Calle 1", "28001", "Desc");

        Assert.Equal(new DateTime(2024, 3, 15), claim.IncidentDate);
        Assert.Equal(0, claim.IncidentDate.Hour);
    }

    [Fact]
    public void Edge_Create_ClaimNumberFormat()
    {
        var claim = CreateValidClaim();
        var currentYear = DateTime.UtcNow.Year.ToString();

        Assert.StartsWith($"CLM-{currentYear}-", claim.ClaimNumber);
        Assert.Equal(15, claim.ClaimNumber.Length); // CLM-YYYY-NNNNNN = 15 chars
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private static Claim CreateValidClaim() =>
        Claim.Create(
            policyNumber: "POL-2024-001234",
            incidentDate: DateTime.UtcNow.Date.AddDays(-1),
            claimType: ClaimType.Colision,
            licensePlate: "1234ABC",
            insuredName: "Juan García",
            phone: "+34612345678",
            address: "Calle Mayor 10, Madrid",
            postalCode: "28001",
            description: "Colisión frontal en rotonda.");
}
