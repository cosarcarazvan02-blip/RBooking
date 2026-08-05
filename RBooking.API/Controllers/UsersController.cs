using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<UserDto>>> GetPaged([FromQuery] PaginationParamsDto paginationParams)
    {
        var result = await _userService.GetPagedUsersAsync(paginationParams);
        return Ok(result);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = $"User with ID {id} was not found." });
        }
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto createUserDto)
    {
        if (string.IsNullOrWhiteSpace(createUserDto.Email))
        {
            return BadRequest(new { message = "Email is required." });
        }

        var createdUser = await _userService.CreateUserAsync(createUserDto);
        return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, createdUser);
    }

    [HttpPost("{id:guid}/profile-image")]
    public async Task<ActionResult<UserDto>> UploadProfileImage(Guid id, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "An image file is required." });
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Invalid file type. Allowed formats: .jpg, .jpeg, .png, .gif, .webp" });
        }

        using var stream = file.OpenReadStream();
        var updatedUser = await _userService.UploadProfileImageAsync(id, stream, file.FileName);

        if (updatedUser == null)
        {
            return NotFound(new { message = $"User with ID {id} was not found." });
        }

        return Ok(updatedUser);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/profile-image")]
    public async Task<IActionResult> GetProfileImage(Guid id)
    {
        var result = await _userService.GetProfileImageAsync(id);
        if (result == null)
        {
            return NotFound(new { message = $"Profile image for user with ID {id} was not found." });
        }

        return File(result.Value.FileBytes, result.Value.ContentType);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _userService.DeleteUserAsync(id);
        if (!result)
        {
            return NotFound(new { message = $"User with ID {id} was not found." });
        }

        return NoContent();
    }
}
