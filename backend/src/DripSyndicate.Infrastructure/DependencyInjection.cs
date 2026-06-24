using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.Common.Models;
using DripSyndicate.Infrastructure.Identity;
using DripSyndicate.Infrastructure.Persistence;
using DripSyndicate.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DripSyndicate.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration cfg)
    {
        services.AddDbContext<ApplicationDbContext>(opt =>
            opt.UseNpgsql(cfg.GetConnectionString("Default"),
                npg => npg.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName))
               .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

        services.AddScoped<IApplicationDbContext>(p => p.GetRequiredService<ApplicationDbContext>());

        services.Configure<JwtSettings>(cfg.GetSection("Jwt"));
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IDateTime, DateTimeService>();

        services.AddSingleton<IImageProcessor, ImageSharpProcessor>();
        services.AddHttpClient<IMediaStorage, SupabaseStorageService>();

        return services;
    }
}
