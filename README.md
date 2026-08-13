# 🏨 RBooking — Platformă Premium de Rezervări Hoteliere & Management

<div align="center">

![RBooking Banner](https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80)

[![.NET Version](https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](#-backend-tehnologii)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)](#-frontend-tehnologii)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](#-baza-de-date)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](#-frontend-tehnologii)
[![Tests Passing](https://img.shields.io/badge/Unit_Tests-69_Passed-2ea44f?style=for-the-badge&logo=githubactions&logoColor=white)](#-testare-automată)

**RBooking** este o platformă modernă, completă și sigură pentru explorarea, rezervarea și administrarea cazărilor turistice (Hoteluri, Apartamente, Hosteluri). Arhitectura este bazată pe **Clean Architecture** în backend (.NET 10) și **Next.js 16 (App Router & Turbopack)** în frontend, oferind performanță excepțională, securitate ridicată și o experiență de utilizare impecabilă.

[Caracteristici](#-caracteristici-cheie) • [Arhitectură](#-arhitectură-și-structură) • [Instalare & Rulare](#-instalare-și-pornire-rapidă) • [API & Swagger](#-api-endpoints--documentație) • [Securitate](#-securitate--autorizare) • [Testare](#-testare-automată)

---

</div>

## ✨ Caracteristici Cheie

### 🌍 Pentru Clienți & Vizitatori
* 🔍 **Catalog Inteligent de Cazări:** Filtrare în timp real după destinație, tip de cazare (*Hotel, Apartament, Hostel*), interval de preț și căutare textuală.
* ⭐ **Sistem Corect de Recenzii:** 
  * Afișare badge neutru neevaluat (`Fără recenzii`) pentru cazări noi.
  * **Regulă strictă:** Cel mult **1 recenzie per utilizator per cazare** (bazată pe o rezervare validă).
* 📅 **Rezervări Fără Duplicate:** Prevenirea automată a rezervărilor active suprapuse la aceeași cazare.
* ❤️ **Wishlist / Favorite Sincronizat în Baza de Date:** 
  * Salvare în tabelul dedicat `Wishlist` din PostgreSQL la nivel de utilizator.
  * Sincronizare automată asincronă cu fallback local pentru ochi instantaneu.
* 🌐 **Bilingv Reactiv (Română & Engleză):** Comutare instantă fără reîncărcarea paginii.
* 🌗 **Dark / Light Mode:** Tranziții fluide de temă vizuală cu persistență automată.
* 👤 **Panoul Contului Meu (`/account`):** Vizualizare profil, administrare chei API (`X-Api-Key`) cu utilitar live de testare și lista personalizată de favorite.

### 🏢 Pentru Manageri & Operatori
* 🔐 **Izolare Strictă a Proprietăților:** 
  * Fiecare cazare are asociat un `OperatorId` de tip `Guid`.
  * Managerii pot vizualiza toate cazările, dar **pot edita și șterge doar propriile lor proprietăți** (verificare strictă în backend cu cod HTTP `403 Forbidden`).
* 🏷️ **Panou Dedicat de Management (`/manager/accommodation`):** 
  * Tab-uri comutabile: `Cazările Mele` vs. `Toate Cazările`.
  * Formular dinamic adaptiv în funcție de tipul de cazare (ex: *Stele, Piscină, Room Service* pentru Hoteluri; *Etaj, Lift, Camere* pentru Apartamente; *Preț pat dormitor comun, Bucătărie comună* pentru Hosteluri).
* 📊 **Import Masiv prin CSV:** Încărcare automată a zeci de cazări dintr-un singur fișier CSV.

### 🛡️ Pentru Administratori
* 🔑 **Gestiune Discounturi & Clienți de Serviciu:** Modele TPH de discounturi (*Procentual, Valoare Fixă, Loialitate*).
* 📈 **Rapoarte & Export:** Filtrare avansată și generare de statistici detaliate.

---

## 🏗️ Arhitectură și Structură

Proiectul respectă principiile **Clean Architecture** și **Domain-Driven Design (DDD)**:

```
RBooking/
├── backend/
│   ├── RBooking.Domain/           # Entități de domeniu, Enums, Concepte de bază
│   │   ├── Entities/              # Accommodation (Hotel, Apartment, Hostel), User, Reservation, Review, WishlistItem, Discount
│   │   └── Enums/                 # UserRole, ReservationStatus, DiscountType
│   │
│   ├── RBooking.Application/      # Logica de business, DTOs, Interfețe de servicii
│   │   ├── DTOs/                  # AccommodationDto, ReservationDto, ReviewDto, WishlistItemDto, etc.
│   │   ├── Interfaces/            # IAccommodationService, IWishlistService, IReviewService, etc.
│   │   └── Services/              # Servicii concrete de business logic
│   │
│   ├── RBooking.Infrastructure/   # Acces la date, PostgreSQL EF Core, Migrări, Repository-uri
│   │   ├── data/                  # AppDbContext, DbSeeder
│   │   ├── Migrations/            # EF Core Migrations
│   │   └── Repositories/          # AccommodationRepository, WishlistRepository, etc.
│   │
│   ├── RBooking.API/              # ASP.NET Core Web API (Controllers, Middleware, Swagger)
│   │   ├── Controllers/           # AccommodationsController, WishlistController, ReviewsController, etc.
│   │   ├── Middleware/            # ApiKeyMiddleware, GlobalExceptionHandler
│   │   └── Program.cs             # Configurare Kestrel, DI, Rate Limiting, JWT & CORS
│   │
│   └── RBooking.Tests/            # Teste automate unitare (xUnit, Moq) - 69 teste
│
├── frontend/                      # Next.js 16 (App Router, Turbopack, Tailwind CSS)
│   ├── app/                       # Pagini: / (Home), /hotels/[id], /reservations, /account, /manager/accommodation, /admin
│   ├── components/                # Navbar, Accommodations, StarRating, ThemeToggle, Footer
│   ├── context/                   # LanguageContext (RO/EN)
│   └── lib/                       # userStorage.ts (Wishlist & Reservations Sync), apiKey.ts
│
└── run-dev.sh                     # Script de pornire simultană Backend & Frontend
```

---

## 🛠️ Tehnologii Utilizate

### 🖥️ Backend (.NET 10 Web API)
| Tehnologie | Rol / Utilizare |
| :--- | :--- |
| **C# / .NET 10** | Runtime modern de înaltă performanță |
| **Entity Framework Core 10** | ORM cu suport TPH (*Table-Per-Hierarchy*) și migrări automate |
| **PostgreSQL & Npgsql** | Bază de date relațională robustă |
| **JWT Authentication** | Autentificare pe bază de Bearer tokens cu suport dual (*User* & *Service Client*) |
| **API Key Middleware** | Protecție granulară pe fiecare endpoint prin header `X-Api-Key` |
| **Rate Limiting** | Protecție anti-DDoS și brute-force prin `TokenBucketRateLimiter` |
| **Swagger / OpenAPI** | Documentație interactivă a tuturor rutelor API |
| **xUnit & Moq** | Suită completă de teste unitare |

### 🌐 Frontend (Next.js 16)
| Tehnologie | Rol / Utilizare |
| :--- | :--- |
| **Next.js 16 (App Router)** | Framework React full-stack cu Turbopack |
| **React 19 & TypeScript** | Componente tipizate și reactive |
| **Tailwind CSS** | Styling modern, responsiv și curat |
| **Lucide Icons** | Pachet de pictograme consistente |

---

## 🚀 Instalare și Pornire Rapidă

### Cerințe Preliminare
* [.NET 10 SDK](https://dotnet.microsoft.com/download)
* [Node.js (v20+)](https://nodejs.org/) și `npm`
* [PostgreSQL](https://www.postgresql.org/) (instalat și pornit pe portul implicit `5432`)

### 1. Clonarea Proiectului
```bash
git clone https://github.com/cosarcarazvan02-blip/RBooking.git
cd RBooking
```

### 2. Configurare Bază de Date (PostgreSQL)
Verifică setările de conexiune din [`backend/RBooking.API/appsettings.json`](file:///home/reeea/Documents/RBooking/RBooking/backend/RBooking.API/appsettings.json):
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=rbooking;Username=postgres;Password=postgres"
}
```

Aplică migrările pe baza de date:
```bash
dotnet ef database update --project backend/RBooking.Infrastructure --startup-project backend/RBooking.API
```

### 3. Pornirea Aplicației

#### Opțiunea A: Folosind scriptul automat `run-dev.sh`
```bash
chmod +x run-dev.sh
./run-dev.sh
```

#### Opțiunea B: Manual în 2 terminale separate

**Terminal 1 — Backend:**
```bash
cd backend/RBooking.API
dotnet run
```
> Backend-ul va porni la adresa: `http://localhost:5293` (Swagger: `http://localhost:5293/swagger`)

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
> Frontend-ul va porni la adresa: `http://localhost:3000`

---

## 📚 API Endpoints & Documentație

Documentația interactivă Swagger este accesibilă la:  
👉 **`http://localhost:5293/swagger`**

### Principalele Endpoint-uri REST:

| Metodă | Rută API | Rol / Descriere | Acces / Roluri |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/Accommodations` | Listă cazări paginată cu filtrare completă | Public |
| `GET` | `/api/Accommodations/{id}` | Detalii complete cazare + statistici recenzii | Public |
| `POST` | `/api/Accommodations` | Creare cazare nouă (asociere automată cu `OperatorId`) | Manager, Admin |
| `PUT` | `/api/Accommodations/{id}` | Modificare cazare (doar proprietarul sau Admin) | Manager, Admin |
| `DELETE` | `/api/Accommodations/{id}` | Ștergere cazare (doar proprietarul sau Admin) | Manager, Admin |
| `POST` | `/api/Accommodations/import-csv`| Import masiv de cazări din fișier CSV | Manager, Admin |
| `GET` | `/api/Wishlist` | Returnează favoritele utilizatorului conectat | Autentificat |
| `POST` | `/api/Wishlist` | Adaugă o cazare în wishlist (`{ accommodationId }`) | Autentificat |
| `DELETE` | `/api/Wishlist/{accommodationId}` | Șterge cazarea din wishlist | Autentificat |
| `GET` | `/api/Reservations/my` | Rezervările utilizatorului autentificat | Autentificat |
| `POST` | `/api/Reservations` | Creare rezervare (verificare rezervare activă) | Client, Admin |
| `DELETE` | `/api/Reservations/{id}` | Anulare/ștergere rezervare | Client, Admin |
| `POST` | `/api/Reviews` | Adăugare recenzie (max 1 recenzie per cazare) | Client |
| `POST` | `/api/Auth/login` | Autentificare utilizator & generare token JWT | Public |
| `POST` | `/api/Auth/register` | Înregistrare cont nou | Public |

---

## 🔒 Securitate & Autorizare

1. **Header `X-Api-Key`:**
   * Toate cererile API sunt validate prin `ApiKeyMiddleware`.
   * Clienții pot configura și testa propria cheie API direct din interfața `/account`.
2. **Dual-Scheme JWT Bearer:**
   * `UserBearer`: Generat la autentificarea utilizatorilor obișnuiți și managerilor.
   * `ServiceBearer`: Generat pentru servicii externe / integrări automate B2B.
3. **Controlul Accesului la Date (Ownership Protection):**
   * Logica de business din [`AccommodationService.cs`](file:///home/reeea/Documents/RBooking/RBooking/backend/RBooking.Application/Services/AccommodationService.cs) validează `accommodation.OperatorId == currentUserId` la orice modificare sau ștergere.

---

## 🧪 Testare Automată

Backend-ul conține **69 de teste automate unitare** ce acoperă serviciile de cazări, rezervări, recenzii, wishlist, import CSV și raportare.

Pentru rularea testelor:
```bash
dotnet test backend
```

```
Passed!  - Failed: 0, Passed: 69, Skipped: 0, Total: 69 - RBooking.Tests.dll (net10.0)
```

---

## 👥 Conturi Demonstrative Pre-configurate

La prima pornire a bazei de date, `DbSeeder` populează automat utilizatori de test:

| Rol | Email | Parolă | Descriere |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@rbooking.com` | `Admin123!` | Acces total la sistem, statistici și cazări |
| **Manager** | `manager@rbooking.com` | `Manager123!` | Poate gestiona și edita propriile cazări |
| **Client** | `client@rbooking.com` | `Client123!` | Poate face rezervări, adăuga favorite și recenzii |

---

<div align="center">

Proiect dezvoltat cu pasiune pentru excelență tehnică și design modern.  
© 2026 **RBooking Hospitality Platform**. Toate drepturile rezervate.

</div>
