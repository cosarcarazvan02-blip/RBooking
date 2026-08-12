namespace RBooking.Application.DTOs;

public class ServiceClientDto
{
    public Guid Id { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string Role { get; set; } = "Service";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RegisterServiceClientDto
{
    public string ClientName { get; set; } = string.Empty;
}

public class ServiceClientTokenRequestDto
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}

public class ServiceClientTokenResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresIn { get; set; } = 3600;
    public string ClientId { get; set; } = string.Empty;
}
