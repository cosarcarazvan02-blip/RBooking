using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(u => new UserDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email,
            CreatedAt = u.CreatedAt
        });
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = createUserDto.FirstName,
            LastName = createUserDto.LastName,
            Email = createUserDto.Email,
            CreatedAt = DateTime.UtcNow
        };

        var createdUser = await _userRepository.AddAsync(user);

        return new UserDto
        {
            Id = createdUser.Id,
            FirstName = createdUser.FirstName,
            LastName = createdUser.LastName,
            Email = createdUser.Email,
            CreatedAt = createdUser.CreatedAt
        };
    }
}
