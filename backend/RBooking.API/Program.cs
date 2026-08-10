using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using RBooking.API.Middleware;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Infrastructure.Data;
using RBooking.Infrastructure.Repositories;
using RBooking.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(10);
    options.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(30);
});

var blockedIpStrings = builder.Configuration.GetSection("Security:BlockedIPs").Get<string[]>() ?? Array.Empty<string>();
var blockedIps = new HashSet<IPAddress>(blockedIpStrings
    .Where(ip => !string.IsNullOrWhiteSpace(ip))
    .Select(ip => IPAddress.Parse(ip.Trim())));

// FIX: nu mai golim KnownProxies/KnownIPNetworks fara sa punem ceva in loc.
// Daca aplicatia sta in spatele unui reverse proxy real (nginx, Azure App Gateway etc.),
// pune aici IP-ul/subnetul acelui proxy explicit, in appsettings sau environment.
// Daca NU exista niciun proxy in fata, nu adaugati UseForwardedHeaders deloc mai jos,
// altfel oricine poate falsifica X-Forwarded-For si va ocoleste blockedIps + rate limiting.
var trustedProxies = builder.Configuration.GetSection("Security:TrustedProxies").Get<string[]>() ?? Array.Empty<string>();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownProxies.Clear();
    options.KnownIPNetworks.Clear();
    foreach (var proxy in trustedProxies)
    {
        if (IPAddress.TryParse(proxy.Trim(), out var proxyIp))
        {
            options.KnownProxies.Add(proxyIp);
        }
    }
    // Daca nu avem niciun proxy de incredere configurat, nu acceptam X-Forwarded-For deloc.
    if (options.KnownProxies.Count == 0)
    {
        options.ForwardedHeaders = ForwardedHeaders.None;
    }
});

builder.Services.AddSingleton(blockedIps);
builder.Services.AddSingleton<RequestMetrics>();
builder.Services.AddControllers();
builder.Services.AddHealthChecks();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // First layer: fixed window per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromSeconds(10),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            }));

    // Second layer: token bucket per IP for burst control and sustained flow
    options.AddPolicy("tokenBucket", httpContext =>
        RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 10,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                ReplenishmentPeriod = TimeSpan.FromSeconds(1),
                TokensPerPeriod = 1,
                AutoReplenishment = true
            }));
});

// Repository-uri și Servicii existente
builder.Services.AddScoped<IDiscountRepository, DiscountRepository>();
builder.Services.AddScoped<IDiscountService, DiscountService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IReviewService, ReviewService>();

builder.Services.AddScoped<IAccommodationRepository, AccommodationRepository>();
builder.Services.AddScoped<IAccommodationService, AccommodationService>();
builder.Services.AddScoped<IAccommodationReportService, AccommodationReportService>();
builder.Services.AddScoped<IAccommodationCsvImportService, AccommodationCsvImportService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IImageService, ImageService>();

// Configure Swagger with JWT Bearer Authentication and API Key support
builder.Services.AddSwaggerGen(options =>
{
    var bearerScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT Bearer token."
    };

    var apiKeyScheme = new OpenApiSecurityScheme
    {
        Name = ApiKeyMiddleware.ApiKeyHeaderName,
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        // FIX: nu mai punem un exemplu care arata ca o cheie reala.
        Description = "Enter your API Key secret."
    };

    options.AddSecurityDefinition("Bearer", bearerScheme);
    options.AddSecurityDefinition("ApiKey", apiKeyScheme);

    options.AddSecurityRequirement((doc) => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("ApiKey", doc),
            new List<string>()
        },
        {
            new OpenApiSecuritySchemeReference("Bearer", doc),
            new List<string>()
        }
    });
});

builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// FIX: valorile pentru Jwt:Issuer, Jwt:Audience si mai ales Jwt:Key trebuie sa vina
// obligatoriu din configuratie (appsettings / environment / secret manager / Azure Key Vault),
// niciodata hardcodate in cod. Daca lipsesc, aplicatia trebuie sa nu porneasca,
// nu sa cada pe o valoare implicita cunoscuta public (in cod, pe GitHub).
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Configuratia 'Jwt:Issuer' lipseste.");
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Configuratia 'Jwt:Audience' lipseste.");
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Configuratia 'Jwt:Key' lipseste.");

if (jwtKey.Length < 32)
{
    throw new InvalidOperationException("'Jwt:Key' este prea scurta pentru HMAC-SHA256 (minim 32 caractere / 256 biti).");
}

builder.Services.AddAuthorization();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // FIX: eliminat UseSecurityTokenValidators = true (foloseste calea legacy de validare).
    // Implementarea implicita (TokenHandlers) e cea recomandata.
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        // FIX: 5 minute era prea permisiv pentru un sistem de rezervari; 1 minut e suficient.
        ClockSkew = TimeSpan.FromMinutes(1)
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(authHeader))
            {
                var token = authHeader.Trim();
                while (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    token = token.Substring("Bearer ".Length).Trim();
                }
                context.Token = token;
            }
            return Task.CompletedTask;
        },
        // FIX: Console.WriteLine inlocuit cu ILogger; nivel Warning (nu Error, e asteptat sa apara
        // frecvent din cauza clientilor), fara sa includem context.Exception.Message in productie
        // (poate contine detalii interne). In Development poti loga mai mult daca vrei sa debughezi.
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            var env = context.HttpContext.RequestServices.GetRequiredService<IHostEnvironment>();
            if (env.IsDevelopment())
            {
                logger.LogWarning(context.Exception, "[JWT] Authentication failed: {ExceptionType}", context.Exception.GetType().Name);
            }
            else
            {
                logger.LogWarning("[JWT] Authentication failed: {ExceptionType}", context.Exception.GetType().Name);
            }
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("[JWT] Challenge issued: {Error}", context.Error);
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Database.Migrate();
        await DbSeeder.SeedAsync(dbContext);
        logger.LogInformation("Database migrated and seeded successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Database migration/seed skipped or database unavailable: {Message}", ex.Message);
    }
}

app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RBooking API v1");
    c.RoutePrefix = "swagger";
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseForwardedHeaders();
app.UseCors("AllowFrontend");

app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    var metrics = context.RequestServices.GetRequiredService<RequestMetrics>();
    metrics.IncrementTotalRequests();

    var blockedIps = context.RequestServices.GetRequiredService<HashSet<IPAddress>>();
    var remoteIp = context.Connection.RemoteIpAddress;
    if (remoteIp != null && blockedIps.Contains(remoteIp))
    {
        metrics.IncrementBlockedRequests();
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsync("Forbidden.");
        return;
    }

    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    
    // Exclude Swagger & OpenAPI from restrictive CSP header so Swagger UI JS & CSS can run
    if (!context.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase) &&
        !context.Request.Path.StartsWithSegments("/openapi", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.Headers["Content-Security-Policy"] = "default-src 'self'";
    }

    context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

    var start = Stopwatch.GetTimestamp();
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        metrics.IncrementErrorResponses();
        logger.LogError(ex, "Unhandled request exception");
        throw;
    }
    finally
    {
        var elapsedMs = (Stopwatch.GetTimestamp() - start) * 1000.0 / Stopwatch.Frequency;
        if (context.Response.StatusCode >= 500)
        {
            metrics.IncrementErrorResponses();
        }
        else if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 400)
        {
            metrics.IncrementSuccessfulResponses();
        }

        if (context.Request.Path.StartsWithSegments("/api") || context.Request.Path.Equals("/healthz", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogInformation("[Monitoring] {Method} {Path} responded {StatusCode} in {ElapsedMs:F1}ms", context.Request.Method, context.Request.Path, context.Response.StatusCode, elapsedMs);
        }
    }
});

app.MapGet("/healthz", () => Results.Json(new
{
    status = "Healthy",
    uptimeMs = Environment.TickCount64,
    timestamp = DateTimeOffset.UtcNow
}));

app.UseMiddleware<ApiKeyMiddleware>();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// FIX: /metrics era public, inainte de ApiKeyMiddleware. Acum cere API key
// (aceeasi middleware ca restul API-ului) si e sub rate limiting, nu mai e
// expus liber la scanare/reconnaissance.
app.MapGet("/metrics", (RequestMetrics metrics) => Results.Json(new
{
    totalRequests = metrics.TotalRequests,
    blockedRequests = metrics.BlockedRequests,
    errorResponses = metrics.ErrorResponses,
    successfulResponses = metrics.SuccessfulResponses
}))
.RequireRateLimiting("tokenBucket");

app.MapControllers().RequireRateLimiting("tokenBucket");

app.Run();

public sealed class RequestMetrics
{
    private long _totalRequests;
    private long _blockedRequests;
    private long _errorResponses;
    private long _successfulResponses;

    public long TotalRequests => Interlocked.Read(ref _totalRequests);
    public long BlockedRequests => Interlocked.Read(ref _blockedRequests);
    public long ErrorResponses => Interlocked.Read(ref _errorResponses);
    public long SuccessfulResponses => Interlocked.Read(ref _successfulResponses);

    public void IncrementTotalRequests() => Interlocked.Increment(ref _totalRequests);
    public void IncrementBlockedRequests() => Interlocked.Increment(ref _blockedRequests);
    public void IncrementErrorResponses() => Interlocked.Increment(ref _errorResponses);
    public void IncrementSuccessfulResponses() => Interlocked.Increment(ref _successfulResponses);
}