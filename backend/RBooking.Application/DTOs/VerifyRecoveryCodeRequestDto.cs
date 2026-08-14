using System.ComponentModel.DataAnnotations;

namespace RBooking.Application.DTOs;

public class VerifyRecoveryCodeRequestDto
{
    [Required(ErrorMessage = "Adresa de email este obligatorie.")]
    [EmailAddress(ErrorMessage = "Formatul adresei de email este invalid.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Codul de recuperare este obligatoriu.")]
    [MinLength(6, ErrorMessage = "Codul de recuperare trebuie să aibă cel puțin 6 caractere.")]
    public string Code { get; set; } = string.Empty;
}
