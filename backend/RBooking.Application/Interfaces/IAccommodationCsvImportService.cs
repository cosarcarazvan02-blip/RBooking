using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IAccommodationCsvImportService
{
    Task<AccommodationCsvImportResultDto> ImportCsvAsync(Stream csvStream, Guid? defaultOperatorId = null);
}
