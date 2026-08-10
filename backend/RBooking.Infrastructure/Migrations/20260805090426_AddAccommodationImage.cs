using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAccommodationImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "Accommodations");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Accommodations");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Accommodations");

            migrationBuilder.RenameColumn(
                name: "BasePricePerNight",
                table: "Accommodations",
                newName: "PricePerNight");

            migrationBuilder.CreateTable(
                name: "AccommodationImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    IsMain = table.Column<bool>(type: "boolean", nullable: false),
                    AccommodationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccommodationImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccommodationImages_Accommodations_AccommodationId",
                        column: x => x.AccommodationId,
                        principalTable: "Accommodations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccommodationImages_AccommodationId",
                table: "AccommodationImages",
                column: "AccommodationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccommodationImages");

            migrationBuilder.RenameColumn(
                name: "PricePerNight",
                table: "Accommodations",
                newName: "BasePricePerNight");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Accommodations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Accommodations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Accommodations",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
