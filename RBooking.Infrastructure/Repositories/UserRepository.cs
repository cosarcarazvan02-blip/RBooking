using System.Collections.Concurrent;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ConcurrentBag<User> _users = new()
    {
        new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            FirstName = "Ion",
            LastName = "Popescu",
            Email = "ion.popescu@example.com",
            CreatedAt = DateTime.UtcNow
        },
        new User
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            FirstName = "Maria",
            LastName = "Ionescu",
            Email = "maria.ionescu@example.com",
            CreatedAt = DateTime.UtcNow
        }
    };

    public Task<IEnumerable<User>> GetAllAsync()
    {
        return Task.FromResult<IEnumerable<User>>(_users);
    }

    public Task<User?> GetByIdAsync(Guid id)
    {
        var user = _users.FirstOrDefault(u => u.Id == id);
        return Task.FromResult(user);
    }

    public Task<User> AddAsync(User user)
    {
        _users.Add(user);
        return Task.FromResult(user);
    }
}
