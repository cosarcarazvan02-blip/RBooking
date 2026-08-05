using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IDiscountRepository
{
    Task<IEnumerable<Discount>> GetAllAsync();
    Task<Discount?> GetByIdAsync(int id);
    Task AddAsync(Discount discount);
    Task UpdateAsync(Discount discount);
    Task DeleteAsync(int id);
}