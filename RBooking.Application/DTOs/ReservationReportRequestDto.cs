namespace RBooking.Application.DTOs;

public class ReservationReportRequestDto
{
    // Lista de coloane dorite (ex: ["Id", "UserName", "CheckInDate", "TotalPrice"])
    public List<string> Columns { get; set; } = new();

    // Filtrele pentru coloanele care nu sunt ID
    public ReservationReportFilterDto Filters { get; set; } = new();

    // Formatul dorit: "csv", "xlsx" sau "pdf"
    public string Format { get; set; } = "csv";
}

public class ReservationReportFilterDto
{
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? AccommodationName { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public DateTime? CheckInDateFrom { get; set; }
    public DateTime? CheckInDateTo { get; set; }
    public int? NumberOfGuests { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Status { get; set; }
}