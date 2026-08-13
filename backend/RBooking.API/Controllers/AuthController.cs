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
    private readonly IServiceClientService _serviceClientService;
    private readonly IEmailSender _emailSender;

    public AuthController(
        IUserRepository userRepository,
        IJwtTokenGenerator jwtTokenGenerator,
        IServiceClientService serviceClientService,
        IEmailSender emailSender)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
        _serviceClientService = serviceClientService;
        _emailSender = emailSender;
    }

    private static bool IsPasswordStrong(string password)
    {
        return password.Length >= 8
            && password.Any(char.IsUpper)
            && password.Any(char.IsLower)
            && password.Any(char.IsDigit);
    }

    private static UserRole RoleFromEmail(string emailTrimmed)
    {
        if (emailTrimmed.Contains("admin", StringComparison.OrdinalIgnoreCase))
        {
            return UserRole.Admin;
        }
        if (emailTrimmed.Contains("operator", StringComparison.OrdinalIgnoreCase) || emailTrimmed.Contains("manager", StringComparison.OrdinalIgnoreCase))
        {
            return UserRole.Operator;
        }
        return UserRole.Client;
    }

    private static AuthResponseDto BuildAuthResponse(User user, string token)
    {
        return new AuthResponseDto
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
    }

    /// <summary>
    /// Creează un cont nou. Distinct de login - aici impunem o parolă puternică
    /// și trimitem emailul de bun venit, pentru că e chiar momentul de înregistrare.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] LoginRequestDto request)
    {
        if (request == null)
        {
            return BadRequest(new { message = "Datele de înregistrare sunt obligatorii." });
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

        if (!IsPasswordStrong(request.Password))
        {
            return BadRequest(new { message = "Parola este prea slabă. Foloseste minim 8 caractere, cu cel puțin o literă mare, o literă mică și o cifră." });
        }

        var emailTrimmed = request.Email.Trim();
        var existing = await _userRepository.GetByEmailAsync(emailTrimmed);
        if (existing != null)
        {
            return Conflict(new { message = "Există deja un cont cu acest email. Te poți autentifica direct." });
        }

        var user = new User
        {
            Email = emailTrimmed,
            FirstName = emailTrimmed.Split('@')[0],
            LastName = "User",
            Role = RoleFromEmail(emailTrimmed),
            CreatedAt = DateTime.UtcNow
        };
        await _userRepository.AddAsync(user);

        await _emailSender.SendAsync(
            user.Email,
            "Bine ai venit la RBooking!",
            $"Salut {user.FirstName},\n\nContul tău RBooking a fost creat cu succes pe adresa {user.Email}.\n\nEchipa RBooking.");

        var token = _jwtTokenGenerator.GenerateToken(user);
        return Ok(BuildAuthResponse(user, token));
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
            return NotFound(new { message = "Nu există niciun cont cu acest email. Te rugăm să îți creezi unul din pagina de înregistrare." });
        }

        // Actualizăm rolul utilizatorului existent dacă emailul dictează un rol superior
        user.Role = RoleFromEmail(emailTrimmed);

        var token = _jwtTokenGenerator.GenerateToken(user);
        return Ok(BuildAuthResponse(user, token));
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

    /// <summary>
    /// Authenticates an external service (e.g. API B) via Client ID + Client Secret and issues a ServiceBearer JWT token.
    /// </summary>
    [HttpPost("client-token")]
    [HttpPost("token")]
    [AllowAnonymous]
    public async Task<ActionResult<ServiceClientTokenResponseDto>> GetClientToken([FromBody] ServiceClientTokenRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ClientId) || string.IsNullOrWhiteSpace(request.ClientSecret))
        {
            return BadRequest(new { message = "Client ID și Client Secret sunt obligatorii." });
        }

        var tokenResponse = await _serviceClientService.AuthenticateClientAsync(request.ClientId, request.ClientSecret);
        if (tokenResponse == null)
        {
            return Unauthorized(new { message = "Autentificare eșuată: Client ID sau Client Secret invalid." });
        }

        return Ok(tokenResponse);
    }

    /// <summary>
    /// Generates a new Client ID and Client Secret pair for a service and saves it to database.
    /// </summary>
    [HttpPost("clients/generate")]
    [HttpPost("generate-client")]
    [Authorize(AuthenticationSchemes = "UserBearer", Roles = "Admin")]
    public async Task<ActionResult<ServiceClientDto>> GenerateClient([FromBody] RegisterServiceClientDto? request)
    {
        var clientName = request?.ClientName ?? "API B Review Analytics Service";
        var client = await _serviceClientService.GenerateClientAsync(clientName);
        return Ok(client);
    }

    /// <summary>
    /// Returns all registered service clients.
    /// </summary>
    [HttpGet("clients")]
    [Authorize(AuthenticationSchemes = "UserBearer", Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<ServiceClientDto>>> GetClients()
    {
        var clients = await _serviceClientService.GetAllClientsAsync();
        return Ok(clients);
    }
}
