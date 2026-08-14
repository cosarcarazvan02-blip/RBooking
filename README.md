# 🏨 RBooking — Platformă Premium de Rezervări Hoteliere & Management

<div align="center">

![RBooking Banner](https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80)

[![.NET Version](https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](#-backend-tehnologii)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)](#-frontend-tehnologii)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](#-baza-de-date)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](#-frontend-tehnologii)
[![Tests Passing](https://img.shields.io/badge/Unit_Tests-101_Passed-2ea44f?style=for-the-badge&logo=githubactions&logoColor=white)](#-testare-automată)

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
  * Sincronizare automată asincronă cu fallback local pentru viteză instantanee.
* 🌐 **Bilingv Reactiv (Română & Engleză):** Comutare instantă fără reîncărcarea paginii.
* 🌗 **Dark / Light Mode:** Tranziții fluide de temă vizuală cu persistență automată.
* 👤 **Panoul Contului Meu (`/account`):** 
  * Vizualizare și editare profil.
  * Administrare chei API (`X-Api-Key`) cu utilitar live de testare.
  * Gestionarea aplicațiilor pentru statutul de gazdă/operator.
  * **Securitate Cont & Coduri de Recuperare (Recovery Codes)**: Generare set de 10 coduri de rezervă, copiere în clipboard și export `.txt`.

### 🔐 Sistem de Autentificare & Coduri de Recuperare (2FA Backup)
* 🛡️ **Coduri de Recuperare de Urgență:**
  * Generare criptografică securizată de 10 coduri alfanumerice unice (ex: `7K2M-9P4X`).
  * Normalizare tolerantă la input (insensibilă la format, cratime, spații și litere mari/mici) cu stocare SHA-256 hash în PostgreSQL.
  * **Single-use:** Fiecare cod folosit este invalidat automat și ireversibil.
  * Contorizare live a codurilor rămase cu avertizări proactive când numărul devine scăzut ($\le 2$).
* 📱 **Autentificare fără telefon la îndemână:**
  * Opțiune directă în formularul de logare (`/login`): *„Autentificare cu Cod de Recuperare (fără telefon)”*.
  * Permite conectarea instantanee chiar și în absența accesului la telefon sau la aplicația 2FA (TOTP).

### 🏢 Pentru Manageri & Operatori
* 🔐 **Izolare Strictă a Proprietăților:** 
  * Fiecare cazare are asociat un `OperatorId` de tip `Guid`.
  * Managerii pot vizualiza toate cazările, dar **pot edita și șterge doar propriile lor proprietăți** (verificare strictă în backend cu cod HTTP `403 Forbidden`).
* 🏷️ **Panou Dedicat de Management (`/manager/accommodation`):** 
  * Tab-uri comutabile: `Cazările Mele` vs. `Toate Cazările`.
  * Formular dinamic adaptiv în funcție de tipul de cazare (ex: *Stele, Piscină, Room Service* pentru Hoteluri; *Etaj, Lift, Camere* pentru Apartamente; *Preț pat dormitor comun, Bucătărie comună* pentru Hosteluri).
* 💰 **Gestiune Câștiguri & Comisioane (`/manager/earnings`):** Calcul transparent al sumelor brute, comisionului platformei și plăților nete către operator.
* 📊 **Import Masiv prin CSV:** Încărcare automată a zeci de cazări dintr-un singur fișier CSV.

### 🛡️ Pentru Administratori
* 🔑 **Gestiune Cereri Gazdă (Host Applications):** Aprobare și respingere cereri utilizatori pentru a deveni operatori.
* 🏷️ **Gestiune Discounturi & Clienți de Serviciu:** Modele TPH de discounturi (*Procentual, Valoare Fixă, Loialitate*).
* 📈 **Rapoarte & Export:** Filtrare avansată și generare de statistici detaliate.

---

## 🏗️ Arhitectură și Structură

Proiectul respectă principiile **Clean Architecture** și **Domain-Driven Design (DDD)**:

```
RBooking/
├── backend/
│   ├── RBooking.Domain/           # Entități de domeniu, Enums, Concepte de bază
│   │   ├── Entities/              # Accommodation (Hotel, Apartment, Hostel), User, RecoveryCode, Reservation, Review, WishlistItem, HostApplication, Discount
│   │   └── Enums/                 # UserRole, ReservationStatus, HostApplicationStatus, DiscountType
│   │
│   ├── RBooking.Application/      # Logica de business, DTOs, Interfețe de servicii
│   │   ├── DTOs/                  # GeneratedRecoveryCodesDto, RecoveryCodeStatusDto, VerifyRecoveryCodeRequestDto, AccommodationDto, etc.
│   │   ├── Interfaces/            # IRecoveryCodeService, IAccommodationService, IWishlistService, IReviewService, etc.
│   │   └── Services/              # RecoveryCodeService, ReservationService, AccommodationService, etc.
│   │
│   ├── RBooking.Infrastructure/   # Acces la date, PostgreSQL EF Core, Migrări, Repository-uri
│   │   ├── data/                  # AppDbContext, DbSeeder
│   │   ├── Migrations/            # EF Core Migrations (inclusiv AddRecoveryCodesAndTwoFactor)
│   │   └── Repositories/          # RecoveryCodeRepository, AccommodationRepository, WishlistRepository, etc.
│   │
│   ├── RBooking.API/              # ASP.NET Core Web API (Controllers, Middleware, Swagger)
│   │   ├── Controllers/           # AuthController, AccommodationsController, HostApplicationsController, WishlistController, etc.
│   │   ├── Middleware/            # ApiKeyMiddleware, GlobalExceptionHandler
│   │   └── Program.cs             # Configurare Kestrel, DI, Rate Limiting, JWT & CORS
│   │
│   └── RBooking.Tests/            # Teste automate unitare (xUnit, Moq) - 101 teste
│
├── frontend/                      # Next.js 16 (App Router, Turbopack, Tailwind CSS)
│   ├── app/                       # Pagini: / (Home), /hotels/[id], /reservations, /account, /manager/accommodation, /manager/earnings, /admin, /login, /register
│   ├── components/                # LoginForm (cu suport Cod Recuperare), Navbar, Accommodations, StarRating, ThemeToggle, Footer
│   ├── context/                   # LanguageContext (RO/EN)
│   └── lib/                       # userStorage.ts (Wishlist & Sync), apiKey.ts, translateApiError.ts
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
| **Recovery Codes Engine** | Generare securizată, hashing SHA-256 și consum single-use pentru 2FA backup |
| **API Key Middleware** | Protecție granulară pe fiecare endpoint prin header `X-Api-Key` |
| **Rate Limiting** | Protecție anti-DDoS și brute-force prin `TokenBucketRateLimiter` |
| **Swagger / OpenAPI** | Documentație interactivă a tuturor rutelor API |
| **xUnit & Moq** | Suită completă de 101 teste unitare |

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
  "DefaultConnection": "Host=localhost;Port=5433;Database=RBooking;Username=postgres;Password=1234"
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
| `POST` | `/api/Auth/login` | Autentificare utilizator & generare token JWT | Public |
| `POST` | `/api/Auth/register` | Înregistrare cont nou cu validare parolă | Public |
| `POST` | `/api/Auth/recovery-codes/generate` | Generare set nou de 10 coduri de recuperare | Autentificat |
| `GET` | `/api/Auth/recovery-codes/status` | Verificare număr coduri rămase & stare 2FA | Autentificat |
| `POST` | `/api/Auth/recovery-codes/verify` | Autentificare de urgență prin cod de recuperare | Public |
| `POST` | `/api/Auth/two-factor/toggle` | Activare/dezactivare autentificare în 2 pași | Autentificat |
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
| `GET` | `/api/Reservations/earnings` | Calcul câștiguri și comisioane operator | Operator, Admin |
| `POST` | `/api/Reservations` | Creare rezervare (verificare rezervare activă) | Client, Admin |
| `DELETE` | `/api/Reservations/{id}` | Anulare/ștergere rezervare | Client, Admin |
| `POST` | `/api/host-applications` | Trimitere cerere pentru statutul de gazdă | Client |
| `GET` | `/api/host-applications/mine` | Verificare stare cerere gazdă proprie | Client |
| `POST` | `/api/Reviews` | Adăugare recenzie (max 1 recenzie per cazare) | Client |

---

## 🔒 Securitate & Autorizare

1. **Header `X-Api-Key`:**
   * Toate cererile API sunt validate prin `ApiKeyMiddleware`.
   * Clienții pot configura și testa propria cheie API direct din interfața `/account`.
2. **Dual-Scheme JWT Bearer:**
   * `UserBearer`: Generat la autentificarea utilizatorilor obișnuiți și managerilor.
   * `ServiceBearer`: Generat pentru servicii externe / integrări automate B2B.
3. **Mecanism de Siguranță 2FA & Izolare Strictă a Codurilor de Recuperare:**
   * **Stocare Securizată:** Codurile sunt stocate exclusiv ca hash-uri SHA-256 în tabela `RecoveryCodes`, nefiind niciodată păstrate în clar în baza de date.
   * **Izolare per Utilizator:** Fiecare cod este asociat unic cu `UserId`. Un cod generat de un utilizator nu poate fi folosit sub nicio formă pentru alt cont.
   * **Consum de Unică Folosință (Single-Use):** La fiecare autentificare reușită cu un cod de recuperare, acesta este invalidat automat și ireversibil (`IsUsed = true`, `UsedAt = NOW()`).
4. **Controlul Accesului la Date (Ownership Protection):**
   * Logica de business validează `accommodation.OperatorId == currentUserId` la orice modificare sau ștergere.

---

## 🧪 Testare Automată

Backend-ul conține **101 teste automate unitare** ce acoperă serviciile de coduri de recuperare, cazări, rezervări, recenzii, wishlist, import CSV, cereri gazdă și calcul comisioane.

Pentru rularea testelor:
```bash
dotnet test backend
```

```
Passed!  - Failed: 0, Passed: 101, Skipped: 0, Total: 101 - RBooking.Tests.dll (net10.0)
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
