// =============================================================================
// KAN-5 – Program.cs (Composition Root)
// Configura DI, Swagger, middleware de errores y pipeline HTTP.
// =============================================================================

using System.Text.Json.Serialization;
using GestionSiniestros.Api.Middleware;
using GestionSiniestros.Application.Commands;
using GestionSiniestros.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// --- Servicios ---

// Controllers con JSON camelCase y enums como string
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Gestión de Siniestros Auto API",
        Version = "v1",
        Description = "API para la gestión de siniestros de auto – KAN-5 (US1: Crear Siniestro). " +
                      "Stack: ASP.NET Core 8 · Clean Architecture · EF Core InMemory. " +
                      "Despliegue target: AKS. Integración futura: Mulesoft.",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Equipo Siniestros – Generali",
        }
    });

    // Incluir XML comments
    var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);
});

// Infrastructure (EF Core InMemory + Repository)
builder.Services.AddInfrastructure();

// Application (Command Handlers)
builder.Services.AddScoped<CreateClaimCommandHandler>();

// Health check básico
builder.Services.AddHealthChecks();

var app = builder.Build();

// --- Pipeline HTTP ---

// Swagger siempre habilitado (requisito KAN-5)
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Gestión Siniestros Auto API v1");
    options.RoutePrefix = string.Empty; // Swagger en la raíz
});

// Middleware de manejo de errores (AC2, AC3, AC4 → 400 estructurado)
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
