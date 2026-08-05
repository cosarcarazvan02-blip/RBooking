using Microsoft.EntityFrameworkCore;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Infrastructure.Data; 

namespace RBooking.Infrastructure.Repositories;

public class DiscountRepository : IDiscountRepository
{
    private readonly AppDbContext _context;

    public DiscountRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Discount>> GetAllAsync()
    {
        return await _context.Discounts.ToListAsync();
    }

    public async Task<Discount?> GetByIdAsync(int id)
    {
        return await _context.Discounts.FindAsync(id);
    }

    public async Task AddAsync(Discount discount)
    {
        await _context.Discounts.AddAsync(discount);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Discount discount)
    {
        _context.Discounts.Update(discount);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var discount = await GetByIdAsync(id);
        if (discount != null)
        {
            _context.Discounts.Remove(discount);
            await _context.SaveChangesAsync();
        }
    }
}