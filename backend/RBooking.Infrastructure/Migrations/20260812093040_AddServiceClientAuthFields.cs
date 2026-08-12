using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceClientAuthFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "ServiceClients",
                newName: "ClientName");

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "ServiceClients",
                type: "text",
                nullable: false,
                defaultValue: "Service");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ServiceClients",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Role",
                table: "ServiceClients");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ServiceClients");

            migrationBuilder.RenameColumn(
                name: "ClientName",
                table: "ServiceClients",
                newName: "Name");
        }
    }
}
