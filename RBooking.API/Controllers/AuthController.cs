using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthController(IUserRepository userRepository, IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Email is required.");
        }

        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            // Auto-create user for demo/testing if email is provided
            user = new User
            {
                Email = request.Email,
                FirstName = request.Email.Split('@')[0],
                LastName = "User",
                CreatedAt = DateTime.UtcNow
            };
            await _userRepository.AddAsync(user);
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        var response = new AuthResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ProfileImagePath = user.ProfileImagePath,
                CreatedAt = user.CreatedAt
            }
        };

        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value 
                ?? User.FindFirst("email")?.Value;

            if (!string.IsNullOrEmpty(userEmail))
            {
                var userByEmail = await _userRepository.GetByEmailAsync(userEmail);
                if (userByEmail != null)
                {
                    return Ok(new UserDto
                    {
                        Id = userByEmail.Id,
                        FirstName = userByEmail.FirstName,
                        LastName = userByEmail.LastName,
                        Email = userByEmail.Email,
                        ProfileImagePath = userByEmail.ProfileImagePath,
                        CreatedAt = userByEmail.CreatedAt
                    });
                }
            }

            return Unauthorized(new { message = "User ID claim is missing or invalid in token." });
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = $"User with ID '{userId}' was not found in database." });
        }

        return Ok(new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            ProfileImagePath = user.ProfileImagePath,
            CreatedAt = user.CreatedAt
        });
    }
}
