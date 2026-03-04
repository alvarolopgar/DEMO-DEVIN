using GestionSiniestros.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GestionSiniestros.Infrastructure.Persistence;

/// <summary>
/// DbContext para el módulo de siniestros.
/// Usa InMemory para la demo; en producción se sustituye por SQL Server/PostgreSQL.
/// </summary>
public class ClaimsDbContext : DbContext
{
    public ClaimsDbContext(DbContextOptions<ClaimsDbContext> options) : base(options) { }

    public DbSet<Claim> Claims => Set<Claim>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Claim>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.ClaimNumber).IsRequired().HasMaxLength(20);
            entity.Property(c => c.PolicyNumber).IsRequired().HasMaxLength(50);
            entity.Property(c => c.LicensePlate).IsRequired().HasMaxLength(20);
            entity.Property(c => c.InsuredName).IsRequired().HasMaxLength(200);
            entity.Property(c => c.Phone).IsRequired().HasMaxLength(20);
            entity.Property(c => c.Address).IsRequired().HasMaxLength(500);
            entity.Property(c => c.PostalCode).IsRequired().HasMaxLength(5);
            entity.Property(c => c.Description).IsRequired().HasMaxLength(2000);
            entity.Property(c => c.Status).IsRequired().HasConversion<string>();
            entity.Property(c => c.ClaimType).IsRequired().HasConversion<string>();

            entity.HasIndex(c => c.ClaimNumber).IsUnique();
        });
    }
}
