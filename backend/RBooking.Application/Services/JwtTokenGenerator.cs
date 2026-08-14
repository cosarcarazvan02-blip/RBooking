using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RBooking.Application.Constants;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var secretKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT Secret Key is not configured.");
        // FIX: fara fallback - trebuie sa fie configurate explicit, la fel ca in Program.cs.
        var issuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer is not configured.");
        var audience = _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("JWT Audience is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // FIX: pastrate doar claim-urile standard JWT, fara duplicate (ClaimTypes.* + JwtRegisteredClaimNames.*
        // pentru aceleasi valori). Daca alta parte din cod citeste specific ClaimTypes.NameIdentifier sau
        // ClaimTypes.Email, adaugati-le inapoi - dar altfel tokenul e inutil de mare.
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.GivenName, user.FirstName),
            new Claim(ClaimTypes.Surname, user.LastName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GeneratePendingTwoFactorToken(User user)
    {
        var secretKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT Secret Key is not configured.");
        var issuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Audience distincta ("RBookingClient.TwoFactorPending") - token-ul asta nu valideaza
        // pe schema normala "UserBearer" (care cere audience "RBookingClient"), deci nu poate
        // fi folosit pe niciun endpoint protejat normal cat timp codul TOTP nu a fost confirmat.
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: TwoFactorAuthConstants.PendingAudience,
            claims: claims,
            expires: DateTime.UtcNow.Add(TwoFactorAuthConstants.PendingTokenLifetime),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateServiceToken(ServiceClient client)
    {
        var secretKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT Secret Key is not configured.");
        var issuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer is not configured.");
        var audience = _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("JWT Audience is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, client.ClientId),
            new Claim("client_id", client.ClientId),
            new Claim(ClaimTypes.Name, client.ClientName),
            new Claim(ClaimTypes.Role, string.IsNullOrEmpty(client.Role) ? ServiceAuthConstants.ServiceRoleClaimValue : client.Role),
            new Claim("scheme", ServiceAuthConstants.SchemeName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}