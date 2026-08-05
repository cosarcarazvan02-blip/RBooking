using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class DiscountService : IDiscountService
{
    private readonly IDiscountRepository _discountRepository;

    public DiscountService(IDiscountRepository discountRepository)
    {
        _discountRepository = discountRepository;
    }

    public async Task<IEnumerable<DiscountDto>> GetAllAsync()
    {
        var discounts = await _discountRepository.GetAllAsync();
        
        return discounts.Select(static d => new DiscountDto
        {
            Id = d.Id,
            Code = d.Code ?? string.Empty,
            StartingDate = d.StartingDate,
            ExpirationDate = d.ExpirationDate,
            IsActive = d.StartingDate <= DateTime.UtcNow && d.ExpirationDate >= DateTime.UtcNow
        });
    }

    public async Task<DiscountDto?> GetByIdAsync(int id)
    {
        var discount = await _discountRepository.GetByIdAsync(id);
        if (discount == null) return null;

        return new DiscountDto
        {
            Id = discount.Id,
            Code = discount.Code ?? string.Empty,
            StartingDate = discount.StartingDate,
            ExpirationDate = discount.ExpirationDate,
            IsActive = discount.StartingDate <= DateTime.UtcNow && discount.ExpirationDate >= DateTime.UtcNow
        };
    }

    public async Task<DiscountDto> CreateAbsoluteValueDiscountAsync(CreateAbsoluteValueDiscountDto dto)
    {
        var discount = new AbsoluteValueDiscount
        {
            Code = dto.Code,
            Amount = dto.Amount,
            StartingDate = dto.StartingDate,
            ExpirationDate = dto.ExpirationDate
        };

        await _discountRepository.AddAsync(discount);

        return new DiscountDto
        {
            Id = discount.Id,
            Code = discount.Code,
            StartingDate = discount.StartingDate,
            ExpirationDate = discount.ExpirationDate,
            IsActive = discount.StartingDate <= DateTime.UtcNow && discount.ExpirationDate >= DateTime.UtcNow
        };
    }

    public async Task<DiscountDto> CreatePercentageDiscountAsync(CreatePercentageDiscountDto dto)
    {
        var discount = new PercentageDiscount
        {
            Code = dto.Code,
            Percentage = dto.Percentage,
            StartingDate = dto.StartingDate,
            ExpirationDate = dto.ExpirationDate
        };

        await _discountRepository.AddAsync(discount);

        return new DiscountDto
        {
            Id = discount.Id,
            Code = discount.Code,
            StartingDate = discount.StartingDate,
            ExpirationDate = discount.ExpirationDate,
            IsActive = discount.StartingDate <= DateTime.UtcNow && discount.ExpirationDate >= DateTime.UtcNow
        };
    }

    public async Task<DiscountDto> CreateLoyaltyDiscountAsync(CreateLoyaltyDiscountDto dto)
    {
        var discount = new LoyaltyDiscount
        {
            Code = dto.Code,
            Percentage = dto.DiscountValue,
            StartingDate = dto.StartingDate,
            ExpirationDate = dto.ExpirationDate
        };

        await _discountRepository.AddAsync(discount);

        return new DiscountDto
        {
            Id = discount.Id,
            Code = discount.Code,
            StartingDate = discount.StartingDate,
            ExpirationDate = discount.ExpirationDate,
            IsActive = discount.StartingDate <= DateTime.UtcNow && discount.ExpirationDate >= DateTime.UtcNow   
        };
    }

    public async Task<bool> UpdateAsync(UpdateDiscountDto dto)
    {
        var existingDiscount = await _discountRepository.GetByIdAsync(dto.Id);
        if (existingDiscount == null) return false;

        if (dto.Code != null)
            existingDiscount.Code = dto.Code;
        if (dto.StartingDate.HasValue)
            existingDiscount.StartingDate = dto.StartingDate.Value;
        if (dto.ExpirationDate.HasValue)
            existingDiscount.ExpirationDate = dto.ExpirationDate.Value;

        await _discountRepository.UpdateAsync(existingDiscount);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existingDiscount = await _discountRepository.GetByIdAsync(id);
        if (existingDiscount == null) return false;

        await _discountRepository.DeleteAsync(id);
        return true;
    }

    public async Task<(IEnumerable<DiscountDto> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize)
    {
        var allDiscounts = await _discountRepository.GetAllAsync();
        var discountDtos = allDiscounts.Select(d => new DiscountDto
        {
            Id = d.Id,
            Code = d.Code ?? string.Empty,
            StartingDate = d.StartingDate,
            ExpirationDate = d.ExpirationDate,
            IsActive = d.StartingDate <= DateTime.UtcNow && d.ExpirationDate >= DateTime.UtcNow
        });

        var totalCount = discountDtos.Count();
        var items = discountDtos
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return (items, totalCount);
    }
}