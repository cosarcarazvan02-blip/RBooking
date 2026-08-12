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
    [HttpGet("report")]
    [AllowAnonymous]
    public async Task<IActionResult> GenerateReport(
        [FromQuery] string format = "csv",
        [FromQuery] List<string>? columns = null,
        [FromQuery] AccommodationReportFilterDto? filter = null)
    {
        var resolvedColumns = new List<string>();
        if (columns != null && columns.Any())
        {
            foreach (var col in columns)
            {
                if (!string.IsNullOrWhiteSpace(col))
                {
                    var parts = col.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    resolvedColumns.AddRange(parts);
                }
            }
        }

        var request = new AccommodationReportRequestDto
        {
            Format = format,
            Columns = resolvedColumns.Any() ? resolvedColumns : null,
            Filters = filter
        };

        var (content, contentType, fileName) = await _accommodationReportService.GenerateReportAsync(request);
        return File(content, contentType, fileName);
    }

    /// <summary>
    /// Imports accommodations from a CSV file with line-by-line validation and duplicate checking.
    /// </summary>
    [HttpPost("import-csv")]
    [AllowAnonymous]
    public async Task<ActionResult<AccommodationCsvImportResultDto>> ImportCsv(
        IFormFile file,
        [FromServices] IAccommodationCsvImportService importService)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Fișierul CSV este obligatoriu." });
        }

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

        using var stream = file.OpenReadStream();
        var result = await importService.ImportCsvAsync(stream, userIdString);

        return Ok(result);
    }

    /// <summary>
    /// Seeds mock accommodations, images, and reviews into the database on demand.
    /// </summary>
    [HttpPost("seed")]
    [AllowAnonymous]
    public async Task<IActionResult> SeedMockAccommodations([FromServices] AppDbContext context)
    {
        var count = await DbSeeder.SeedMockAccommodationsAsync(context);
        return Ok(new { message = $"Baza de date a fost populată cu {count} cazări demonstrative.", count });
    }

    /// <summary>
    /// Clears all accommodations, images, reviews, and reservations from the database for a clean blank state.
    /// </summary>
    [HttpDelete("clear-all")]
    [AllowAnonymous]
    public async Task<IActionResult> ClearAllAccommodations([FromServices] AppDbContext context)
    {
        context.Reviews.RemoveRange(context.Reviews);
        context.Reservations.RemoveRange(context.Reservations);
        context.AccommodationImages.RemoveRange(context.AccommodationImages);
        context.Accommodations.RemoveRange(context.Accommodations);
        await context.SaveChangesAsync();
        return Ok(new { message = "Toate cazările și datele asociate au fost șterse cu succes din baza de date. Baza de date este acum complet curată (0 cazări)." });
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

    private bool TryGetCurrentUser(out Guid userId, out UserRole role)
    {
        userId = Guid.Empty;
        role = UserRole.Operator;

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? User.FindFirstValue("id");
        var roleString = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");

        if (!Guid.TryParse(userIdString, out userId))
        {
            userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        }

        if (string.Equals(roleString, "Manager", StringComparison.OrdinalIgnoreCase))
        {
            roleString = "Operator";
        }

        if (!Enum.TryParse<UserRole>(roleString, true, out role))
        {
            role = UserRole.Operator;
        }

        return true;
    }

    /// <summary>
    /// Creates a new accommodation associated with the logged-in operator.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Operator,Admin,Manager")]
    public async Task<ActionResult<AccommodationDto>> Create([FromBody] CreateAccommodationDto createDto)
    {
        TryGetCurrentUser(out var currentUserId, out _);

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
    [Authorize(Roles = "Operator,Admin,Manager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateAccommodationDto updateDto)
    {
        TryGetCurrentUser(out var currentUserId, out var currentUserRole);

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
    [Authorize(Roles = "Operator,Admin,Manager")]
    public async Task<IActionResult> Delete(Guid id)
    {
        TryGetCurrentUser(out var currentUserId, out var currentUserRole);

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
