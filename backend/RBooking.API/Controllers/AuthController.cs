using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

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
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (request == null)
        {
            return BadRequest(new { message = "Datele de autentificare sunt obligatorii." });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Adresa de email este obligatorie." });
        }

        var emailValidator = new System.ComponentModel.DataAnnotations.EmailAddressAttribute();
        if (!emailValidator.IsValid(request.Email.Trim()))
        {
            return BadRequest(new { message = "Formatul adresei de email este invalid (ex: nume@exemplu.com)." });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Parola este obligatorie." });
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new { message = "Parola trebuie să conțină cel puțin 6 caractere." });
        }

        var emailTrimmed = request.Email.Trim();
        var user = await _userRepository.GetByEmailAsync(emailTrimmed);
        if (user == null)
        {
            var role = UserRole.Client;
            if (emailTrimmed.Contains("admin", StringComparison.OrdinalIgnoreCase))
            {
                role = UserRole.Admin;
            }
            else if (emailTrimmed.Contains("operator", StringComparison.OrdinalIgnoreCase) || emailTrimmed.Contains("manager", StringComparison.OrdinalIgnoreCase))
            {
                role = UserRole.Operator;
            }

            // Auto-create user for demo/testing if email is provided
            user = new User
            {
                Email = request.Email,
                FirstName = request.Email.Split('@')[0],
                LastName = "User",
                Role = role,
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
                Role = user.Role.ToString(),
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
                        Role = userByEmail.Role.ToString(),
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
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        });
    }
}
