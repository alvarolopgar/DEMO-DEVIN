using System.Globalization;

namespace ClaimsManagement.Tests.Helpers;

public sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => utcNow;

    public static FixedTimeProvider AtUtc(string isoInstant) =>
        new(DateTimeOffset.Parse(isoInstant, CultureInfo.InvariantCulture));
}
