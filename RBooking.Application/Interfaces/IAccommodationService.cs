using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

/// <summary>
/// Interfața serviciului pentru gestionarea și filtrarea cazărilor.
/// Respectă principiul Dependency Inversion din SOLID.
/// </summary>
public interface IAccommodationService
{
    /// <summary>
    /// Returnează o listă paginată de cazări filtrate și numărul total de elemente (util pentru paginarea pe frontend).
    /// </summary>
    /// <param name="filter">Obiectul care conține filtrele și parametrii de paginare</param>
    Task<(IEnumerable<AccommodationDto> Items, int TotalCount)> GetPagedFilteredAsync(AccommodationFilterDto filter);
}