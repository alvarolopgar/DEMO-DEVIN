// =============================================================================
// KAN-5 – ClaimsController
// AC1: POST /api/claims → Crea un siniestro y devuelve 201 con ID
// AC2: Valida campos obligatorios → 400 con errores
// AC3: Valida fecha no futura → 400
// AC4: Valida código postal 5 dígitos → 400
// =============================================================================

using GestionSiniestros.Application.Commands;
using GestionSiniestros.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace GestionSiniestros.Api.Controllers;

/// <summary>
/// Controlador REST para la gestión de siniestros de auto.
/// Implementa exclusivamente la creación (KAN-5).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ClaimsController : ControllerBase
{
    private readonly CreateClaimCommandHandler _createClaimHandler;

    public ClaimsController(CreateClaimCommandHandler createClaimHandler)
    {
        _createClaimHandler = createClaimHandler;
    }

    /// <summary>
    /// Crea un nuevo siniestro de auto (KAN-5: US1).
    /// </summary>
    /// <param name="request">Datos del siniestro a crear.</param>
    /// <param name="cancellationToken">Token de cancelación.</param>
    /// <returns>201 Created con ID, ClaimNumber, Status y CreatedAt.</returns>
    /// <response code="201">Siniestro creado correctamente (AC1).</response>
    /// <response code="400">Errores de validación (AC2, AC3, AC4).</response>
    /// <response code="500">Error interno del servidor.</response>
    [HttpPost]
    [ProducesResponseType(typeof(CreateClaimResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateClaim(
        [FromBody] CreateClaimRequest request,
        CancellationToken cancellationToken)
    {
        // AC1: Delega al command handler → Domain valida → Repository persiste
        var response = await _createClaimHandler.HandleAsync(request, cancellationToken);

        // AC1: Devuelve 201 Created con Location header
        return CreatedAtAction(
            actionName: null,
            routeValues: new { id = response.Id },
            value: response);
    }
}
