using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
