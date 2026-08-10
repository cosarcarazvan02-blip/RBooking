using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace RBooking.API.Middleware;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    public const string ApiKeyHeaderName = "X-Api-Key";

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IConfiguration configuration, ILogger<ApiKeyMiddleware> logger)
    {
        var path = context.Request.Path;

        // Exempt health checks, swagger / openapi UI from API key requirement.
        // FIX: /metrics scos de aici - contine date interne (nr. requesturi, erori etc.)
        // si nu trebuie sa fie public. Daca vreti totusi sa ramana public pentru un
        // monitoring extern, spuneti-mi si il tratam separat cu propriul lui rate limit.
        if (path.StartsWithSegments("/healthz", StringComparison.OrdinalIgnoreCase) ||
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

        var extractedApiKey = extractedApiKeyValues.FirstOrDefault() ?? string.Empty;

        // FIX: fara fallback hardcodat. Daca cheia nu e configurata, aplicatia trebuie
        // sa refuze cererea explicit (500), nu sa cada pe un secret scris in cod.
        // Ideal, verificati asta o singura data la pornire (in Program.cs), nu la fiecare request -
        // las-o si aici ca ultima plasa de siguranta.
        var configuredApiKey = configuration["Security:ApiKey"] ?? configuration["ApiKey"];
        if (string.IsNullOrWhiteSpace(configuredApiKey))
        {
            logger.LogError("Security:ApiKey nu este configurata. Toate cererile sunt refuzate.");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "Eroare de configurare server." });
            return;
        }

        // FIX: comparatie in timp constant, nu string.Equals (care iese din bucla
        // la primul caracter diferit si e teoretic vulnerabil la timing attacks).
        if (!FixedTimeEquals(configuredApiKey, extractedApiKey))
        {
            logger.LogWarning("Incercare esuata de autentificare cu API key de la {RemoteIp}", context.Connection.RemoteIpAddress);
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "Acces refuzat: Cheia 'X-Api-Key' este invalidă." });
            return;
        }

        await _next(context);
    }

    private static bool FixedTimeEquals(string a, string b)
    {
        var bytesA = Encoding.UTF8.GetBytes(a);
        var bytesB = Encoding.UTF8.GetBytes(b);

        // CryptographicOperations.FixedTimeEquals cere ca cele doua array-uri sa aiba aceeasi lungime.
        // Daca lungimile difera, oricum cheile nu sunt egale - dar comparam tot cu ceva de lungime fixa
        // (hash-ul lor) ca sa nu scapam nicio informatie prin timpul de executie legat de lungime.
        if (bytesA.Length != bytesB.Length)
        {
            using var sha256 = SHA256.Create();
            _ = sha256.ComputeHash(bytesA);
            _ = sha256.ComputeHash(bytesB);
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(bytesA, bytesB);
    }
}