using Microsoft.EntityFrameworkCore;
using RBooking.WebhookAPI.Data;
using RBooking.WebhookAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHealthChecks();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<WebhookDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IWebhookSignatureVerifier, WebhookSignatureVerifier>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<AccommodationUpdateProcessor>();

// Registered as a plain named HttpClient (not AddHttpClient<TClient,TImpl>, which defaults
// to a transient client type) so ApiAServiceClient can be a singleton and its in-memory
// token cache actually survives across requests instead of resetting every time.
builder.Services.AddHttpClient("ApiA", (sp, client) =>
{
    var baseUrl = sp.GetRequiredService<IConfiguration>()["ApiA:BaseUrl"]
        ?? throw new InvalidOperationException("ApiA:BaseUrl nu este configurat.");
    client.BaseAddress = new Uri(baseUrl);
});
builder.Services.AddSingleton<IApiAServiceClient>(sp => new ApiAServiceClient(
    sp.GetRequiredService<IHttpClientFactory>().CreateClient("ApiA"),
    sp.GetRequiredService<IConfiguration>(),
    sp.GetRequiredService<ILogger<ApiAServiceClient>>()));

builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<WebhookDbContext>();
        dbContext.Database.Migrate();
        logger.LogInformation("Webhook database migrated successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Database migration skipped or database unavailable: {Message}", ex.Message);
    }
}

app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RBooking Webhook API v1");
    c.RoutePrefix = "swagger";
});

app.MapGet("/healthz", () => Results.Json(new
{
    status = "Healthy",
    timestamp = DateTimeOffset.UtcNow
}));

app.MapControllers();

app.Run();
