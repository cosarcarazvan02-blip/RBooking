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
    /// Endpoint HTTP GET pentru obținerea cazărilor filtrate și paginate.
    /// Exemplu apel: GET /api/Accommodations/filtered?location=Cluj&minPrice=100&minRating=4
    /// </summary>
    /// <param name="filter">Parametrii preluați automat din Query String de ASP.NET Core</param>
    [HttpGet("filtered")]
    public async Task<ActionResult<(IEnumerable<AccommodationDto> Items, int TotalCount)>> GetFiltered(
        [FromQuery] AccommodationFilterDto filter)
    {
        // Apelăm serviciul pentru a obține datele filtrate
        var result = await _accommodationService.GetPagedFilteredAsync(filter);
        
        // Returnăm rezultatul cu status 200 OK
        return Ok(result);
    }
}