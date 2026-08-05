namespace RBooking.Application.DTOs;

public class AccommodationFilterDto
{
    // Parametrii pentru paginare (valori implicite: pagina 1, 10 elemente pe pagină)
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    // Criterii de filtrare opționale
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
}