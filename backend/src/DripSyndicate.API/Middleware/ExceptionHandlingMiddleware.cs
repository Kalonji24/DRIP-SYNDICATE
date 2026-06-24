using System.Text.Json;
using FluentValidation;

namespace DripSyndicate.API.Middleware;

/// <summary>Converts exceptions into RFC 9457-style problem+json responses.</summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    { _next = next; _logger = logger; }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await _next(ctx); }
        catch (ValidationException vex)
        {
            await Write(ctx, 400, "Validation failed",
                vex.Errors.Select(e => new { field = e.PropertyName, reason = e.ErrorMessage }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await Write(ctx, 500, "An unexpected error occurred.", null);
        }
    }

    private static async Task Write(HttpContext ctx, int status, string title, object? errors)
    {
        ctx.Response.ContentType = "application/problem+json";
        ctx.Response.StatusCode = status;
        var payload = new
        {
            type = $"https://httpstatuses.io/{status}",
            title,
            status,
            traceId = ctx.TraceIdentifier,
            errors
        };
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
