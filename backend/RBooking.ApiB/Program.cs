using RBooking.ApiB.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024;
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "RBooking API B - Review Analytics & Webhook Consumer",
        Version = "v1",
        Description = "Microserviciu (API B) ce procesează webhook-uri HMAC de la API A și calculează statistici agregate prin interogări în batch-uri cu ServiceBearer JWT."
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Înregistrare Servicii API B
builder.Services.AddHttpClient<IApiAClient, ApiAClient>();
builder.Services.AddSingleton<IReviewAnalyticsService, ReviewAnalyticsService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RBooking API B v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");

app.MapGet("/healthz", () => Results.Json(new
{
    service = "RBooking.ApiB",
    status = "Healthy",
    uptimeMs = Environment.TickCount64,
    timestamp = DateTimeOffset.UtcNow
}));

app.MapControllers();

app.Run();
