using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RBooking.API.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Infrastructure.Data;

namespace RBooking.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccommodationImagesController : ControllerBase
    {
        private readonly IImageService _imageService;
        private readonly AppDbContext _context; 

        public AccommodationImagesController(IImageService imageService, AppDbContext context)
        {
            _imageService = imageService;
            _context = context;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage([FromForm] UploadAccommodationImageDto dto)
        {
            if (dto.File == null || dto.File.Length == 0)
                return BadRequest("No file uploaded.");

            // 1. Salvăm imaginea fizic / prin image service
            var imagePath = await _imageService.SaveImageAsync(dto.File.OpenReadStream(), dto.File.FileName, "accommodation-images");

            // 2. Salvăm în baza de date entitatea AccommodationImage
            var accommodationImage = new AccommodationImage
            {
                AccommodationId = dto.AccommodationId,
                FilePath = imagePath,
                IsMain = dto.IsMain
            };

            _context.AccommodationImages.Add(accommodationImage);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Image uploaded successfully", path = imagePath });
        }

        [HttpGet("accommodation/{accommodationId}")]
        public async Task<IActionResult> GetImages(Guid accommodationId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            if (pageNumber <= 0) pageNumber = 1;
            if (pageSize <= 0) pageSize = 10;

            var query = _context.AccommodationImages.Where(img => img.AccommodationId == accommodationId);
            
            var totalCount = await query.CountAsync();
            
            var images = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Data = images
            });
        }
    }
}

