using ClaimsManagement.Domain.Entities;
using ClaimsManagement.Domain.Enums;
using ClaimsManagement.Infrastructure.Repositories;

namespace ClaimsManagement.Tests.Infrastructure;

/// <summary>
/// Tests for InMemoryClaimRepository - Data persistence layer.
/// Maps to KAN-5 acceptance criteria:
///   AC-09: Claims are stored and retrievable after creation
///   AC-10: Repository returns null for non-existent claims
/// Edge cases: concurrent access, multiple claims
/// </summary>
public class InMemoryClaimRepositoryTests
{
    private readonly InMemoryClaimRepository _repository;

    public InMemoryClaimRepositoryTests()
    {
        _repository = new InMemoryClaimRepository();
    }

    // ═══════════════════════════════════════════════════════════
    // AC-09: AddAsync stores claim and returns it
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task AddAsync_ValidClaim_ShouldReturnSameClaim()
    {
        var claim = Claim.Create(
            "POL-001", DateTime.UtcNow.AddDays(-1), ClaimType.Colision,
            "1234 ABC", "Test User", "600000000",
            "Test Address", "28001", "Test Desc");

        var result = await _repository.AddAsync(claim);

        Assert.Equal(claim.Id, result.Id);
        Assert.Equal(claim.PolicyNumber, result.PolicyNumber);
    }

    [Fact]
    public async Task AddAsync_ThenGetById_ShouldReturnStoredClaim()
    {
        var claim = Claim.Create(
            "POL-002", DateTime.UtcNow.AddDays(-2), ClaimType.Robo,
            "5678 DEF", "Another User", "611222333",
            "Another Address", "08001", "Another Desc");

        await _repository.AddAsync(claim);
        var retrieved = await _repository.GetByIdAsync(claim.Id);

        Assert.NotNull(retrieved);
        Assert.Equal(claim.Id, retrieved.Id);
        Assert.Equal("POL-002", retrieved.PolicyNumber);
        Assert.Equal(ClaimType.Robo, retrieved.ClaimType);
        Assert.Equal(ClaimStatus.Draft, retrieved.Status);
    }

    // ═══════════════════════════════════════════════════════════
    // AC-10: GetByIdAsync returns null for non-existent ID
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task GetByIdAsync_NonExistentId_ShouldReturnNull()
    {
        var result = await _repository.GetByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_EmptyGuid_ShouldReturnNull()
    {
        var result = await _repository.GetByIdAsync(Guid.Empty);

        Assert.Null(result);
    }

    // ═══════════════════════════════════════════════════════════
    // Edge case: Multiple claims stored independently
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task AddAsync_MultipleClaims_ShouldAllBeRetrievable()
    {
        var claims = new List<Claim>();
        for (int i = 0; i < 5; i++)
        {
            var claim = Claim.Create(
                $"POL-{i:D3}", DateTime.UtcNow.AddDays(-i - 1), ClaimType.Colision,
                $"{i}000 AAA", $"User {i}", $"60000000{i}",
                $"Address {i}", $"{28000 + i}", $"Description {i}");
            claims.Add(claim);
            await _repository.AddAsync(claim);
        }

        foreach (var expected in claims)
        {
            var retrieved = await _repository.GetByIdAsync(expected.Id);
            Assert.NotNull(retrieved);
            Assert.Equal(expected.PolicyNumber, retrieved.PolicyNumber);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Edge case: Concurrent adds should be thread-safe
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task AddAsync_ConcurrentAdds_ShouldAllSucceed()
    {
        var tasks = new List<Task<Claim>>();

        for (int i = 0; i < 50; i++)
        {
            var claim = Claim.Create(
                $"POL-CONC-{i:D3}", DateTime.UtcNow.AddDays(-1), ClaimType.Incendio,
                $"{i:D4} XXX", $"Concurrent User {i}", $"6{i:D8}",
                $"Concurrent Address {i}", "28001", $"Concurrent Desc {i}");

            tasks.Add(_repository.AddAsync(claim));
        }

        var results = await Task.WhenAll(tasks);

        Assert.Equal(50, results.Length);

        // Verify all are retrievable
        foreach (var result in results)
        {
            var retrieved = await _repository.GetByIdAsync(result.Id);
            Assert.NotNull(retrieved);
        }
    }
}
