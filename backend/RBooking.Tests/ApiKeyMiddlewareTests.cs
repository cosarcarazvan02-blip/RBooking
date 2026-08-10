using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using RBooking.API.Middleware;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Xunit;

namespace RBooking.Tests;

public class ApiKeyMiddlewareTests
{
    private readonly IConfiguration _configuration;
    private readonly Mock<ILogger<ApiKeyMiddleware>> _loggerMock;
    private const string SecretApiKey = "RBooking_Secret_ApiKey_2026_x9k2M!";

    public ApiKeyMiddlewareTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Security:ApiKey", SecretApiKey }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _loggerMock = new Mock<ILogger<ApiKeyMiddleware>>();
    }

    [Fact]
    public async Task InvokeAsync_HealthzPath_AllowsRequestWithoutApiKey()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/healthz";
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ApiKeyMiddleware(next);

        // Act
        await middleware.InvokeAsync(context, _configuration, _loggerMock.Object);

        // Assert
        Assert.True(nextCalled);
        Assert.NotEqual(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_MissingApiKey_Returns401Unauthorized()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/accommodations";
        context.Response.Body = new MemoryStream();

        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ApiKeyMiddleware(next);

        // Act
        await middleware.InvokeAsync(context, _configuration, _loggerMock.Object);

        // Assert
        Assert.False(nextCalled);
        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_InvalidApiKey_Returns401Unauthorized()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/users";
        context.Request.Headers["X-Api-Key"] = "WrongKey123";
        context.Response.Body = new MemoryStream();

        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ApiKeyMiddleware(next);

        // Act
        await middleware.InvokeAsync(context, _configuration, _loggerMock.Object);

        // Assert
        Assert.False(nextCalled);
        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_ValidApiKey_CallsNextMiddleware()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/reservations";
        context.Request.Headers["X-Api-Key"] = SecretApiKey;

        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ApiKeyMiddleware(next);

        // Act
        await middleware.InvokeAsync(context, _configuration, _loggerMock.Object);

        // Assert
        Assert.True(nextCalled);
    }
}
