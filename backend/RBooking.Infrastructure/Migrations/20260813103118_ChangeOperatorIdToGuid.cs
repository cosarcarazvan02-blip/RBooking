using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeOperatorIdToGuid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // In PostgreSQL, stergem mai intai NOT NULL si DEFAULT, apoi convertim coloana
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'Accommodations' AND column_name = 'OperatorId'
                    ) THEN
                        ALTER TABLE ""Accommodations"" ALTER COLUMN ""OperatorId"" DROP NOT NULL;
                        ALTER TABLE ""Accommodations"" ALTER COLUMN ""OperatorId"" DROP DEFAULT;
                        
                        ALTER TABLE ""Accommodations"" 
                        ALTER COLUMN ""OperatorId"" TYPE uuid 
                        USING (
                            CASE 
                                WHEN ""OperatorId"" IS NOT NULL AND ""OperatorId"" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                                THEN ""OperatorId""::uuid 
                                ELSE NULL 
                            END
                        );
                    END IF;
                END $$;
            ");

            migrationBuilder.AlterColumn<Guid>(
                name: "OperatorId",
                table: "Accommodations",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "OperatorId",
                table: "Accommodations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
