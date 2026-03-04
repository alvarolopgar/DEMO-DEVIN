using ClaimsManagement.Application.DTOs;
using ClaimsManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClaimsManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ClaimsController : ControllerBase
{
    private readonly ClaimService _claimService;

    public ClaimsController(ClaimService claimService)
    {
        _claimService = claimService;
    }

    /// <summary>
    /// Creates a new auto insurance claim with Draft status.
    /// </summary>
    /// <param name="request">Claim creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created claim with ID and status</returns>
    /// <response code="201">Claim created successfully</response>
    /// <response code="400">Validation errors</response>
    [HttpPost]
    [ProducesResponseType(typeof(ClaimResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateClaim(
        [FromBody] CreateClaimRequest request,
        CancellationToken cancellationToken)
    {
        var (response, errors) = await _claimService.CreateClaimAsync(request, cancellationToken);

        if (errors.Count > 0)
        {
            var problemDetails = new ValidationProblemDetails
            {
                Title = "Error de validación",
                Status = StatusCodes.Status400BadRequest,
                Detail = "Uno o más errores de validación ocurrieron.",
                Instance = HttpContext.Request.Path
            };
            problemDetails.Errors["validationErrors"] = errors.ToArray();

            return BadRequest(problemDetails);
        }

        return CreatedAtAction(nameof(CreateClaim), new { id = response!.Id }, response);
    }
}
