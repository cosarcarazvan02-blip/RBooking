using System.Text;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class AccommodationCsvImportService : IAccommodationCsvImportService
{
    private readonly IAccommodationRepository _accommodationRepository;

    public AccommodationCsvImportService(IAccommodationRepository accommodationRepository)
    {
        _accommodationRepository = accommodationRepository;
    }

    public async Task<AccommodationCsvImportResultDto> ImportCsvAsync(Stream csvStream, string? defaultOperatorId = null)
    {
        using var reader = new StreamReader(csvStream, Encoding.UTF8);
        var lines = new List<string>();
        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (!string.IsNullOrWhiteSpace(line))
            {
                lines.Add(line);
            }
        }

        var result = new AccommodationCsvImportResultDto();

        if (lines.Count == 0)
        {
            return result;
        }

        // Line 1: Header
        var headerValues = ParseCsvLine(lines[0]);
        var headerMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < headerValues.Count; i++)
        {
            headerMap[headerValues[i].Trim()] = i;
        }

        // Fetch existing unique keys from DB to prevent duplicate insertion
        var existingUniqueKeys = await _accommodationRepository.GetExistingUniqueKeysAsync();
        var batchUniqueKeys = new HashSet<string>();

        var toInsert = new List<Accommodation>();

        // Process data rows starting from line index 1 (Line number 2 in file)
        for (int r = 1; r < lines.Count; r++)
        {
            int lineNumber = r + 1; // 1-based index (Header is line 1, data starts at line 2)
            var rowValues = ParseCsvLine(lines[r]);
            var lineErrors = new List<string>();

            string GetVal(string columnName)
            {
                if (headerMap.TryGetValue(columnName, out int idx) && idx < rowValues.Count)
                {
                    return rowValues[idx].Trim();
                }
                return string.Empty;
            }

            // 1. Required string fields
            string name = GetVal("Name");
            string description = GetVal("Description");
            string location = GetVal("Location");
            string city = GetVal("City");
            string country = GetVal("Country");
            string accommodationType = GetVal("AccommodationType");
            string priceStr = GetVal("PricePerNight");
            string operatorId = GetVal("OperatorId");

            if (string.IsNullOrWhiteSpace(operatorId))
            {
                operatorId = defaultOperatorId ?? string.Empty;
            }

            if (string.IsNullOrWhiteSpace(name))
            {
                lineErrors.Add("Numele este obligatoriu.");
            }

            if (string.IsNullOrWhiteSpace(location))
            {
                lineErrors.Add("Locația este obligatorie.");
            }

            if (string.IsNullOrWhiteSpace(city))
            {
                lineErrors.Add("Orașul este obligatoriu.");
            }

            if (string.IsNullOrWhiteSpace(country))
            {
                lineErrors.Add("Țara este obligatorie.");
            }

            if (string.IsNullOrWhiteSpace(accommodationType))
            {
                lineErrors.Add("Tipul de cazare este obligatoriu.");
            }
            else
            {
                var typeNorm = accommodationType.ToLowerInvariant();
                if (typeNorm != "hotel" && typeNorm != "apartment" && typeNorm != "hostel")
                {
                    lineErrors.Add("Tipul de cazare trebuie să fie Hotel, Apartment sau Hostel.");
                }
            }

            // 2. Numeric Price validation
            decimal price = 0;
            if (string.IsNullOrWhiteSpace(priceStr))
            {
                lineErrors.Add("Prețul pe noapte este obligatoriu.");
            }
            else if (!decimal.TryParse(priceStr, out price))
            {
                lineErrors.Add("Prețul pe noapte trebuie să fie un număr valid (s-a primit text invalid).");
            }
            else if (price <= 0)
            {
                lineErrors.Add("Prețul pe noapte trebuie să fie un număr pozitiv mai mare ca 0.");
            }

            // 3. Subtype specific field validations & parsing
            int? stars = null;
            bool? hasPool = null;
            bool? hasRoomService = null;
            int? totalRooms = null;

            int? floorNumber = null;
            bool? hasElevator = null;
            int? numberOfRooms = null;
            bool? isFurnished = null;

            decimal? bedPrice = null;
            bool? hasSharedKitchen = null;
            int? totalBeds = null;

            string starsStr = GetVal("Stars");
            if (!string.IsNullOrEmpty(starsStr))
            {
                if (!int.TryParse(starsStr, out int parsedStars))
                {
                    lineErrors.Add("Numărul de stele trebuie să fie un număr întreg.");
                }
                else if (parsedStars < 1 || parsedStars > 5)
                {
                    lineErrors.Add("Numărul de stele trebuie să fie între 1 și 5.");
                }
                else
                {
                    stars = parsedStars;
                }
            }

            string poolStr = GetVal("HasPool");
            if (!string.IsNullOrEmpty(poolStr))
            {
                if (TryParseBool(poolStr, out bool parsedPool))
                {
                    hasPool = parsedPool;
                }
                else
                {
                    lineErrors.Add("Valoarea pentru HasPool trebuie să fie un boolean valid (true/false).");
                }
            }

            string roomServiceStr = GetVal("HasRoomService");
            if (!string.IsNullOrEmpty(roomServiceStr))
            {
                if (TryParseBool(roomServiceStr, out bool parsedRs))
                {
                    hasRoomService = parsedRs;
                }
                else
                {
                    lineErrors.Add("Valoarea pentru HasRoomService trebuie să fie un boolean valid.");
                }
            }

            string totalRoomsStr = GetVal("TotalRooms");
            if (!string.IsNullOrEmpty(totalRoomsStr))
            {
                if (!int.TryParse(totalRoomsStr, out int parsedTr))
                {
                    lineErrors.Add("TotalRooms trebuie să fie un număr întreg.");
                }
                else if (parsedTr <= 0)
                {
                    lineErrors.Add("TotalRooms trebuie să fie mai mare ca 0.");
                }
                else
                {
                    totalRooms = parsedTr;
                }
            }

            string floorStr = GetVal("FloorNumber");
            if (!string.IsNullOrEmpty(floorStr))
            {
                if (!int.TryParse(floorStr, out int parsedFloor))
                {
                    lineErrors.Add("FloorNumber trebuie să fie un număr întreg.");
                }
                else if (parsedFloor < 0)
                {
                    lineErrors.Add("FloorNumber nu poate fi negativ.");
                }
                else
                {
                    floorNumber = parsedFloor;
                }
            }

            string elevatorStr = GetVal("HasElevator");
            if (!string.IsNullOrEmpty(elevatorStr))
            {
                if (TryParseBool(elevatorStr, out bool parsedElevator))
                {
                    hasElevator = parsedElevator;
                }
                else
                {
                    lineErrors.Add("Valoarea pentru HasElevator trebuie să fie un boolean valid.");
                }
            }

            string numRoomsStr = GetVal("NumberOfRooms");
            if (!string.IsNullOrEmpty(numRoomsStr))
            {
                if (!int.TryParse(numRoomsStr, out int parsedNumRooms))
                {
                    lineErrors.Add("NumberOfRooms trebuie să fie un număr întreg.");
                }
                else if (parsedNumRooms <= 0)
                {
                    lineErrors.Add("NumberOfRooms trebuie să fie mai mare ca 0.");
                }
                else
                {
                    numberOfRooms = parsedNumRooms;
                }
            }

            string furnishedStr = GetVal("IsFurnished");
            if (!string.IsNullOrEmpty(furnishedStr))
            {
                if (TryParseBool(furnishedStr, out bool parsedFurnished))
                {
                    isFurnished = parsedFurnished;
                }
                else
                {
                    lineErrors.Add("Valoarea pentru IsFurnished trebuie să fie un boolean valid.");
                }
            }

            string bedPriceStr = GetVal("BedInSharedRoomPrice");
            if (!string.IsNullOrEmpty(bedPriceStr))
            {
                if (!decimal.TryParse(bedPriceStr, out decimal parsedBedPrice))
                {
                    lineErrors.Add("BedInSharedRoomPrice trebuie să fie un număr decimal valid.");
                }
                else if (parsedBedPrice <= 0)
                {
                    lineErrors.Add("BedInSharedRoomPrice trebuie să fie mai mare ca 0.");
                }
                else
                {
                    bedPrice = parsedBedPrice;
                }
            }

            string kitchenStr = GetVal("HasSharedKitchen");
            if (!string.IsNullOrEmpty(kitchenStr))
            {
                if (TryParseBool(kitchenStr, out bool parsedKitchen))
                {
                    hasSharedKitchen = parsedKitchen;
                }
                else
                {
                    lineErrors.Add("Valoarea pentru HasSharedKitchen trebuie să fie un boolean valid.");
                }
            }

            string totalBedsStr = GetVal("TotalBeds");
            if (!string.IsNullOrEmpty(totalBedsStr))
            {
                if (!int.TryParse(totalBedsStr, out int parsedBeds))
                {
                    lineErrors.Add("TotalBeds trebuie să fie un număr întreg.");
                }
                else if (parsedBeds <= 0)
                {
                    lineErrors.Add("TotalBeds trebuie să fie mai mare ca 0.");
                }
                else
                {
                    totalBeds = parsedBeds;
                }
            }

            // 4. Duplicate Check (Uniqueness combination: Name + City + Location + AccommodationType)
            string uniqueKey = $"{name.Trim().ToLower()}|{city.Trim().ToLower()}|{location.Trim().ToLower()}|{accommodationType.Trim().ToLower()}";

            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(city) && !string.IsNullOrWhiteSpace(location) && !string.IsNullOrWhiteSpace(accommodationType))
            {
                if (existingUniqueKeys.Contains(uniqueKey) || batchUniqueKeys.Contains(uniqueKey))
                {
                    lineErrors.Add($"Cazarea cu Numele '{name}', Orașul '{city}', Locația '{location}' și Tipul '{accommodationType}' există deja în baza de date (duplicat).");
                }
            }

            // 5. Aggregate result for this row
            if (lineErrors.Count > 0)
            {
                result.FailedInsertCount++;
                result.FailedInsertsDetails.Add(new FailedInsertItemDto
                {
                    LineNumber = lineNumber,
                    Errors = lineErrors
                });
            }
            else
            {
                // Create entity
                Accommodation acc = accommodationType.ToLowerInvariant() switch
                {
                    "hotel" => new Hotel
                    {
                        Stars = stars ?? 3,
                        HasPool = hasPool ?? false,
                        HasRoomService = hasRoomService ?? false,
                        TotalRooms = totalRooms ?? 10
                    },
                    "apartment" => new Apartment
                    {
                        FloorNumber = floorNumber ?? 1,
                        HasElevator = hasElevator ?? false,
                        NumberOfRooms = numberOfRooms ?? 2,
                        IsFurnished = isFurnished ?? true
                    },
                    "hostel" => new Hostel
                    {
                        BedInSharedRoomPrice = bedPrice ?? 50,
                        HasSharedKitchen = hasSharedKitchen ?? true,
                        TotalBeds = totalBeds ?? 20
                    },
                    _ => new Accommodation()
                };

                acc.Id = Guid.NewGuid();
                acc.Name = name;
                acc.Description = description;
                acc.Location = location;
                acc.City = city;
                acc.Country = country;
                acc.PricePerNight = price;
                acc.OperatorId = operatorId;

                toInsert.Add(acc);
                batchUniqueKeys.Add(uniqueKey);
                result.SuccessfulInsertCount++;
            }
        }

        if (toInsert.Count > 0)
        {
            await _accommodationRepository.AddRangeAsync(toInsert);
        }

        return result;
    }

    private static bool TryParseBool(string val, out bool result)
    {
        val = val.Trim().ToLowerInvariant();
        if (val == "true" || val == "1" || val == "yes" || val == "da")
        {
            result = true;
            return true;
        }
        if (val == "false" || val == "0" || val == "no" || val == "nu")
        {
            result = false;
            return true;
        }
        result = false;
        return false;
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        if (string.IsNullOrEmpty(line)) return result;

        var current = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString().Trim());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString().Trim());
        return result;
    }
}
