using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    // GET: api/User?role=Doctor&onlyUnassignedDoctors=true
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? role, [FromQuery] bool onlyUnassignedDoctors = false)
    {
        var users = await _userService.GetAllAsync(role, onlyUnassignedDoctors);
        return Ok(users);
    }
}
