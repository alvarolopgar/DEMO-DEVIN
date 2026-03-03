using System.Text.RegularExpressions;
using ClaimsManagement.Application.DTOs;

namespace ClaimsManagement.Application.Validators;

public static partial class CreateClaimValidator
{
    public static List<string> Validate(CreateClaimRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.PolicyNumber))
            errors.Add("El número de póliza es obligatorio.");

        if (request.ClaimDate.Date > DateTime.UtcNow.Date)
            errors.Add("La fecha del siniestro no puede ser futura.");

        if (string.IsNullOrWhiteSpace(request.VehiclePlate))
            errors.Add("La matrícula del vehículo es obligatoria.");

        if (string.IsNullOrWhiteSpace(request.InsuredName))
            errors.Add("El nombre del asegurado es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Phone))
            errors.Add("El teléfono es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Address))
            errors.Add("La dirección es obligatoria.");

        if (string.IsNullOrWhiteSpace(request.PostalCode))
            errors.Add("El código postal es obligatorio.");
        else if (!PostalCodeRegex().IsMatch(request.PostalCode))
            errors.Add("El código postal debe tener exactamente 5 dígitos.");

        if (string.IsNullOrWhiteSpace(request.Description))
            errors.Add("La descripción es obligatoria.");

        return errors;
    }

    [GeneratedRegex(@"^\d{5}$")]
    private static partial Regex PostalCodeRegex();
}
