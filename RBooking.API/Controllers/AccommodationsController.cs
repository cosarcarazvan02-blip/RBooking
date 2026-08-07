using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Enums;
using RBooking.Infrastructure.Data;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccommodationsController : ControllerBase
{
    private readonly IAccommodationService _accommodationService;
    private readonly IAccommodationReportService _accommodationReportService;

    public AccommodationsController(
        IAccommodationService accommodationService,
        IAccommodationReportService accommodationReportService)
    {
        _accommodationService = accommodationService;
        _accommodationReportService = accommodationReportService;
    }

    /// <summary>
    /// Generates a CSV, XLSX, or PDF report for accommodations with selected columns and multi-column filtering.
    /// </summary>
    [HttpPost("report")]
    [AllowAnonymous]
    public async Task<IActionResult> GenerateReport([FromBody] AccommodationReportRequestDto request)
    {
        var (content, contentType, fileName) = await _accommodationReportService.GenerateReportAsync(request);
        return File(content, contentType, fileName);
    }

    /// <summary>
    /// Seeds mock accommodations, images, and reviews into the database.
    /// </summary>
    [HttpPost("seed")]
    [AllowAnonymous]
    public async Task<IActionResult> SeedMockAccommodations([FromServices] AppDbContext context)
    {
        var count = await DbSeeder.SeedAsync(context);
        return Ok(new { message = $"Successfully seeded database with {count} mock accommodations and reviews.", count });
    }

    /// <summary>
    /// Gets a paginated list of accommodations with optional filtering by location, price, rating, and type.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResultDto<AccommodationDto>>> GetFiltered([FromQuery] AccommodationFilterDto filter)
    {
        var result = await _accommodationService.GetFilteredAccommodationsAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Gets a single accommodation by ID with rating statistics.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<AccommodationDto>> GetById(Guid id)
    {
        var accommodation = await _accommodationService.GetAccommodationByIdAsync(id);
        if (accommodation == null)
        {
            return NotFound(new { message = $"Accommodation with ID {id} was not found." });
        }
        return Ok(accommodation);
    }

    /// <summary>
    /// Creates a new accommodation associated with the logged-in operator.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<ActionResult<AccommodationDto>> Create([FromBody] CreateAccommodationDto createDto)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var currentUserId))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        try
        {
            var createdAccommodation = await _accommodationService.CreateAccommodationAsync(currentUserId, createDto);
            return CreatedAtAction(nameof(GetById), new { id = createdAccommodation.Id }, createdAccommodation);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateAccommodationDto updateDto)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roleString = User.FindFirstValue(ClaimTypes.Role);

        if (!Guid.TryParse(userIdString, out var currentUserId) || 
            !Enum.TryParse<UserRole>(roleString, out var currentUserRole))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        try
        {
            var success = await _accommodationService.UpdateAccommodationAsync(id, currentUserId, currentUserRole, updateDto);
            if (!success)
            {
                return NotFound(new { message = $"Accommodation with ID {id} was not found." });
            }
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roleString = User.FindFirstValue(ClaimTypes.Role);

        if (!Guid.TryParse(userIdString, out var currentUserId) || 
            !Enum.TryParse<UserRole>(roleString, out var currentUserRole))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        try
        {
            var success = await _accommodationService.DeleteAccommodationAsync(id, currentUserId, currentUserRole);
            if (!success)
            {
                return NotFound(new { message = $"Accommodation with ID {id} was not found." });
            }
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}
