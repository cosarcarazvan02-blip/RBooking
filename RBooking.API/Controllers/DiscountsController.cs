using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

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
    public async Task<ActionResult<IEnumerable<DiscountDto>>> GetAll()
    {
        var discounts = await _discountService.GetAllAsync();
        return Ok(discounts);
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