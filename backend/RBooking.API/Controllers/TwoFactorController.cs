using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TwoFactorController : ControllerBase
{
    private readonly ITwoFactorService _twoFactorService;

    public TwoFactorController(ITwoFactorService twoFactorService)
    {
        _twoFactorService = twoFactorService;
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
