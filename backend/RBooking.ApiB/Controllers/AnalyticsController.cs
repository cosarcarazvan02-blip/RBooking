using Microsoft.AspNetCore.Mvc;
using RBooking.ApiB.DTOs;
using RBooking.ApiB.Services;

namespace RBooking.ApiB.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IReviewAnalyticsService _analyticsService;

    public AnalyticsController(IReviewAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    /// <summary>
    /// Gets latest calculated analytics for a specific accommodation.
    /// </summary>
    [HttpGet("accommodation/{accommodationId:guid}")]
    public ActionResult<AccommodationAnalyticsResultDto> GetByAccommodationId(Guid accommodationId)
    {
        var result = _analyticsService.GetLatestAnalytics(accommodationId);
        if (result == null)
        {
            return NotFound(new { message = $"Nu există statistici calculate încă pentru cazarea cu ID {accommodationId}." });
        }
        return Ok(result);
    }

    /// <summary>
    /// Gets all history of analytics runs performed by API B.
    /// </summary>
    [HttpGet("history")]
    public ActionResult<IEnumerable<AccommodationAnalyticsResultDto>> GetHistory()
    {
        var history = _analyticsService.GetAllAnalyticsHistory();
        return Ok(history);
    }

    /// <summary>
    /// Manually triggers analytics calculation for a given reservation ID (for testing & verification).
    /// </summary>
    [HttpPost("trigger-manual")]
    public async Task<ActionResult<AccommodationAnalyticsResultDto>> TriggerManual([FromQuery] Guid reservationId)
    {
        try
        {
            var result = await _analyticsService.ProcessReviewCreatedWebhookAsync(reservationId, null);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
