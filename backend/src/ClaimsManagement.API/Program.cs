using System.Text.Json.Serialization;
using ClaimsManagement.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Claims Management API",
        Version = "v1",
        Description = "API para gestión de siniestros de auto - KAN-5"
    });
});

// Clean Architecture DI
builder.Services.AddInfrastructure(builder.Configuration);

// Errores internos → ProblemDetails 500 sin trazas (SPEC-002, REQ-002-26)
builder.Services.AddExceptionHandler<ClaimsManagement.API.ErrorHandling.ApiExceptionHandler>();
builder.Services.AddProblemDetails();

// CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseExceptionHandler();

// Swagger always enabled for demo
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Claims Management API v1");
});

app.UseCors("AllowFrontend");
app.MapControllers();

app.Run();

public partial class Program;
