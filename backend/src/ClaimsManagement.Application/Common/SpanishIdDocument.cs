using System.Text.RegularExpressions;

namespace ClaimsManagement.Application.Common;

public static partial class SpanishIdDocument
{
    private const string ControlLetters = "TRWAGMYFPDXBNJZSQVHLCKE";

    public static string Normalize(string? documentNumber) =>
        (documentNumber ?? string.Empty)
            .Replace(" ", string.Empty)
            .Replace("-", string.Empty)
            .ToUpperInvariant();

    public static bool IsValidDni(string normalizedDocument)
    {
        if (!DniFormatRegex().IsMatch(normalizedDocument))
            return false;
        var number = int.Parse(normalizedDocument[..8]);
        return normalizedDocument[8] == ControlLetters[number % 23];
    }

    public static bool IsValidNie(string normalizedDocument)
    {
        if (!NieFormatRegex().IsMatch(normalizedDocument))
            return false;
        var prefix = normalizedDocument[0] switch
        {
            'X' => '0',
            'Y' => '1',
            'Z' => '2',
            _ => '0',
        };
        var digits = $"{prefix}{normalizedDocument[1..8]}";
        var number = int.Parse(digits);
        return normalizedDocument[8] == ControlLetters[number % 23];
    }

    [GeneratedRegex(@"^\d{8}[A-Z]$")]
    private static partial Regex DniFormatRegex();

    [GeneratedRegex(@"^[XYZ]\d{7}[A-Z]$")]
    private static partial Regex NieFormatRegex();
}
