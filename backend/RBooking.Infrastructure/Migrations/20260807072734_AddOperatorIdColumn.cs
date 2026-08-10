using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOperatorIdColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OperatorId",
                table: "Accommodations",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OperatorId",
                table: "Accommodations");
        }
    }
}
