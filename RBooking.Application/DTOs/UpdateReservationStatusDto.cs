using RBooking.Domain.Entities;

namespace RBooking.Application.DTOs;

public class UpdateReservationStatusDto
{
    public ReservationStatus Status { get; set; }
}
