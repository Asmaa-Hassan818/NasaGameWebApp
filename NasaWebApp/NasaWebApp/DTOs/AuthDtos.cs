namespace NasaWebApp.DTOs
{
    public class RegisterDto
    {
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string PlayerName { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string PlayerName { get; set; } = string.Empty;
        public int Level { get; set; }
        public int Score { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
