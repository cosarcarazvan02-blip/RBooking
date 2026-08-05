using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.API.Controllers;

[AllowAnonymous]
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
    public async Task<ActionResult<PagedResultDto<AccommodationDto>>> GetFiltered([FromQuery] AccommodationFilterDto filter)
    {
        var result = await _accommodationService.GetFilteredAccommodationsAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Gets a single accommodation by ID with rating statistics.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AccommodationDto>> GetById(Guid id)
    {
        var accommodation = await _accommodationService.GetAccommodationByIdAsync(id);
        if (accommodation == null)
        {
            return NotFound(new { message = $"Accommodation with ID {id} was not found." });
        }
        return Ok(accommodation);
    }
}
