using RBooking.Application.Services;
using Xunit;

namespace RBooking.Tests;

public class PlatformFeeCalculatorTests
{
    [Fact]
    public void Calculate_DefaultRate_ReturnsTenPercentFeeAndRemainder()
    {
        // Arrange
        decimal totalPrice = 360m;

        // Act
        var (feeAmount, payoutAmount) = PlatformFeeCalculator.Calculate(totalPrice, PlatformFeeCalculator.DefaultCommissionRate);

        // Assert
        Assert.Equal(36.00m, feeAmount);
        Assert.Equal(324.00m, payoutAmount);
    }

    [Theory]
    [InlineData(100, 0.10, 10.00, 90.00)]
    [InlineData(99.99, 0.10, 10.00, 89.99)] // 9.999 rotunjit AwayFromZero -> 10.00
    [InlineData(0.05, 0.10, 0.01, 0.04)] // 0.005 rotunjit AwayFromZero -> 0.01, nu 0.00
    [InlineData(10.25, 0.15, 1.54, 8.71)] // 1.5375 -> 1.54
    [InlineData(0, 0.10, 0.00, 0.00)]
    public void Calculate_RoundsAwayFromZeroToTwoDecimals(decimal totalPrice, decimal rate, decimal expectedFee, decimal expectedPayout)
    {
        // Act
        var (feeAmount, payoutAmount) = PlatformFeeCalculator.Calculate(totalPrice, rate);

        // Assert
        Assert.Equal(expectedFee, feeAmount);
        Assert.Equal(expectedPayout, payoutAmount);
    }

    [Fact]
    public void Calculate_FeePlusPayout_AlwaysEqualsTotalPrice()
    {
        // Arrange
        decimal totalPrice = 133.37m;
        decimal rate = 0.10m;

        // Act
        var (feeAmount, payoutAmount) = PlatformFeeCalculator.Calculate(totalPrice, rate);

        // Assert
        Assert.Equal(totalPrice, feeAmount + payoutAmount);
    }

    [Fact]
    public void Calculate_ZeroRate_NoFeeChargedAndFullPayout()
    {
        // Arrange
        decimal totalPrice = 500m;

        // Act
        var (feeAmount, payoutAmount) = PlatformFeeCalculator.Calculate(totalPrice, 0m);

        // Assert
        Assert.Equal(0m, feeAmount);
        Assert.Equal(500m, payoutAmount);
    }
}
