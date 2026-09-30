using System.Globalization;

namespace ClaimsManagement.Tests.Helpers;

public sealed class MutableTimeProvider(DateTimeOffset utcNow) : TimeProvider
{
    public DateTimeOffset UtcNow { get; set; } = utcNow;

    public override DateTimeOffset GetUtcNow() => UtcNow;

    public void Advance(TimeSpan span) => UtcNow += span;

    public static MutableTimeProvider AtUtc(string isoInstant) =>
        new(DateTimeOffset.Parse(isoInstant, CultureInfo.InvariantCulture));
}
