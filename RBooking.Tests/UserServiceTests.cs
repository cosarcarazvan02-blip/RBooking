using Moq;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using Xunit;

namespace RBooking.Tests;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IImageService> _imageServiceMock;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _imageServiceMock = new Mock<IImageService>();
        _userService = new UserService(_userRepositoryMock.Object, _imageServiceMock.Object);
    }

    [Fact]
    public async Task GetAllUsersAsync_ReturnsAllUserDtos()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = Guid.NewGuid(), FirstName = "Alice", LastName = "Smith", Email = "alice@example.com" },
            new User { Id = Guid.NewGuid(), FirstName = "Bob", LastName = "Jones", Email = "bob@example.com" }
        };

        _userRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(users);

        // Act
        var result = await _userService.GetAllUsersAsync();

        // Assert
        Assert.NotNull(result);
        var dtoList = result.ToList();
        Assert.Equal(2, dtoList.Count);
        Assert.Equal("Alice", dtoList[0].FirstName);
        Assert.Equal("Bob", dtoList[1].FirstName);
        _userRepositoryMock.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserExists_ReturnsUserDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FirstName = "Charlie", LastName = "Brown", Email = "charlie@example.com" };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

        // Act
        var result = await _userService.GetUserByIdAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
        Assert.Equal("Charlie", result.FirstName);
        Assert.Equal("charlie@example.com", result.Email);
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserDoesNotExist_ReturnsNull()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.GetUserByIdAsync(userId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateUserAsync_ValidDto_CreatesAndReturnsUserDto()
    {
        // Arrange
        var createUserDto = new CreateUserDto
        {
            FirstName = "David",
            LastName = "Miller",
            Email = "david@example.com"
        };

        _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        // Act
        var result = await _userService.CreateUserAsync(createUserDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("David", result.FirstName);
        Assert.Equal("Miller", result.LastName);
        Assert.Equal("david@example.com", result.Email);
        _userRepositoryMock.Verify(r => r.AddAsync(It.Is<User>(u => u.Email == "david@example.com")), Times.Once);
    }

    [Fact]
    public async Task UploadProfileImageAsync_WhenUserExists_DeletesOldImageAndSavesNewImage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            FirstName = "Eva",
            LastName = "Green",
            Email = "eva@example.com",
            ProfileImagePath = "profile-images/old-avatar.jpg"
        };

        using var stream = new MemoryStream(new byte[] { 1, 2, 3 });
        var fileName = "new-avatar.jpg";
        var newPath = "profile-images/new-avatar.jpg";

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _imageServiceMock.Setup(s => s.DeleteImageAsync(user.ProfileImagePath)).Returns(Task.CompletedTask);
        _imageServiceMock.Setup(s => s.SaveImageAsync(stream, fileName, "profile-images")).ReturnsAsync(newPath);
        _userRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        // Act
        var result = await _userService.UploadProfileImageAsync(userId, stream, fileName);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(newPath, result.ProfileImagePath);
        _imageServiceMock.Verify(s => s.DeleteImageAsync("profile-images/old-avatar.jpg"), Times.Once);
        _imageServiceMock.Verify(s => s.SaveImageAsync(stream, fileName, "profile-images"), Times.Once);
        _userRepositoryMock.Verify(r => r.UpdateAsync(It.Is<User>(u => u.ProfileImagePath == newPath)), Times.Once);
    }

    [Fact]
    public async Task UploadProfileImageAsync_WhenUserDoesNotExist_ReturnsNull()
    {
        // Arrange
        var userId = Guid.NewGuid();
        using var stream = new MemoryStream();

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.UploadProfileImageAsync(userId, stream, "test.jpg");

        // Assert
        Assert.Null(result);
        _imageServiceMock.Verify(s => s.SaveImageAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task DeleteUserAsync_WhenUserExistsWithProfileImage_DeletesImageAndUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            FirstName = "Frank",
            LastName = "Wright",
            Email = "frank@example.com",
            ProfileImagePath = "profile-images/frank.jpg"
        };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _imageServiceMock.Setup(s => s.DeleteImageAsync(user.ProfileImagePath)).Returns(Task.CompletedTask);
        _userRepositoryMock.Setup(r => r.DeleteAsync(userId)).ReturnsAsync(true);

        // Act
        var result = await _userService.DeleteUserAsync(userId);

        // Assert
        Assert.True(result);
        _imageServiceMock.Verify(s => s.DeleteImageAsync("profile-images/frank.jpg"), Times.Once);
        _userRepositoryMock.Verify(r => r.DeleteAsync(userId), Times.Once);
    }

    [Fact]
    public async Task DeleteUserAsync_WhenUserDoesNotExist_ReturnsFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.DeleteUserAsync(userId);

        // Assert
        Assert.False(result);
        _userRepositoryMock.Verify(r => r.DeleteAsync(userId), Times.Never);
    }
}
