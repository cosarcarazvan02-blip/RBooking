namespace RBooking.Application.DTOs;

public class CreateServiceClientDto
{
    public string Name { get; set; } = string.Empty;
}

public class ServiceClientCreatedDto
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
