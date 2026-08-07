using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IAccommodationReportService
{
    Task<(byte[] Content, string ContentType, string FileName)> GenerateReportAsync(AccommodationReportRequestDto request);
}
