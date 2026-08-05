using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IDiscountService
{
    Task<IEnumerable<DiscountDto>> GetAllAsync();
    Task<DiscountDto?> GetByIdAsync(int id);
    
    Task<DiscountDto> CreateAbsoluteValueDiscountAsync(CreateAbsoluteValueDiscountDto dto);
    Task<DiscountDto> CreatePercentageDiscountAsync(CreatePercentageDiscountDto dto);
    Task<DiscountDto> CreateLoyaltyDiscountAsync(CreateLoyaltyDiscountDto dto);
    
    Task<bool> UpdateAsync(UpdateDiscountDto dto);
    Task<bool> DeleteAsync(int id);
    Task<(IEnumerable<DiscountDto> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize);
}