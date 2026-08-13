namespace RBooking.Application.Services;

public static class PlatformFeeCalculator
{
    public const decimal DefaultCommissionRate = 0.10m;

    public static (decimal FeeAmount, decimal PayoutAmount) Calculate(decimal totalPrice, decimal commissionRate)
    {
        var feeAmount = Math.Round(totalPrice * commissionRate, 2, MidpointRounding.AwayFromZero);
        var payoutAmount = totalPrice - feeAmount;
        return (feeAmount, payoutAmount);
    }
}
