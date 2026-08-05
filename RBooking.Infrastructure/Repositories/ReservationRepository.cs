using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;
using RBooking.Infrastructure.Data;

namespace RBooking.Infrastructure.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly AppDbContext? _dbContext;
    private static readonly ConcurrentBag<Reservation> _inMemoryReservations = new()
    {
        new Reservation
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            AccommodationId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            CheckInDate = DateTime.UtcNow.AddDays(5),
            CheckOutDate = DateTime.UtcNow.AddDays(10),
            NumberOfGuests = 2,
            TotalPrice = 500.00m,
            Status = ReservationStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        }
    };

    public ReservationRepository(AppDbContext? dbContext = null)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<Reservation>> GetAllAsync()
    {
        if (_dbContext != null)
        {
            try
            {
                return await _dbContext.Reservations
                    .Include(r => r.User)
                    .Include(r => r.Accommodation)
                    .ToListAsync();
            }
            catch
            {
                // Fallback to in-memory repository if database is disconnected
            }
        }
        return _inMemoryReservations.ToList();
    }

    public async Task<(IEnumerable<Reservation> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize)
    {
        if (_dbContext != null)
        {
            try
            {
                var totalCount = await _dbContext.Reservations.CountAsync();
                var items = await _dbContext.Reservations
                    .Include(r => r.User)
                    .Include(r => r.Accommodation)
                    .OrderByDescending(r => r.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return (items, totalCount);
            }
            catch
            {
                // Fallback
            }
        }

        var memTotal = _inMemoryReservations.Count;
        var memItems = _inMemoryReservations
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return (memItems, memTotal);
    }

    public async Task<Reservation?> GetByIdAsync(Guid id)
    {
        if (_dbContext != null)
        {
            try
            {
                return await _dbContext.Reservations
                    .Include(r => r.User)
                    .Include(r => r.Accommodation)
                    .FirstOrDefaultAsync(r => r.Id == id);
            }
            catch
            {
                // Fallback
            }
        }
        return _inMemoryReservations.FirstOrDefault(r => r.Id == id);
    }

    public async Task<IEnumerable<Reservation>> GetByUserIdAsync(Guid userId)
    {
        if (_dbContext != null)
        {
            try
            {
                return await _dbContext.Reservations
                    .Include(r => r.User)
                    .Include(r => r.Accommodation)
                    .Where(r => r.UserId == userId)
                    .ToListAsync();
            }
            catch
            {
                // Fallback
            }
        }
        return _inMemoryReservations.Where(r => r.UserId == userId).ToList();
    }

    public async Task<(IEnumerable<Reservation> Items, int TotalCount)> GetPagedByUserIdAsync(Guid userId, int pageNumber, int pageSize)
    {
        if (_dbContext != null)
        {
            try
            {
                var query = _dbContext.Reservations
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
            catch
            {
                // Fallback
            }
        }

        var userFiltered = _inMemoryReservations.Where(r => r.UserId == userId).ToList();
        var memTotal = userFiltered.Count;
        var memItems = userFiltered
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return (memItems, memTotal);
    }

    public async Task<IEnumerable<Reservation>> GetByAccommodationIdAsync(Guid accommodationId)
    {
        if (_dbContext != null)
        {
            try
            {
                return await _dbContext.Reservations
                    .Include(r => r.User)
                    .Include(r => r.Accommodation)
                    .Where(r => r.AccommodationId == accommodationId)
                    .ToListAsync();
            }
            catch
            {
                // Fallback
            }
        }
        return _inMemoryReservations.Where(r => r.AccommodationId == accommodationId).ToList();
    }

    public async Task<Reservation> AddAsync(Reservation reservation)
    {
        if (_dbContext != null)
        {
            try
            {
                await _dbContext.Reservations.AddAsync(reservation);
                await _dbContext.SaveChangesAsync();
                return reservation;
            }
            catch
            {
                // Fallback
            }
        }
        _inMemoryReservations.Add(reservation);
        return reservation;
    }

    public async Task<Reservation?> UpdateAsync(Reservation reservation)
    {
        if (_dbContext != null)
        {
            try
            {
                _dbContext.Reservations.Update(reservation);
                await _dbContext.SaveChangesAsync();
                return reservation;
            }
            catch
            {
                // Fallback
            }
        }
        var existing = _inMemoryReservations.FirstOrDefault(r => r.Id == reservation.Id);
        if (existing != null)
        {
            existing.Status = reservation.Status;
            existing.CheckInDate = reservation.CheckInDate;
            existing.CheckOutDate = reservation.CheckOutDate;
            existing.NumberOfGuests = reservation.NumberOfGuests;
            existing.TotalPrice = reservation.TotalPrice;
        }
        return reservation;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        if (_dbContext != null)
        {
            try
            {
                var item = await _dbContext.Reservations.FindAsync(id);
                if (item != null)
                {
                    _dbContext.Reservations.Remove(item);
                    await _dbContext.SaveChangesAsync();
                    return true;
                }
            }
            catch
            {
                // Fallback
            }
        }
        var existing = _inMemoryReservations.FirstOrDefault(r => r.Id == id);
        if (existing != null)
        {
            existing.Status = ReservationStatus.Cancelled;
            return true;
        }
        return false;
    }
}
