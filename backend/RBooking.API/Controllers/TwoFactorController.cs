using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.Constants;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TwoFactorController : ControllerBase
{
    private readonly ITwoFactorService _twoFactorService;
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public TwoFactorController(
        ITwoFactorService twoFactorService,
        IUserRepository userRepository,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _twoFactorService = twoFactorService;
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
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

    private bool TryGetUserId(out Guid userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(userIdClaim, out userId);
    }

    /// <summary>
    /// Generează un secret TOTP nou și codul QR pentru scanare într-o aplicație de authenticator.
    /// </summary>
    [HttpPost("setup")]
    public async Task<ActionResult<TwoFactorSetupResponseDto>> Setup()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "User ID claim is missing or invalid in token." });
        }

        var result = await _twoFactorService.SetupAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Confirmă setup-ul: verifică codul de 6 cifre din aplicația de authenticator și activează 2FA pe cont.
    /// </summary>
    [HttpPost("verify")]
    public async Task<ActionResult> Verify([FromBody] TwoFactorVerifyRequestDto request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "User ID claim is missing or invalid in token." });
        }

        var success = await _twoFactorService.VerifyAndEnableAsync(userId, request.Code);
        if (!success)
        {
            return BadRequest(new { message = "Codul introdus este invalid sau a expirat." });
        }

        return Ok(new { message = "Autentificarea în doi pași a fost activată cu succes." });
    }

    /// <summary>
    /// Al doilea pas al login-ului cand contul are 2FA activ: primeste tokenul temporar
    /// emis de POST /api/Auth/login + codul din aplicatia de authenticator, si emite
    /// tokenul complet de sesiune daca totul e valid.
    /// </summary>
    [HttpPost("login-verify")]
    [Authorize(AuthenticationSchemes = TwoFactorAuthConstants.PendingSchemeName)]
    public async Task<ActionResult<AuthResponseDto>> LoginVerify([FromBody] TwoFactorVerifyRequestDto request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Tokenul temporar este invalid sau a expirat." });
        }

        var isValid = await _twoFactorService.ValidateCodeAsync(userId, request.Code);
        if (!isValid)
        {
            return BadRequest(new { message = "Codul introdus este invalid sau a expirat." });
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Unauthorized(new { message = "Tokenul temporar este invalid sau a expirat." });
        }

        var token = _jwtTokenGenerator.GenerateToken(user);
        return Ok(BuildAuthResponse(user, token));
    }

    [HttpGet("status")]
    public async Task<ActionResult<TwoFactorStatusResponseDto>> Status()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "User ID claim is missing or invalid in token." });
        }

        return Ok(await _twoFactorService.GetStatusAsync(userId));
    }

    [HttpPost("disable")]
    public async Task<ActionResult> Disable([FromBody] TwoFactorDisableRequestDto request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "User ID claim is missing or invalid in token." });
        }

        var success = await _twoFactorService.DisableAsync(userId, request.Code);
        if (!success)
        {
            return BadRequest(new { message = "Codul introdus este invalid." });
        }

        return Ok(new { message = "Autentificarea în doi pași a fost dezactivată." });
    }
}
