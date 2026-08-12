namespace RBooking.ApiB.DTOs;

public class ApiATokenResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresIn { get; set; }
    public string ClientId { get; set; } = string.Empty;
}
