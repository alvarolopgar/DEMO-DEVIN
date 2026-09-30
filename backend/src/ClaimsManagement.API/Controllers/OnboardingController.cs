using ClaimsManagement.Application.DTOs;
using ClaimsManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClaimsManagement.API.Controllers;

[ApiController]
[Route("api/onboarding-requests")]
public class OnboardingController : ControllerBase
{
    private readonly OnboardingService _onboardingService;

    public OnboardingController(OnboardingService onboardingService)
    {
        _onboardingService = onboardingService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(OnboardingResponse), StatusCodes.Status201Created, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<IActionResult> CreateDraft(
        [FromBody] SaveOnboardingDraftRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _onboardingService.CreateDraftAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OnboardingResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _onboardingService.GetByIdAsync(id, cancellationToken);
        if (response is null)
            return ProblemResult(OnboardingError.NotFound());
        return Ok(response);
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(OnboardingResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict, "application/problem+json")]
    public async Task<IActionResult> UpdateDraft(
        Guid id,
        [FromBody] SaveOnboardingDraftRequest request,
        CancellationToken cancellationToken)
    {
        var (response, error) = await _onboardingService.UpdateDraftAsync(id, request, cancellationToken);
        if (error is not null)
            return ProblemResult(error);
        return Ok(response);
    }

    [HttpPost("{id:guid}/submit")]
    [ProducesResponseType(typeof(OnboardingResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict, "application/problem+json")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken cancellationToken)
    {
        var (response, errors, error) = await _onboardingService.SubmitAsync(id, cancellationToken);
        if (error is not null)
            return ProblemResult(error);
        if (errors.Count > 0)
            return ValidationProblem(errors);
        return Ok(response);
    }

    [HttpPost("{id:guid}/verify")]
    [ProducesResponseType(typeof(OnboardingResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict, "application/problem+json")]
    public async Task<IActionResult> Verify(Guid id, CancellationToken cancellationToken)
    {
        var (response, error) = await _onboardingService.VerifyAsync(id, cancellationToken);
        if (error is not null)
            return ProblemResult(error);
        return Ok(response);
    }

    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(typeof(OnboardingResponse), StatusCodes.Status200OK, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict, "application/problem+json")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken cancellationToken)
    {
        var (response, error) = await _onboardingService.CompleteAsync(id, cancellationToken);
        if (error is not null)
            return ProblemResult(error);
        return Ok(response);
    }

    private IActionResult ValidationProblem(IReadOnlyList<string> errors)
    {
        var problemDetails = new ValidationProblemDetails
        {
            Title = "Error de validación",
            Status = StatusCodes.Status400BadRequest,
            Detail = "Uno o más campos no son válidos.",
            Instance = HttpContext.Request.Path
        };
        problemDetails.Errors["validationErrors"] = errors.ToArray();
        return BadRequest(problemDetails);
    }

    private IActionResult ProblemResult(OnboardingError error)
    {
        var problemDetails = new ValidationProblemDetails
        {
            Title = error.Title,
            Status = error.Status,
            Detail = error.Detail,
            Instance = HttpContext.Request.Path
        };
        if (error.ValidationErrors is not null)
            problemDetails.Errors["validationErrors"] = error.ValidationErrors.ToArray();
        return StatusCode(error.Status, problemDetails);
    }
}
