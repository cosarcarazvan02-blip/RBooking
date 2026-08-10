using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDiscountTypeColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiscountType",
                table: "Discounts");

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Discounts",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "Discounts");

            migrationBuilder.AddColumn<string>(
                name: "DiscountType",
                table: "Discounts",
                type: "text",
                nullable: true);
        }
    }
}
