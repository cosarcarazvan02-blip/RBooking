using Moq;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;
using Xunit;

namespace RBooking.Tests;

public class HostApplicationServiceTests
{
    private readonly Mock<IHostApplicationRepository> _hostApplicationRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly HostApplicationService _sut;

    public HostApplicationServiceTests()
    {
        _hostApplicationRepositoryMock = new Mock<IHostApplicationRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();

        _sut = new HostApplicationService(
            _hostApplicationRepositoryMock.Object,
            _userRepositoryMock.Object);
    }

    [Fact]
    public async Task SubmitApplicationAsync_NewClientNoPending_CreatesApplication()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "client@example.com", Role = UserRole.Client };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _hostApplicationRepositoryMock.Setup(r => r.GetPendingByUserIdAsync(userId)).ReturnsAsync((HostApplication?)null);
        _hostApplicationRepositoryMock.Setup(r => r.AddAsync(It.IsAny<HostApplication>()))
            .ReturnsAsync((HostApplication a) => a);

        // Act
        var result = await _sut.SubmitApplicationAsync(userId, new CreateHostApplicationDto { Message = "Vreau sa devin operator" });

        // Assert
        Assert.Equal(HostApplicationStatus.Pending, result.Status);
        _hostApplicationRepositoryMock.Verify(r => r.AddAsync(It.Is<HostApplication>(a =>
            a.UserId == userId && a.Status == HostApplicationStatus.Pending)), Times.Once);
    }

    [Fact]
    public async Task SubmitApplicationAsync_UserAlreadyOperator_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Role = UserRole.Operator };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.SubmitApplicationAsync(userId, new CreateHostApplicationDto()));
        _hostApplicationRepositoryMock.Verify(r => r.AddAsync(It.IsAny<HostApplication>()), Times.Never);
    }

    [Fact]
    public async Task SubmitApplicationAsync_ExistingPendingApplication_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Role = UserRole.Client };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _hostApplicationRepositoryMock.Setup(r => r.GetPendingByUserIdAsync(userId))
            .ReturnsAsync(new HostApplication { UserId = userId, Status = HostApplicationStatus.Pending });

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.SubmitApplicationAsync(userId, new CreateHostApplicationDto()));
        _hostApplicationRepositoryMock.Verify(r => r.AddAsync(It.IsAny<HostApplication>()), Times.Never);
    }

    [Fact]
    public async Task GetApplicationsAsync_NonAdmin_ThrowsUnauthorizedAccessException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _sut.GetApplicationsAsync(UserRole.Operator, null));
    }

    [Fact]
    public async Task ApproveAsync_NonAdmin_ThrowsUnauthorizedAccessException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _sut.ApproveAsync(Guid.NewGuid(), Guid.NewGuid(), UserRole.Client));
        _hostApplicationRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task ApproveAsync_PendingApplication_SetsApprovedAndPromotesUserToOperator()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var applicantId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        var applicant = new User { Id = applicantId, Role = UserRole.Client };
        var application = new HostApplication
        {
            Id = applicationId,
            UserId = applicantId,
            User = applicant,
            Status = HostApplicationStatus.Pending
        };

        _hostApplicationRepositoryMock.Setup(r => r.GetByIdAsync(applicationId)).ReturnsAsync(application);
        _hostApplicationRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<HostApplication>()))
            .ReturnsAsync((HostApplication a) => a);

        // Act
        var result = await _sut.ApproveAsync(applicationId, adminId, UserRole.Admin);

        // Assert
        Assert.Equal(HostApplicationStatus.Approved, result.Status);
        Assert.Equal(adminId, application.ReviewedByUserId);
        Assert.NotNull(application.ReviewedAt);
        Assert.Equal(UserRole.Operator, applicant.Role);
        _userRepositoryMock.Verify(r => r.UpdateAsync(It.Is<User>(u => u.Id == applicantId && u.Role == UserRole.Operator)), Times.Once);
    }

    [Fact]
    public async Task ApproveAsync_AlreadyReviewed_ThrowsInvalidOperationException()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var application = new HostApplication { Id = applicationId, Status = HostApplicationStatus.Approved };
        _hostApplicationRepositoryMock.Setup(r => r.GetByIdAsync(applicationId)).ReturnsAsync(application);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ApproveAsync(applicationId, Guid.NewGuid(), UserRole.Admin));
    }

    [Fact]
    public async Task RejectAsync_NonAdmin_ThrowsUnauthorizedAccessException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _sut.RejectAsync(Guid.NewGuid(), Guid.NewGuid(), UserRole.Client, "motiv"));
    }

    [Fact]
    public async Task RejectAsync_EmptyReason_ThrowsArgumentException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.RejectAsync(Guid.NewGuid(), Guid.NewGuid(), UserRole.Admin, ""));
        _hostApplicationRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task RejectAsync_PendingApplicationWithReason_SetsRejectedWithReason()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        var application = new HostApplication { Id = applicationId, Status = HostApplicationStatus.Pending };

        _hostApplicationRepositoryMock.Setup(r => r.GetByIdAsync(applicationId)).ReturnsAsync(application);
        _hostApplicationRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<HostApplication>()))
            .ReturnsAsync((HostApplication a) => a);

        // Act
        var result = await _sut.RejectAsync(applicationId, adminId, UserRole.Admin, "Nu îndeplinește condițiile.");

        // Assert
        Assert.Equal(HostApplicationStatus.Rejected, result.Status);
        Assert.Equal("Nu îndeplinește condițiile.", result.RejectionReason);
        _userRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<User>()), Times.Never);
    }
}
