using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using NasaWebApp.DTOs;
using NasaWebApp.Models;
using NasaWebApp.Services;

namespace NasaWebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<GameUser> _userManager;
        private readonly SignInManager<GameUser> _signInManager;
        private readonly IJwtService _jwtService;

        public AuthController(UserManager<GameUser> userManager,
            SignInManager<GameUser> signInManager,
            IJwtService jwtService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
        {
            try
            {
                var user = new GameUser
                {
                    UserName  = registerDto.UserName,
                    Email = registerDto.Email,
                    PlayerName = registerDto.PlayerName,
                    Level = 1,
                    Score = 0
                };

                var result = await _userManager.CreateAsync(user, registerDto.Password);

                if (result.Succeeded)
                {
                    var token = _jwtService.GenerateToken(user);
                    return Ok(new AuthResponseDto
                    {
                        Token = token,
                        PlayerName = user.PlayerName,
                        Level = user.Level,
                        Score = user.Score,
                        Success = true,
                        Message = "Your account has been created successfully."
                    });
                }

                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Account creation failed: " + string.Join(", ", result.Errors.Select(e => e.Description))
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new AuthResponseDto
                {
                    Success = false,
                    Message = "A server error occurred."
                });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(loginDto.Email);
                if (user == null)
                {
                    return Unauthorized(new AuthResponseDto
                    {
                        Success = false,
                        Message = "The email address or password is incorrect."
                    });
                }

                var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
                if (result.Succeeded)
                {
                    var token = _jwtService.GenerateToken(user);
                    return Ok(new AuthResponseDto
                    {
                        Token = token,
                        PlayerName = user.PlayerName,
                        Level = user.Level,
                        Score = user.Score,
                        Success = true,
                        Message = "Login successful. ✅"
                    });
                }

                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new AuthResponseDto
                {
                    Success = false,
                    Message = "An error occurred on the server. Please try again later"
                });
            }
        }
    }
}
