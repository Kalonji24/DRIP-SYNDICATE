using DripSyndicate.Application.Common.Interfaces;

namespace DripSyndicate.Infrastructure.Identity;

public class DateTimeService : IDateTime { public DateTime UtcNow => DateTime.UtcNow; }
