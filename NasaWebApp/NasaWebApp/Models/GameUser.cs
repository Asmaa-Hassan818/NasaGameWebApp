using Microsoft.AspNetCore.Identity;

namespace NasaWebApp.Models
{
    public class GameUser : IdentityUser
    {
        public string PlayerName { get; set; } = string.Empty;
        public int Level { get; set; } = 1;
        public int Score { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
