using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;

namespace ClaimsManagement.Tests.Contract;

public static class OpenApiSchemaValidator
{
    public static List<string> Validate(OpenApiSchema schema, JsonElement value, string path = "$")
    {
        var errors = new List<string>();
        ValidateNode(schema, value, path, errors);
        return errors;
    }

    private static void ValidateNode(OpenApiSchema schema, JsonElement value, string path, List<string> errors)
    {
        switch (schema.Type)
        {
            case "object":
                ValidateObject(schema, value, path, errors);
                break;
            case "array":
                if (value.ValueKind != JsonValueKind.Array)
                {
                    errors.Add($"{path}: se esperaba array y llegó {value.ValueKind}");
                    return;
                }
                var index = 0;
                foreach (var item in value.EnumerateArray())
                    ValidateNode(schema.Items, item, $"{path}[{index++}]", errors);
                break;
            case "integer":
                if (value.ValueKind != JsonValueKind.Number || !value.TryGetInt64(out _))
                    errors.Add($"{path}: se esperaba integer y llegó {value.ValueKind}");
                else
                    ValidateEnum(schema, value.GetInt64().ToString(CultureInfo.InvariantCulture), path, errors);
                break;
            case "string":
                ValidateString(schema, value, path, errors);
                break;
        }
    }

    private static void ValidateObject(OpenApiSchema schema, JsonElement value, string path, List<string> errors)
    {
        if (value.ValueKind != JsonValueKind.Object)
        {
            errors.Add($"{path}: se esperaba object y llegó {value.ValueKind}");
            return;
        }

        foreach (var required in schema.Required)
        {
            if (!value.TryGetProperty(required, out _))
                errors.Add($"{path}.{required}: propiedad obligatoria ausente");
        }

        foreach (var property in value.EnumerateObject())
        {
            var childPath = $"{path}.{property.Name}";
            if (schema.Properties.TryGetValue(property.Name, out var propertySchema))
                ValidateNode(propertySchema, property.Value, childPath, errors);
            else if (schema.AdditionalProperties is not null)
                ValidateNode(schema.AdditionalProperties, property.Value, childPath, errors);
            else if (!schema.AdditionalPropertiesAllowed)
                errors.Add($"{childPath}: propiedad no declarada en el contrato");
        }
    }

    private static void ValidateString(OpenApiSchema schema, JsonElement value, string path, List<string> errors)
    {
        if (value.ValueKind != JsonValueKind.String)
        {
            errors.Add($"{path}: se esperaba string y llegó {value.ValueKind}");
            return;
        }

        var text = value.GetString()!;

        if (schema.Pattern is not null && !Regex.IsMatch(text, schema.Pattern))
            errors.Add($"{path}: '{text}' no cumple el patrón {schema.Pattern}");

        var formatOk = schema.Format switch
        {
            "uuid" => Guid.TryParse(text, out _),
            "date" => DateOnly.TryParseExact(text, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _),
            "date-time" => DateTimeOffset.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.None, out _)
                && Regex.IsMatch(text, @"(Z|[+-]\d{2}:\d{2})$"),
            _ => true,
        };
        if (!formatOk)
            errors.Add($"{path}: '{text}' no cumple el formato {schema.Format}");

        ValidateEnum(schema, text, path, errors);
    }

    private static void ValidateEnum(OpenApiSchema schema, string text, string path, List<string> errors)
    {
        if (schema.Enum.Count == 0)
            return;

        var allowed = schema.Enum.Select(EnumValue).ToList();
        if (!allowed.Contains(text))
            errors.Add($"{path}: '{text}' no pertenece a [{string.Join(", ", allowed)}]");
    }

    public static string EnumValue(IOpenApiAny any) => any switch
    {
        OpenApiString s => s.Value,
        OpenApiInteger i => i.Value.ToString(CultureInfo.InvariantCulture),
        _ => any.ToString() ?? string.Empty,
    };
}
