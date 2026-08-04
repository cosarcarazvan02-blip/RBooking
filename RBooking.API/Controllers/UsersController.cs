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
}
