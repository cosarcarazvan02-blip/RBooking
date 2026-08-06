using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet("accommodation/{accommodationId:guid}")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetByAccommodationId(Guid accommodationId)
    {
        var reviews = await _reviewService.GetReviewsByAccommodationIdAsync(accommodationId);
        return Ok(reviews);
    }

    [HttpPost]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<ReviewDto>> Create([FromBody] CreateReviewDto createReviewDto)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var currentUserId))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        try
        {
            var createdReview = await _reviewService.CreateReviewAsync(currentUserId, createReviewDto);
            return Ok(createdReview);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Client,Operator,Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roleString = User.FindFirstValue(ClaimTypes.Role);

        if (!Guid.TryParse(userIdString, out var currentUserId))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        try
        {
            var success = await _reviewService.DeleteReviewAsync(id, currentUserId, roleString ?? string.Empty);
            if (!success)
            {
                return NotFound(new { message = $"Review with ID {id} was not found." });
            }
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}