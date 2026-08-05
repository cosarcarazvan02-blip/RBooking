using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<PagedResultDto<UserDto>> GetPagedUsersAsync(PaginationParamsDto paginationParams);
    Task<UserDto?> GetUserByIdAsync(Guid id);
    Task<UserDto> CreateUserAsync(CreateUserDto createUserDto);
    Task<UserDto?> UploadProfileImageAsync(Guid userId, Stream fileStream, string fileName);
    Task<(byte[] FileBytes, string ContentType)?> GetProfileImageAsync(Guid userId);
    Task<bool> DeleteUserAsync(Guid id);
}
