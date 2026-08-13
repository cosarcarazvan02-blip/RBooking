using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using System.Security.Claims;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlistService;

    public WishlistController(IWishlistService wishlistService)
    {
        _wishlistService = wishlistService;
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? User.FindFirstValue("id");
        return Guid.TryParse(userIdString, out userId);
    }

    /// <summary>
    /// Gets all wishlist items for the authenticated user.
    /// </summary>
    [HttpGet]
    [Authorize(AuthenticationSchemes = "UserBearer,ServiceBearer")]
    public async Task<ActionResult<IEnumerable<WishlistItemDto>>> GetMyWishlist()
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        var items = await _wishlistService.GetUserWishlistAsync(currentUserId);
        return Ok(items);
    }

    /// <summary>
    /// Gets all wishlist items for a specific user ID.
    /// </summary>
    [HttpGet("user/{userId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<WishlistItemDto>>> GetByUserId(Guid userId)
    {
        var items = await _wishlistService.GetUserWishlistAsync(userId);
        return Ok(items);
    }

    /// <summary>
    /// Checks if a specific accommodation is in the authenticated user's wishlist.
    /// </summary>
    [HttpGet("check/{accommodationId:guid}")]
    [Authorize(AuthenticationSchemes = "UserBearer,ServiceBearer")]
    public async Task<ActionResult<object>> CheckWishlist(Guid accommodationId)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        var isFavorite = await _wishlistService.IsInWishlistAsync(currentUserId, accommodationId);
        return Ok(new { isFavorite });
    }

    /// <summary>
    /// Adds an accommodation to the authenticated user's wishlist.
    /// </summary>
    [HttpPost]
    [Authorize(AuthenticationSchemes = "UserBearer,ServiceBearer")]
    public async Task<ActionResult<WishlistItemDto>> AddToWishlist([FromBody] AddToWishlistDto dto)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        try
        {
            var item = await _wishlistService.AddToWishlistAsync(currentUserId, dto.AccommodationId);
            return Ok(item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Removes an accommodation from the authenticated user's wishlist.
    /// </summary>
    [HttpDelete("{accommodationId:guid}")]
    [Authorize(AuthenticationSchemes = "UserBearer,ServiceBearer")]
    public async Task<IActionResult> RemoveFromWishlist(Guid accommodationId)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized(new { message = "Invalid user token credentials." });
        }

        var success = await _wishlistService.RemoveFromWishlistAsync(currentUserId, accommodationId);
        return success ? NoContent() : NotFound(new { message = "Item not found in wishlist." });
    }
}
