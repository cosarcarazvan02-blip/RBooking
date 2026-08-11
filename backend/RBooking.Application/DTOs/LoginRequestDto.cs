using System.ComponentModel.DataAnnotations;

namespace RBooking.Application.DTOs;

public class LoginRequestDto
{
    [Required(ErrorMessage = "Adresa de email este obligatorie.")]
    [EmailAddress(ErrorMessage = "Formatul adresei de email este invalid.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Parola este obligatorie.")]
    [MinLength(6, ErrorMessage = "Parola trebuie să conțină cel puțin 6 caractere.")]
    public string Password { get; set; } = string.Empty;
}
