using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Enums;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/host-applications")]
[Authorize]
public class HostApplicationsController : ControllerBase
{
    private readonly IHostApplicationService _hostApplicationService;

    public HostApplicationsController(IHostApplicationService hostApplicationService)
    {
        _hostApplicationService = hostApplicationService;
    }

    private bool TryGetCurrentUser(out Guid userId, out UserRole role)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roleString = User.FindFirstValue(ClaimTypes.Role);

        var validUserId = Guid.TryParse(userIdString, out userId);
        var validRole = Enum.TryParse(roleString, out role);
        return validUserId && validRole;
    }

    [HttpPost]
    public async Task<ActionResult<HostApplicationDto>> Submit([FromBody] CreateHostApplicationDto? dto)
    {
        if (!TryGetCurrentUser(out var currentUserId, out _))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        try
        {
            var created = await _hostApplicationService.SubmitApplicationAsync(currentUserId, dto ?? new CreateHostApplicationDto());
            return CreatedAtAction(nameof(GetMine), created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpGet("mine")]
    public async Task<ActionResult<HostApplicationDto?>> GetMine()
    {
        if (!TryGetCurrentUser(out var currentUserId, out _))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        var application = await _hostApplicationService.GetMyLatestApplicationAsync(currentUserId);
        return Ok(application);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<HostApplicationDto>>> GetAll([FromQuery] string? status)
    {
        if (!TryGetCurrentUser(out _, out var currentUserRole))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        HostApplicationStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<HostApplicationStatus>(status, true, out var statusValue))
            {
                return BadRequest(new { message = $"Status invalid: {status}" });
            }
            parsedStatus = statusValue;
        }

        try
        {
            var applications = await _hostApplicationService.GetApplicationsAsync(currentUserRole, parsedStatus);
            return Ok(applications);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<HostApplicationDto>> Approve(Guid id)
    {
        if (!TryGetCurrentUser(out var currentUserId, out var currentUserRole))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        try
        {
            var updated = await _hostApplicationService.ApproveAsync(id, currentUserId, currentUserRole);
            return Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<HostApplicationDto>> Reject(Guid id, [FromBody] RejectHostApplicationDto dto)
    {
        if (!TryGetCurrentUser(out var currentUserId, out var currentUserRole))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        try
        {
            var updated = await _hostApplicationService.RejectAsync(id, currentUserId, currentUserRole, dto?.Reason ?? string.Empty);
            return Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
