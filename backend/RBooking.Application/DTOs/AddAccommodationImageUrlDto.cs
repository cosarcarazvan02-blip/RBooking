using System.ComponentModel.DataAnnotations;

namespace RBooking.Application.DTOs;

/// <summary>
/// DTO pentru adăugarea unei imagini printr-un link/URL direct.
/// </summary>
public class AddAccommodationImageUrlDto
{
    [Required(ErrorMessage = "ID-ul cazării este obligatoriu.")]
    public Guid AccommodationId { get; set; }

    [Required(ErrorMessage = "Link-ul imaginii (ImageUrl) este obligatoriu.")]
    [Url(ErrorMessage = "Introduceți un URL valid de imagine.")]
    public string ImageUrl { get; set; } = string.Empty;

    public bool IsMain { get; set; } = false;
}
