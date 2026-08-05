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

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
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

builder.Services.AddScoped<IAccommodationRepository, AccommodationRepository>();
builder.Services.AddScoped<IAccommodationService, AccommodationService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IImageService, ImageService>();

// Configure Swagger with JWT Bearer Authentication support
builder.Services.AddSwaggerGen(options =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT Bearer token."
    };

    options.AddSecurityDefinition("Bearer", securityScheme);

    options.AddSecurityRequirement((doc) => new OpenApiSecurityRequirement
    {
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

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "RBookingAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "RBookingClient";
var jwtKey = builder.Configuration["Jwt:Key"] ?? "RBookingSuperSecretKeyForJwtTokenGeneration2026!#";

builder.Services.AddAuthorization();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.UseSecurityTokenValidators = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(5)
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
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"[JWT Error] Authentication failed: {context.Exception.GetType().Name} - {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            Console.WriteLine($"[JWT Challenge] Error: {context.Error}, Description: {context.ErrorDescription}");
            return Task.CompletedTask;
        }
    };
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseForwardedHeaders();
app.UseHttpsRedirection();

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
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'";
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

app.MapGet("/metrics", (RequestMetrics metrics) => Results.Json(new
{
    totalRequests = metrics.TotalRequests,
    blockedRequests = metrics.BlockedRequests,
    errorResponses = metrics.ErrorResponses,
    successfulResponses = metrics.SuccessfulResponses
}));

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

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