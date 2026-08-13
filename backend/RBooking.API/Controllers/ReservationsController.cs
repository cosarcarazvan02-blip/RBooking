using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.Constants;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<ReservationDto>>> GetPaged([FromQuery] PaginationParamsDto paginationParams)
    {
        var result = await _reservationService.GetPagedReservationsAsync(paginationParams);
        return Ok(result);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAll()
    {
        var reservations = await _reservationService.GetAllReservationsAsync();
        return Ok(reservations);
    }

    [HttpGet("{id:guid}")]
    [Authorize(AuthenticationSchemes = "UserBearer,ServiceBearer")]
    public async Task<ActionResult<ReservationDto>> GetById(Guid id)
    {
        var reservation = await _reservationService.GetReservationByIdAsync(id);
        if (reservation == null)
        {
            return NotFound(new { message = $"Reservation with ID {id} was not found." });
        }
        return Ok(reservation);
    }

    /// <summary>
    /// Service-to-service endpoint: returns a page of future, non-cancelled reservations
    /// for an accommodation. Called by API B (WebhookAPI) to notify affected users after an accommodation update.
    /// </summary>
    [HttpGet("by-accommodation/{accommodationId:guid}/future")]
    [Authorize(AuthenticationSchemes = ServiceAuthConstants.SchemeName)]
    public async Task<ActionResult<PagedResultDto<ReservationDto>>> GetFutureByAccommodationId(Guid accommodationId, [FromQuery] PaginationParamsDto paginationParams)
    {
        var result = await _reservationService.GetPagedFutureReservationsByAccommodationIdAsync(accommodationId, paginationParams);
        return Ok(result);
    }

    [HttpGet("accommodation/{accommodationId:guid}")]
    [Authorize(AuthenticationSchemes = "UserBearer,ServiceBearer")]
    public async Task<ActionResult<PagedResultDto<ReservationDto>>> GetByAccommodationId(Guid accommodationId, [FromQuery] PaginationParamsDto paginationParams)
    {
        var result = await _reservationService.GetPagedReservationsByAccommodationIdAsync(accommodationId, paginationParams);
        return Ok(result);
    }

    [HttpGet("user/{userId:guid}")]
    [Authorize(Roles = "Client,Operator,Admin")]
    public async Task<ActionResult<PagedResultDto<ReservationDto>>> GetByUserId(Guid userId, [FromQuery] PaginationParamsDto paginationParams)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roleString = User.FindFirstValue(ClaimTypes.Role);

        if (!Guid.TryParse(userIdString, out var currentUserId) ||
            !Enum.TryParse<UserRole>(roleString, out var currentUserRole))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        if (currentUserRole == UserRole.Client && currentUserId != userId)
        {
            return Forbid();
        }

        var result = await _reservationService.GetPagedReservationsByUserIdAsync(userId, paginationParams);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ReservationDto>> Create([FromBody] CreateReservationDto createReservationDto)
    {
        try
        {
            var createdReservation = await _reservationService.CreateReservationAsync(createReservationDto);
            return CreatedAtAction(nameof(GetById), new { id = createdReservation.Id }, createdReservation);
        }
        catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ReservationDto>> UpdateStatus(Guid id, [FromBody] UpdateReservationStatusDto updateStatusDto)
    {
        var updatedReservation = await _reservationService.UpdateReservationStatusAsync(id, updateStatusDto.Status);
        if (updatedReservation == null)
        {
            return NotFound(new { message = $"Reservation with ID {id} was not found." });
        }
        return Ok(updatedReservation);
    }

    /// <summary>
    /// Generează un raport cu rezervările filtrate.
    /// </summary>
    [HttpGet("report")]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<IActionResult> GenerateReport(
        [FromQuery] string? userName,
        [FromQuery] string? userEmail,
        [FromQuery] string? accommodationName,
        [FromQuery] string? city,
        [FromQuery] string? country,
        [FromQuery] DateTime? checkInDateFrom,
        [FromQuery] DateTime? checkInDateTo,
        [FromQuery] int? numberOfGuests,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? status,
        [FromQuery] string format = "csv",
        [FromQuery] List<string>? columns = null)
    {
        var request = new ReservationReportRequestDto
        {
            Columns = columns ?? new(),
            Format = format,
            Filters = new ReservationReportFilterDto
            {
                UserName = userName,
                UserEmail = userEmail,
                AccommodationName = accommodationName,
                City = city,
                Country = country,
                CheckInDateFrom = checkInDateFrom,
                CheckInDateTo = checkInDateTo,
                NumberOfGuests = numberOfGuests,
                MinPrice = minPrice,
                MaxPrice = maxPrice,
                Status = status
            }
        };

        try
        {
            var (fileContent, contentType, fileName) = await _reservationService.GenerateReportAsync(request);
            return File(fileContent, contentType, fileName);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("import")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportCsv(IFormFile file)
    {
        // FIX: 400 ramane doar pentru cereri invalide (fara fisier, extensie gresita) -
        // adica probleme cu request-ul in sine, nu cu continutul datelor din CSV.
        if (file == null || file.Length == 0)
            return BadRequest("Te rog să încarci un fișier CSV valid.");

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Fișierul trebuie să aibă extensia .csv.");

        using var stream = file.OpenReadStream();
        var result = await _reservationService.ImportReservationsFromCsvAsync(stream);

        // FIX: raspuns formatat exact ca in cerinta - "successful insert count",
        // "failed insert count", "failed inserts" cu cate o linie per intrare esuata,
        // continand toate problemele identificate pe acea linie.
        var formattedErrors = result.Errors
            .OrderBy(kvp => kvp.Key)
            .Select(kvp => $"linia {kvp.Key}: {string.Join(", ", kvp.Value)}")
            .ToList();

        var response = new Dictionary<string, object>
        {
            ["successful insert count"] = result.SuccessfulCount,
            ["failed insert count"] = result.FailedCount,
            ["failed inserts"] = formattedErrors
        };

        // FIX: intotdeauna 200 OK pentru un fisier procesat cu succes ca request,
        // indiferent daca unele linii de date au esuat validarea - un import partial
        // reusit nu e o eroare de request, e un rezultat de business normal.
        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(AuthenticationSchemes = "UserBearer,ServiceBearer")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? User.FindFirstValue("nameid");
        var roleString = User.FindFirstValue(ClaimTypes.Role) ?? "Client";

        // Dacă cererea vine de la un service client (ex: API B cu ServiceBearer)
        if (User.HasClaim(c => c.Type == "client_id"))
        {
            var success = await _reservationService.CancelReservationAsync(id);
            return success ? NoContent() : NotFound(new { message = $"Reservation with ID {id} was not found." });
        }

        if (!Guid.TryParse(userIdString, out var currentUserId))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        var currentUserRole = Enum.TryParse<UserRole>(roleString, true, out var parsedRole) ? parsedRole : UserRole.Client;

        try
        {
            var success = await _reservationService.DeleteReservationAsync(id, currentUserId, currentUserRole);
            if (!success)
            {
                return NotFound(new { message = $"Reservation with ID {id} was not found." });
            }
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }
}
