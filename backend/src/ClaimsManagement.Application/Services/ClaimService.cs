using ClaimsManagement.Application.DTOs;
using ClaimsManagement.Application.Interfaces;
using ClaimsManagement.Application.Validators;
using ClaimsManagement.Domain.Entities;

namespace ClaimsManagement.Application.Services;

public class ClaimService
{
    private readonly IClaimRepository _repository;

    public ClaimService(IClaimRepository repository)
    {
        _repository = repository;
    }

    public async Task<(ClaimResponse? Response, List<string> Errors)> CreateClaimAsync(
        CreateClaimRequest request,
        CancellationToken cancellationToken = default)
    {
        var errors = CreateClaimValidator.Validate(request);
        if (errors.Count > 0)
            return (null, errors);

        var claim = Claim.Create(
            request.PolicyNumber,
            request.ClaimDate,
            request.ClaimType,
            request.VehiclePlate,
            request.InsuredName,
            request.Phone,
            request.Address,
            request.PostalCode,
            request.Description
        );

        var saved = await _repository.AddAsync(claim, cancellationToken);

        var response = new ClaimResponse(
            saved.Id,
            saved.PolicyNumber,
            saved.ClaimDate,
            saved.ClaimType,
            saved.VehiclePlate,
            saved.InsuredName,
            saved.Phone,
            saved.Address,
            saved.PostalCode,
            saved.Description,
            saved.Status,
            saved.CreatedAt
        );

        return (response, []);
    }
}
