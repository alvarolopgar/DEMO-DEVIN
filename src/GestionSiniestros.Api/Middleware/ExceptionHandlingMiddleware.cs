// =============================================================================
// KAN-5 – Middleware de manejo estructurado de errores
// AC2, AC3, AC4: Convierte ClaimValidationException en HTTP 400 con detalle
// =============================================================================

using System.Net;
using System.Text.Json;
using GestionSiniestros.Application.DTOs;
using GestionSiniestros.Domain.Exceptions;

namespace GestionSiniestros.Api.Middleware;

/// <summary>
/// Middleware global para convertir excepciones de dominio en respuestas HTTP estructuradas.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ClaimValidationException ex)
        {
            // AC2, AC3, AC4: Errores de validación → 400 Bad Request
            _logger.LogWarning("Validación fallida al crear siniestro: {Errors}",
                string.Join("; ", ex.Errors.Select(e => $"{e.Field}: {e.Message}")));

            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";

            var errorResponse = new ErrorResponse
            {
                Message = "Se han producido errores de validación.",
                Errors = ex.Errors.Select(e => new FieldError
                {
                    Field = e.Field,
                    Message = e.Message
                }).ToList()
            };

            var json = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
        catch (Exception ex)
        {
            // Error inesperado → 500
            _logger.LogError(ex, "Error inesperado en el servidor.");

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var errorResponse = new ErrorResponse
            {
                Message = "Se ha producido un error interno en el servidor.",
                Errors = Array.Empty<FieldError>()
            };

            var json = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}
