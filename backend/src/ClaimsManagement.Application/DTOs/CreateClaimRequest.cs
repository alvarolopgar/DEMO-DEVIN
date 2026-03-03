using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Application.DTOs;

public record CreateClaimRequest(
    string PolicyNumber,
    DateTime ClaimDate,
    ClaimType ClaimType,
    string VehiclePlate,
    string InsuredName,
    string Phone,
    string Address,
    string PostalCode,
    string Description
);
