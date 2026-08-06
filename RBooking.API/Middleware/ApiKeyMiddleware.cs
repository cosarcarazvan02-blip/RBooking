using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;

namespace RBooking.API.Middleware;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    public const string ApiKeyHeaderName = "X-Api-Key";

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IConfiguration configuration)
    {
        var path = context.Request.Path;

        // Exempt health checks, metrics, swagger / openapi UI from API key requirement
        if (path.StartsWithSegments("/healthz", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWithSegments("/metrics", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWithSegments("/openapi", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKeyValues) ||
            string.IsNullOrWhiteSpace(extractedApiKeyValues.FirstOrDefault()))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "Acces refuzat: Header-ul 'X-Api-Key' lipsește." });
            return;
        }

        var extractedApiKey = extractedApiKeyValues.FirstOrDefault();
        var configuredApiKey = configuration["Security:ApiKey"] 
                             ?? configuration["ApiKey"] 
                             ?? "RBooking_Secret_ApiKey_2026_x9k2M!";

        if (!string.Equals(configuredApiKey, extractedApiKey, StringComparison.Ordinal))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "Acces refuzat: Cheia 'X-Api-Key' este invalidă." });
            return;
        }

        await _next(context);
    }
}
