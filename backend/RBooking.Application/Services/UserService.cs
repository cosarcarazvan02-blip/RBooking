using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IImageService _imageService;

    public UserService(IUserRepository userRepository, IImageService imageService)
    {
        _userRepository = userRepository;
        _imageService = imageService;
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(MapToDto);
    }

    public async Task<PagedResultDto<UserDto>> GetPagedUsersAsync(PaginationParamsDto paginationParams)
    {
        var (items, totalCount) = await _userRepository.GetPagedAsync(paginationParams.PageNumber, paginationParams.PageSize);
        var dtos = items.Select(MapToDto);
        return new PagedResultDto<UserDto>(dtos, totalCount, paginationParams.PageNumber, paginationParams.PageSize);
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto)
    {
        System.Enum.TryParse<RBooking.Domain.Enums.UserRole>(createUserDto.Role, true, out var role);
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = createUserDto.FirstName,
            LastName = createUserDto.LastName,
            Email = createUserDto.Email,
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        var createdUser = await _userRepository.AddAsync(user);
        return MapToDto(createdUser);
    }

    public async Task<UserDto?> UploadProfileImageAsync(Guid userId, Stream fileStream, string fileName)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return null;

        // Delete old profile image if exists
        if (!string.IsNullOrEmpty(user.ProfileImagePath))
        {
            await _imageService.DeleteImageAsync(user.ProfileImagePath);
        }

        // Save new profile image
        var relativePath = await _imageService.SaveImageAsync(fileStream, fileName, "profile-images");
        user.ProfileImagePath = relativePath;

        await _userRepository.UpdateAsync(user);
        return MapToDto(user);
    }

    public async Task<(byte[] FileBytes, string ContentType)?> GetProfileImageAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || string.IsNullOrEmpty(user.ProfileImagePath)) return null;

        return await _imageService.GetImageAsync(user.ProfileImagePath);
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        if (!string.IsNullOrEmpty(user.ProfileImagePath))
        {
            await _imageService.DeleteImageAsync(user.ProfileImagePath);
        }

        return await _userRepository.DeleteAsync(id);
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            ProfileImagePath = user.ProfileImagePath,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        };
    }
}
