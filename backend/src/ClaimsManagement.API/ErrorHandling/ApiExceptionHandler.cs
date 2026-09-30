using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ClaimsManagement.API.ErrorHandling;

/// Cualquier excepción no controlada se convierte en ProblemDetails 500 sin trazas ni
/// detalles internos (SPEC-002, REQ-002-26, AC-002-37, C-002-12).
public sealed class ApiExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Error inesperado al procesar la solicitud",
        };

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(
            problem,
            cancellationToken: cancellationToken);
        return true;
    }
}
