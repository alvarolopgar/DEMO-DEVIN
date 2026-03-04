using ClaimsManagement.Domain.Enums;

namespace ClaimsManagement.Domain.Entities;

public class Claim
{
    public Guid Id { get; private set; }
    public string PolicyNumber { get; private set; } = string.Empty;
    public DateTime ClaimDate { get; private set; }
    public ClaimType ClaimType { get; private set; }
    public string VehiclePlate { get; private set; } = string.Empty;
    public string InsuredName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public ClaimStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Claim() { }

    public static Claim Create(
        string policyNumber,
        DateTime claimDate,
        ClaimType claimType,
        string vehiclePlate,
        string insuredName,
        string phone,
        string address,
        string postalCode,
        string description)
    {
        return new Claim
        {
            Id = Guid.NewGuid(),
            PolicyNumber = policyNumber,
            ClaimDate = claimDate,
            ClaimType = claimType,
            VehiclePlate = vehiclePlate,
            InsuredName = insuredName,
            Phone = phone,
            Address = address,
            PostalCode = postalCode,
            Description = description,
            Status = ClaimStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
    }
}
