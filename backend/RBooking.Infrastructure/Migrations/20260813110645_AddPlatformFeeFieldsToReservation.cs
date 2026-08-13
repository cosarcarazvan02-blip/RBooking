using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlatformFeeFieldsToReservation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reviews_ReservationId",
                table: "Reviews");

            migrationBuilder.AddColumn<decimal>(
                name: "OperatorPayoutAmount",
                table: "Reservations",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformFeeAmount",
                table: "Reservations",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformFeeRate",
                table: "Reservations",
                type: "numeric(5,4)",
                precision: 5,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            // Completare retroactivă: rezervările create înainte de acest câmp primesc rata
            // implicită de 0.10 (10%), ca "instantaneu" - la fel cum ar fi fost calculate atunci.
            migrationBuilder.Sql(@"
                UPDATE ""Reservations""
                SET
                    ""PlatformFeeRate"" = 0.10,
                    ""PlatformFeeAmount"" = ROUND(""TotalPrice"" * 0.10, 2),
                    ""OperatorPayoutAmount"" = ""TotalPrice"" - ROUND(""TotalPrice"" * 0.10, 2)
                WHERE ""PlatformFeeRate"" = 0;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ReservationId",
                table: "Reviews",
                column: "ReservationId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reviews_ReservationId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "OperatorPayoutAmount",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "PlatformFeeAmount",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "PlatformFeeRate",
                table: "Reservations");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ReservationId",
                table: "Reviews",
                column: "ReservationId");
        }
    }
}
