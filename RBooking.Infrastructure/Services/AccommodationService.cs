using Microsoft.EntityFrameworkCore;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Infrastructure.Data;

namespace RBooking.Infrastructure.Services;

/// <summary>
/// Implementarea concretă a serviciului de filtrare și paginare pentru cazări.
/// </summary>
public class AccommodationService : IAccommodationService
{
    private readonly AppDbContext _context;

    public AccommodationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<AccommodationDto> Items, int TotalCount)> GetPagedFilteredAsync(AccommodationFilterDto filter)
    {
        // 1. Pornim interogarea ca IQueryable. 
        // Aceasta NU execută SQL-ul imediat în baza de date, ci permite construirea dinamică a clauzelor WHERE.
        var query = _context.Accommodations.AsQueryable();

        // 2. Filtru după prețul minim pe noapte
        if (filter.MinPrice.HasValue)
        {
            query = query.Where(a => a.PricePerNight >= filter.MinPrice.Value);
        }

        // 3. Filtru după prețul maxim pe noapte
        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(a => a.PricePerNight <= filter.MaxPrice.Value);
        }

        // 6. Calculăm numărul total de înregistrări care se potrivesc cu filtrele 
        // (esențial pentru ca frontend-ul să știe câte pagini de rezultate există).
        var totalCount = await query.CountAsync();

        // 7. Aplicăm paginarea (Skip pentru omiterea paginilor anterioare, Take pentru limita de pe pagina curentă)
        // și mapăm rezultatele direct în DTO-ul de afișare.
        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => new AccommodationDto
            {
                Id = a.Id,
                Name = a.Name,
                Description = a.Description,
                PricePerNight = a.PricePerNight
            })
            .ToListAsync();

        // Returnăm tupla conținând lista paginată și numărul total
        return (items, totalCount);
    }
}