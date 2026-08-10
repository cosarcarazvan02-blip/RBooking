using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

namespace RBooking.Application.DTOs;

public class UpdateReservationStatusDto
{
    public ReservationStatus Status { get; set; }
}
