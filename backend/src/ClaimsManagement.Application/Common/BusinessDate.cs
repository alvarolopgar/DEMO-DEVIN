namespace ClaimsManagement.Application.Common;

public static class BusinessDate
{
    public const string TimeZoneId = "Europe/Madrid";

    private static readonly TimeZoneInfo BusinessTimeZone = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);

    public static DateOnly Today(TimeProvider timeProvider) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), BusinessTimeZone).DateTime);

    public static bool IsFuture(DateTime date, TimeProvider timeProvider) =>
        DateOnly.FromDateTime(date) > Today(timeProvider);
}
