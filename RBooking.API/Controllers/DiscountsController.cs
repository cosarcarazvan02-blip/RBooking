using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using Rbooking.Domain.Enum;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiscountsController : ControllerBase
{
    private readonly IDiscountService _discountService;

    public DiscountsController(IDiscountService discountService)
    {
        _discountService = discountService;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] DiscountType? type = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] decimal? compareValue = null,
        [FromQuery] string? compareOperator = null)
    {
        if (pageNumber <= 0) pageNumber = 1;
        if (pageSize <= 0) pageSize = 10;

        var (items, totalCount) = await _discountService.GetPagedFilteredAsync(
            pageNumber, pageSize, searchTerm, type, startDate, endDate, compareValue, compareOperator);

        return Ok(new
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            Data = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DiscountDto>> GetById(int id)
    {
        var discount = await _discountService.GetByIdAsync(id);
        if (discount == null)
        {
            return NotFound(new { message = $"Discountul cu ID-ul {id} nu a fost găsit." });
        }
        return Ok(discount);
    }

    [HttpPost("absolute")]
    public async Task<ActionResult<DiscountDto>> CreateAbsoluteValueDiscount([FromBody] CreateAbsoluteValueDiscountDto dto)
    {
        var createdDiscount = await _discountService.CreateAbsoluteValueDiscountAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = createdDiscount.Id }, createdDiscount);
    }

    [HttpPost("percentage")]
    public async Task<ActionResult<DiscountDto>> CreatePercentageDiscount([FromBody] CreatePercentageDiscountDto dto)
    {
        var createdDiscount = await _discountService.CreatePercentageDiscountAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = createdDiscount.Id }, createdDiscount);
    }

    [HttpPost("loyalty")]
    public async Task<ActionResult<DiscountDto>> CreateLoyaltyDiscount([FromBody] CreateLoyaltyDiscountDto dto)
    {
        var createdDiscount = await _discountService.CreateLoyaltyDiscountAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = createdDiscount.Id }, createdDiscount);
    }

    [HttpPut]
    public async Task<ActionResult> Update([FromBody] UpdateDiscountDto dto)
    {
        var result = await _discountService.UpdateAsync(dto);
        if (!result)
        {
            return NotFound(new { message = $"Discountul cu ID-ul {dto.Id} nu a fost găsit pentru actualizare." });
        }
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _discountService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(new { message = $"Discountul cu ID-ul {id} nu a fost găsit pentru ștergere." });
        }
        return NoContent();
    }
}