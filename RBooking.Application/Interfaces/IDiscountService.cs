using RBooking.Application.DTOs;
using RBooking.Domain.Enums;

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
    Task<(IEnumerable<DiscountDto> Items, int TotalCount)> GetPagedFilteredAsync(int pageNumber, int pageSize, string? searchTerm, DiscountType? type, DateTime? startDate, DateTime? endDate, decimal? compareValue, string? compareOperator);
}