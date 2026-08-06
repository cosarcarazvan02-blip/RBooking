using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccommodationsController : ControllerBase
{
    private readonly IAccommodationService _accommodationService;

    public AccommodationsController(IAccommodationService accommodationService)
    {
        _accommodationService = accommodationService;
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
    [Authorize(Roles = "Operator")]
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
}
