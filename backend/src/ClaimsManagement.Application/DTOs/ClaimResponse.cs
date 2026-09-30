using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Application.DTOs;

public record ClaimResponse(
    Guid Id,
    string PolicyNumber,
    DateTime ClaimDate,
    ClaimType ClaimType,
    string VehiclePlate,
    string InsuredName,
    string Phone,
    string Address,
    string PostalCode,
    string Description,
    ClaimStatus Status,
    DateTime CreatedAt
);
