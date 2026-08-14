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
using RBooking.Application.Constants;
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
    if (options.KnownProxies.Count == 0)
    {
        options.ForwardedHeaders = ForwardedHeaders.None;
    }
});

builder.Services.AddSingleton(blockedIps);
builder.Services.AddSingleton<RequestMetrics>();
builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddDataProtection();

// Configurare CORS unică și corectă pentru frontend (Next.js pe portul 3000)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://localhost:3000",
            "http://localhost:3001",
            "https://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001"
        )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

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

// Repository-uri și Servicii
builder.Services.AddScoped<IDiscountRepository, DiscountRepository>();
builder.Services.AddScoped<IDiscountService, DiscountService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IServiceClientRepository, ServiceClientRepository>();
builder.Services.AddScoped<IServiceClientService, ServiceClientService>();
builder.Services.AddScoped<IHostApplicationRepository, HostApplicationRepository>();
builder.Services.AddScoped<IHostApplicationService, HostApplicationService>();
builder.Services.AddHttpClient<IWebhookSender, WebhookSender>();
builder.Services.AddHttpClient<IWebhookSenderService, WebhookSenderService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

builder.Services.AddScoped<IAccommodationRepository, AccommodationRepository>();
builder.Services.AddScoped<IAccommodationService, AccommodationService>();
builder.Services.AddScoped<IAccommodationReportService, AccommodationReportService>();
builder.Services.AddScoped<IAccommodationCsvImportService, AccommodationCsvImportService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<ITwoFactorService, TwoFactorService>();

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

// Helper pentru configurare TokenValidationParameters
var tokenValidationParams = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidIssuer = jwtIssuer,
    ValidateAudience = true,
    ValidAudience = jwtAudience,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
    ClockSkew = TimeSpan.FromMinutes(1)
};

// Aceeasi cheie/emitent, dar audience distincta - un token "pending" (emis dupa parola,
// inainte de codul TOTP) nu valideaza aici, deci nu poate fi folosit ca sesiune completa.
var pendingTwoFactorTokenValidationParams = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidIssuer = jwtIssuer,
    ValidateAudience = true,
    ValidAudience = TwoFactorAuthConstants.PendingAudience,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
    ClockSkew = TimeSpan.FromMinutes(1)
};

var jwtBearerEvents = new JwtBearerEvents
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
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogWarning("[JWT] Authentication failed: {ExceptionType}", context.Exception.GetType().Name);
        return Task.CompletedTask;
    },
    OnChallenge = context =>
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("[JWT] Challenge issued: {Error}", context.Error);
        return Task.CompletedTask;
    }
};

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "UserBearer";
    options.DefaultChallengeScheme = "UserBearer";
})
.AddJwtBearer("UserBearer", options =>
{
    options.TokenValidationParameters = tokenValidationParams;
    options.Events = jwtBearerEvents;
})
.AddJwtBearer(ServiceAuthConstants.SchemeName, options =>
{
    // Tokens issued to other services (e.g. API B) via /api/auth/client-token,
    // authenticated with a client_id + client_secret pair instead of a user login.
    options.TokenValidationParameters = tokenValidationParams;
    options.Events = jwtBearerEvents;
})
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.TokenValidationParameters = tokenValidationParams;
    options.Events = jwtBearerEvents;
})
.AddJwtBearer(TwoFactorAuthConstants.PendingSchemeName, options =>
{
    options.TokenValidationParameters = pendingTwoFactorTokenValidationParams;
    options.Events = jwtBearerEvents;
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Database.Migrate();
        await DbSeeder.SeedUsersAsync(dbContext);
        logger.LogInformation("Database migrated successfully.");
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

// CORS obligatoriu primul, înainte de orice altceva
app.UseCors("AllowFrontend");

// Scoatem complet logica greșită de blocare IP din middleware-ul custom de pe rutele de autentificare/OPTIONS
// și lăsăm doar adăugarea de headere de securitate și metrici.
app.Use(async (context, next) =>
{
    var path = context.Request.Path;
    
    // Sărim peste verificările de securitate restrictive pentru preflight sau rute publice critice dacă e nevoie
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    
    if (!path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase) &&
        !path.StartsWithSegments("/openapi", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.Headers["Content-Security-Policy"] = "default-src 'self'";
    }

    context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

    if (HttpMethods.IsOptions(context.Request.Method))
    {
        context.Response.StatusCode = StatusCodes.Status204NoContent;
        return;
    }

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

        if (path.StartsWithSegments("/api") || path.Equals("/healthz", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogInformation("[Monitoring] {Method} {Path} responded {StatusCode} in {ElapsedMs:F1}ms", context.Request.Method, path, context.Response.StatusCode, elapsedMs);
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