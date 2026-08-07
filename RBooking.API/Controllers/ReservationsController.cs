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
    public async Task<ActionResult<ReservationDto>> GetById(Guid id)
    {
        var reservation = await _reservationService.GetReservationByIdAsync(id);
        if (reservation == null)
        {
            return NotFound(new { message = $"Reservation with ID {id} was not found." });
        }
        return Ok(reservation);
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<PagedResultDto<ReservationDto>>> GetByUserId(Guid userId, [FromQuery] PaginationParamsDto paginationParams)
    {
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
        catch (ArgumentException ex)
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

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Client,Operator,Admin")]
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
            var success = await _reservationService.DeleteReservationAsync(id, currentUserId, currentUserRole);
            if (!success)
            {
                return NotFound(new { message = $"Reservation with ID {id} was not found." });
            }
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}
