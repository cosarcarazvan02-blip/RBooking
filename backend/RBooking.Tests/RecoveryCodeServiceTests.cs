using Moq;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using Xunit;

namespace RBooking.Tests;

public class RecoveryCodeServiceTests
{
    private readonly Mock<IRecoveryCodeRepository> _recoveryCodeRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IJwtTokenGenerator> _jwtTokenGeneratorMock;
    private readonly RecoveryCodeService _service;

    public RecoveryCodeServiceTests()
    {
        _recoveryCodeRepositoryMock = new Mock<IRecoveryCodeRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _jwtTokenGeneratorMock = new Mock<IJwtTokenGenerator>();

        _service = new RecoveryCodeService(
            _recoveryCodeRepositoryMock.Object,
            _userRepositoryMock.Object,
            _jwtTokenGeneratorMock.Object);
    }

    [Fact]
    public async Task GenerateCodesAsync_WhenUserExists_GeneratesRequestedUniqueCodesAndSavesHashes()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "user@example.com" };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _recoveryCodeRepositoryMock.Setup(r => r.GetTotalCountByUserIdAsync(userId)).ReturnsAsync(0);

        IEnumerable<string>? capturedHashes = null;
        _recoveryCodeRepositoryMock
            .Setup(r => r.SaveCodesAsync(userId, It.IsAny<IEnumerable<string>>()))
            .Callback<Guid, IEnumerable<string>>((_, hashes) => capturedHashes = hashes)
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.GenerateCodesAsync(userId, 10);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Codes.Count);
        Assert.Equal(10, result.TotalCount);
        Assert.Equal(10, result.RemainingCount);
        Assert.Equal(10, result.Codes.Distinct().Count());
        Assert.All(result.Codes, c => Assert.Matches(@"^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$", c));

        _recoveryCodeRepositoryMock.Verify(r => r.SaveCodesAsync(userId, It.IsAny<IEnumerable<string>>()), Times.Once);
        Assert.NotNull(capturedHashes);
        Assert.Equal(10, capturedHashes.Count());
    }

    [Fact]
    public async Task GenerateCodesAsync_WhenCodesAlreadyExist_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "user@example.com" };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _recoveryCodeRepositoryMock.Setup(r => r.GetTotalCountByUserIdAsync(userId)).ReturnsAsync(10);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.GenerateCodesAsync(userId, 10));
        Assert.Contains("deja generate", ex.Message);
    }

    [Fact]
    public async Task GenerateCodesAsync_WhenUserNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.GenerateCodesAsync(userId, 10));
    }

    [Fact]
    public async Task GetStatusAsync_ReturnsCorrectCountsAndTwoFactorState()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "user@example.com", TwoFactorEnabled = true };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _recoveryCodeRepositoryMock.Setup(r => r.GetTotalCountByUserIdAsync(userId)).ReturnsAsync(10);
        _recoveryCodeRepositoryMock.Setup(r => r.GetRemainingCountByUserIdAsync(userId)).ReturnsAsync(7);

        // Act
        var status = await _service.GetStatusAsync(userId);

        // Assert
        Assert.NotNull(status);
        Assert.True(status.TwoFactorEnabled);
        Assert.True(status.HasRecoveryCodes);
        Assert.Equal(10, status.TotalCodes);
        Assert.Equal(7, status.RemainingCodes);
    }

    [Fact]
    public async Task VerifyAndConsumeRecoveryCodeAsync_ValidCode_ConsumesCodeAndReturnsTokenAndUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            FirstName = "Maria",
            LastName = "Ionescu",
            Email = "maria@example.com",
            TwoFactorEnabled = true
        };

        var rawCode = "7K2M-9P4X";
        var normalized = RecoveryCodeService.NormalizeCode(rawCode);
        var expectedHash = RecoveryCodeService.HashCode(normalized);

        _userRepositoryMock.Setup(r => r.GetByEmailAsync("maria@example.com")).ReturnsAsync(user);
        _recoveryCodeRepositoryMock
            .Setup(r => r.ConsumeCodeAsync(userId, expectedHash))
            .ReturnsAsync((true, 5));
        _jwtTokenGeneratorMock.Setup(g => g.GenerateToken(user)).Returns("mock-jwt-token");

        // Act
        var result = await _service.VerifyAndConsumeRecoveryCodeAsync("maria@example.com", "7k2m9p4x"); // lowercase & without hyphen test

        // Assert
        Assert.NotNull(result);
        Assert.Equal("mock-jwt-token", result.Token);
        Assert.Equal(5, result.RemainingCodes);
        Assert.Equal("Maria", result.User.FirstName);
        Assert.Equal("maria@example.com", result.User.Email);
        Assert.Null(result.WarningMessage); // remaining is > 2, no warning
    }

    [Fact]
    public async Task VerifyAndConsumeRecoveryCodeAsync_WhenRemainingCodesLow_ReturnsWarningMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "test@example.com", FirstName = "Dan" };
        var rawCode = "ABCD-EF23";

        _userRepositoryMock.Setup(r => r.GetByEmailAsync("test@example.com")).ReturnsAsync(user);
        _recoveryCodeRepositoryMock
            .Setup(r => r.ConsumeCodeAsync(userId, It.IsAny<string>()))
            .ReturnsAsync((true, 1));
        _jwtTokenGeneratorMock.Setup(g => g.GenerateToken(user)).Returns("jwt-token");

        // Act
        var result = await _service.VerifyAndConsumeRecoveryCodeAsync("test@example.com", rawCode);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.RemainingCodes);
        Assert.NotNull(result.WarningMessage);
        Assert.Contains("1", result.WarningMessage);
    }

    [Fact]
    public async Task VerifyAndConsumeRecoveryCodeAsync_WhenInvalidOrAlreadyUsedCode_ReturnsNull()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "user@example.com" };

        _userRepositoryMock.Setup(r => r.GetByEmailAsync("user@example.com")).ReturnsAsync(user);
        _recoveryCodeRepositoryMock
            .Setup(r => r.ConsumeCodeAsync(userId, It.IsAny<string>()))
            .ReturnsAsync((false, 0));

        // Act
        var result = await _service.VerifyAndConsumeRecoveryCodeAsync("user@example.com", "INVALID-CODE");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task VerifyAndConsumeRecoveryCodeAsync_WhenUserDoesNotExist_ReturnsNull()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.GetByEmailAsync("nonexistent@example.com")).ReturnsAsync((User?)null);

        // Act
        var result = await _service.VerifyAndConsumeRecoveryCodeAsync("nonexistent@example.com", "7K2M-9P4X");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ToggleTwoFactorAsync_UpdatesUserState()
    {
        // Arrange - un secret TOTP deja confirmat trebuie sa existe pentru a putea activa 2FA
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "user@example.com", TwoFactorEnabled = false, TwoFactorSecret = "protected-secret" };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _userRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        // Act
        var result = await _service.ToggleTwoFactorAsync(userId, true);

        // Assert
        Assert.True(result);
        Assert.True(user.TwoFactorEnabled);
        _userRepositoryMock.Verify(r => r.UpdateAsync(It.Is<User>(u => u.TwoFactorEnabled == true)), Times.Once);
    }

    [Fact]
    public async Task ToggleTwoFactorAsync_WithoutConfirmedSecret_FailsInsteadOfLockingUserOut()
    {
        // Arrange - fara un secret TOTP, activarea 2FA ar bloca userul la urmatorul login
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "user@example.com", TwoFactorEnabled = false, TwoFactorSecret = null };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

        // Act
        var result = await _service.ToggleTwoFactorAsync(userId, true);

        // Assert
        Assert.False(result);
        Assert.False(user.TwoFactorEnabled);
        _userRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<User>()), Times.Never);
    }

    [Theory]
    [InlineData("a3b9-f8c2", "A3B9F8C2")]
    [InlineData(" A3B9 - F8C2 ", "A3B9F8C2")]
    [InlineData("a3b9f8c2", "A3B9F8C2")]
    public void NormalizeCode_StripsNonAlphanumericAndConvertsToUpper(string input, string expected)
    {
        var result = RecoveryCodeService.NormalizeCode(input);
        Assert.Equal(expected, result);
    }
}
