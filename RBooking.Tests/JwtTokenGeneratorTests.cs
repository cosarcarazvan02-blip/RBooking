using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Moq;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using Xunit;

namespace RBooking.Tests;

public class JwtTokenGeneratorTests
{
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly JwtTokenGenerator _jwtTokenGenerator;

    public JwtTokenGeneratorTests()
    {
        _configurationMock = new Mock<IConfiguration>();
        _jwtTokenGenerator = new JwtTokenGenerator(_configurationMock.Object);
    }

    [Fact]
    public void GenerateToken_WithValidUserAndConfiguration_ReturnsValidJwtToken()
    {
        // Arrange
        var secretKey = "SuperSecretTestKeyThatIsAtLeast32BytesLongForHmacSha256!";
        var issuer = "RBookingTestIssuer";
        var audience = "RBookingTestAudience";

        _configurationMock.Setup(c => c["Jwt:Key"]).Returns(secretKey);
        _configurationMock.Setup(c => c["Jwt:Issuer"]).Returns(issuer);
        _configurationMock.Setup(c => c["Jwt:Audience"]).Returns(audience);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "testuser@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        // Act
        var tokenString = _jwtTokenGenerator.GenerateToken(user);

        // Assert
        Assert.NotNull(tokenString);
        Assert.NotEmpty(tokenString);

        var handler = new JwtSecurityTokenHandler();
        Assert.True(handler.CanReadToken(tokenString));

        var jwtToken = handler.ReadJwtToken(tokenString);
        Assert.Equal(issuer, jwtToken.Issuer);
        Assert.Contains(audience, jwtToken.Audiences);

        var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == JwtRegisteredClaimNames.Email);
        Assert.NotNull(emailClaim);
        Assert.Equal("testuser@example.com", emailClaim.Value);

        var nameIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == JwtRegisteredClaimNames.Sub);
        Assert.NotNull(nameIdClaim);
        Assert.Equal(user.Id.ToString(), nameIdClaim.Value);
    }

    [Fact]
    public void GenerateToken_WhenJwtKeyMissing_ThrowsInvalidOperationException()
    {
        // Arrange
        _configurationMock.Setup(c => c["Jwt:Key"]).Returns((string?)null);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            FirstName = "Jane",
            LastName = "Smith"
        };

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() => _jwtTokenGenerator.GenerateToken(user));
        Assert.Equal("JWT Secret Key is not configured.", exception.Message);
    }
}
