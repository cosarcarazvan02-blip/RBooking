using System.Security.Cryptography;
using System.Text;
using Moq;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using Xunit;

namespace RBooking.Tests;

public class ServiceClientServiceTests
{
    private readonly Mock<IServiceClientRepository> _repoMock;
    private readonly Mock<IJwtTokenGenerator> _jwtMock;
    private readonly ServiceClientService _service;

    public ServiceClientServiceTests()
    {
        _repoMock = new Mock<IServiceClientRepository>();
        _jwtMock = new Mock<IJwtTokenGenerator>();
        _service = new ServiceClientService(_repoMock.Object, _jwtMock.Object);
    }

    [Fact]
    public async Task GenerateClientAsync_CreatesAndReturnsNewClientCredentials()
    {
        // Arrange
        _repoMock.Setup(r => r.AddAsync(It.IsAny<ServiceClient>()))
            .ReturnsAsync((ServiceClient c) => c);

        // Act
        var result = await _service.GenerateClientAsync("API B Analytics");

        // Assert
        Assert.NotNull(result);
        Assert.StartsWith("client_", result.ClientId);
        Assert.NotEmpty(result.ClientSecret);
        Assert.Equal("API B Analytics", result.ClientName);
        Assert.Equal("Service", result.Role);
        _repoMock.Verify(r => r.AddAsync(It.IsAny<ServiceClient>()), Times.Once);
    }

    [Fact]
    public async Task AuthenticateClientAsync_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var client = new ServiceClient
        {
            Id = Guid.NewGuid(),
            ClientId = "test_client_id",
            ClientSecret = "secret123456",
            ClientName = "Test Service",
            IsActive = true
        };

        _repoMock.Setup(r => r.GetByClientIdAsync("test_client_id"))
            .ReturnsAsync(client);
        _jwtMock.Setup(j => j.GenerateServiceToken(client))
            .Returns("jwt.service.token");

        // Act
        var result = await _service.AuthenticateClientAsync("test_client_id", "secret123456");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("jwt.service.token", result.AccessToken);
        Assert.Equal("Bearer", result.TokenType);
        Assert.Equal("test_client_id", result.ClientId);
    }

    [Fact]
    public async Task AuthenticateClientAsync_WithInvalidSecret_ReturnsNull()
    {
        // Arrange
        var client = new ServiceClient
        {
            Id = Guid.NewGuid(),
            ClientId = "test_client_id",
            ClientSecret = "secret123456",
            IsActive = true
        };

        _repoMock.Setup(r => r.GetByClientIdAsync("test_client_id"))
            .ReturnsAsync(client);

        // Act
        var result = await _service.AuthenticateClientAsync("test_client_id", "wrong_secret");

        // Assert
        Assert.Null(result);
    }
}
