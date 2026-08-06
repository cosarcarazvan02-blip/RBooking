using Microsoft.EntityFrameworkCore;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Infrastructure.Data;

namespace RBooking.Infrastructure.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly AppDbContext _context;

    public ReservationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Reservation>> GetAllAsync()
    {
        return await _context.Reservations
            .Include(r => r.User)
            .Include(r => r.Accommodation)
            .ToListAsync();
    }

    public async Task<(IEnumerable<Reservation> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize)
    {
        var totalCount = await _context.Reservations.CountAsync();
        var items = await _context.Reservations
            .Include(r => r.User)
            .Include(r => r.Accommodation)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Reservation?> GetByIdAsync(Guid id)
    {
        return await _context.Reservations
            .Include(r => r.User)
            .Include(r => r.Accommodation)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Reservation>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Reservations
            .Include(r => r.User)
            .Include(r => r.Accommodation)
            .Where(r => r.UserId == userId)
            .ToListAsync();
    }

    public async Task<(IEnumerable<Reservation> Items, int TotalCount)> GetPagedByUserIdAsync(Guid userId, int pageNumber, int pageSize)
    {
        var query = _context.Reservations
            .Include(r => r.User)
            .Include(r => r.Accommodation)
            .Where(r => r.UserId == userId);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<IEnumerable<Reservation>> GetByAccommodationIdAsync(Guid accommodationId)
    {
        return await _context.Reservations
            .Include(r => r.User)
            .Include(r => r.Accommodation)
            .Where(r => r.AccommodationId == accommodationId)
            .ToListAsync();
    }

    public async Task<Reservation> AddAsync(Reservation reservation)
    {
        await _context.Reservations.AddAsync(reservation);
        await _context.SaveChangesAsync();
        return reservation;
    }

    public async Task<Reservation?> UpdateAsync(Reservation reservation)
    {
        _context.Reservations.Update(reservation);
        await _context.SaveChangesAsync();
        return reservation;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var item = await _context.Reservations.FindAsync(id);
        if (item == null) return false;

        _context.Reservations.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }
}
