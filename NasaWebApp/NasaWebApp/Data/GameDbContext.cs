using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using NasaWebApp.Models;

namespace NasaWebApp.Data
{
    public class GameDbContext : IdentityDbContext<GameUser>
    {
        public GameDbContext(DbContextOptions<GameDbContext> options) : base(options)
        {           
        }
        public DbSet<GameUser> GameUsers { get; set; }
    }
}
