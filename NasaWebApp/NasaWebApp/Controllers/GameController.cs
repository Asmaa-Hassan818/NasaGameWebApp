using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using NasaWebApp.Models;
using System.Security.Claims;

namespace NasaWebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GameController : ControllerBase
    {
        private readonly UserManager<GameUser> _userManager;

        public GameController(UserManager<GameUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("Invalid User");

            return Ok(new
            {
                PlayerName = user.PlayerName,
                Level = user.Level,
                Score = user.Score,
                Email = user.Email
            });
        }

        [HttpPost("update-score")]
        public async Task<IActionResult> UpdateScore([FromBody] int newScore)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("المستخدم غير موجود");

            user.Score = newScore;
            if (newScore > user.Level * 100) // مثال: كل 100 نقطة = مستوى جديد
            {
                user.Level++;
            }

            await _userManager.UpdateAsync(user);

            return Ok(new { message = "تم تحديث النقاط بنجاح", score = user.Score, level = user.Level });
        }
    }
}
