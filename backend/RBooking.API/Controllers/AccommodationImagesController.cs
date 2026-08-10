using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RBooking.API.DTOs;
using RBooking.Application.DTOs;
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

        /// <summary>
        /// Încarcă o imagine (prin fișier binar SAU prin link direct/URL).
        /// </summary>
        [HttpPost("upload")]
        [AllowAnonymous]
        public async Task<IActionResult> UploadImage([FromForm] UploadAccommodationImageDto dto)
        {
            var accommodationExists = await _context.Accommodations.AnyAsync(a => a.Id == dto.AccommodationId);
            if (!accommodationExists)
            {
                return NotFound(new { message = $"Cazarea cu ID-ul {dto.AccommodationId} nu a fost găsită." });
            }

            string imagePath;

            if (dto.File != null && dto.File.Length > 0)
            {
                // 1. Salvăm fișierul fizic prin image service
                imagePath = await _imageService.SaveImageAsync(dto.File.OpenReadStream(), dto.File.FileName, "accommodation-images");
            }
            else if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
            {
                // 2. Folosim link-ul direct specificat
                imagePath = dto.ImageUrl.Trim();
            }
            else
            {
                return BadRequest(new { message = "Trebuie să încărcați un fișier imagine SAU să furnizați un link (ImageUrl)." });
            }

            // Dacă este marcată ca imagine principală (IsMain), demarcăm celelalte imagini principale existente
            if (dto.IsMain)
            {
                var existingMains = await _context.AccommodationImages
                    .Where(img => img.AccommodationId == dto.AccommodationId && img.IsMain)
                    .ToListAsync();
                foreach (var img in existingMains)
                {
                    img.IsMain = false;
                }
            }

            var accommodationImage = new AccommodationImage
            {
                AccommodationId = dto.AccommodationId,
                FilePath = imagePath,
                IsMain = dto.IsMain
            };

            _context.AccommodationImages.Add(accommodationImage);
            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                message = "Imaginea a fost adăugată cu succes", 
                id = accommodationImage.Id,
                path = imagePath,
                isMain = accommodationImage.IsMain
            });
        }

        /// <summary>
        /// Adaugă o imagine direct printr-un link URL (JSON) din Swagger fără a fi nevoie de upload de fișier.
        /// </summary>
        [HttpPost("add-by-url")]
        [AllowAnonymous]
        public async Task<IActionResult> AddImageByUrl([FromBody] AddAccommodationImageUrlDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ImageUrl))
            {
                return BadRequest(new { message = "Link-ul imaginii (ImageUrl) este obligatoriu." });
            }

            var accommodationExists = await _context.Accommodations.AnyAsync(a => a.Id == dto.AccommodationId);
            if (!accommodationExists)
            {
                return NotFound(new { message = $"Cazarea cu ID-ul {dto.AccommodationId} nu a fost găsită." });
            }

            if (dto.IsMain)
            {
                var existingMains = await _context.AccommodationImages
                    .Where(img => img.AccommodationId == dto.AccommodationId && img.IsMain)
                    .ToListAsync();
                foreach (var img in existingMains)
                {
                    img.IsMain = false;
                }
            }

            var accommodationImage = new AccommodationImage
            {
                AccommodationId = dto.AccommodationId,
                FilePath = dto.ImageUrl.Trim(),
                IsMain = dto.IsMain
            };

            _context.AccommodationImages.Add(accommodationImage);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Link-ul imaginii a fost asociat cu succes cazării.",
                id = accommodationImage.Id,
                path = accommodationImage.FilePath,
                isMain = accommodationImage.IsMain
            });
        }

        /// <summary>
        /// Returnează lista imaginilor asociate unei cazări.
        /// </summary>
        [HttpGet("accommodation/{accommodationId}")]
        [AllowAnonymous]
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
