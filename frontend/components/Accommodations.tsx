"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, ArrowUpRight, Compass, X, Database, RefreshCw, LayoutGrid, Hotel, Building, BedDouble, Heart } from "lucide-react";
import { Accommodation } from "@/types";
import { getActiveApiKey } from "@/lib/apiKey";
import { useLanguage } from "@/context/LanguageContext";

const NO_PHOTO_PLACEHOLDER = "https://www.tez-tour.ro/static/images/nophoto-hotel.png";

interface RawAccommodationDto {
  id: string;
  name: string;
  location?: string;
  city?: string;
  country?: string;
  accommodationType?: string;
  imageUrl?: string;
  pricePerNight?: number;
}

const emptySubscribe = () => () => {};

export default function Accommodations() {
  const { lang } = useLanguage();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFromDatabase, setIsFromDatabase] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedCity, setSelectedCity] = useState<string>("All");

  const reloadData = async () => {
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5293/api";
      const apiKey = getActiveApiKey();

      const res = await fetch(`${apiUrl}/Accommodations?PageNumber=1&PageSize=50`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const items: RawAccommodationDto[] = Array.isArray(data)
          ? data
          : data.items || data.Items || [];

        const mapped: Accommodation[] = items.map((item, index) => ({
          id: item.id || `acc-${index}`,
          name: item.name,
          location: item.location || `${item.city || "România"}, ${item.country || ""}`,
          city: item.city || "București",
          country: item.country || "România",
          accommodationType: item.accommodationType || "Hotel",
          imageUrl:
            item.imageUrl && item.imageUrl.trim()
              ? item.imageUrl
              : NO_PHOTO_PLACEHOLDER,
          pricePerNight: item.pricePerNight || 350,
        }));

        setAccommodations(mapped);
        setIsFromDatabase(true);
      } else {
        setAccommodations([]);
        setIsFromDatabase(false);
      }
    } catch {
      setAccommodations([]);
      setIsFromDatabase(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const executeFetch = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5293/api";
      const apiKey = getActiveApiKey();

      fetch(`${apiUrl}/Accommodations?PageNumber=1&PageSize=50`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (ignore) return;
          if (data) {
            const items: RawAccommodationDto[] = Array.isArray(data)
              ? data
              : data.items || data.Items || [];

            const mapped: Accommodation[] = items.map((item, index) => ({
              id: item.id || `acc-${index}`,
              name: item.name,
              location: item.location || `${item.city || "România"}, ${item.country || ""}`,
              city: item.city || "București",
              country: item.country || "România",
              accommodationType: item.accommodationType || "Hotel",
              imageUrl:
                item.imageUrl && item.imageUrl.trim()
                  ? item.imageUrl
                  : NO_PHOTO_PLACEHOLDER,
            }));
            setAccommodations(mapped);
            setIsFromDatabase(true);
            setIsLoading(false);
            return;
          }
          setAccommodations([]);
          setIsFromDatabase(false);
          setIsLoading(false);
        })
        .catch(() => {
          if (ignore) return;
          setAccommodations([]);
          setIsFromDatabase(false);
          setIsLoading(false);
        });
    };

    executeFetch();

    const handleKeyChange = () => {
      executeFetch();
    };

    window.addEventListener("api-key-change", handleKeyChange);

    return () => {
      ignore = true;
      window.removeEventListener("api-key-change", handleKeyChange);
    };
  }, []);

  // Sync favorites with localStorage
  useEffect(() => {
    const updateFavs = () => {
      if (typeof window === "undefined") return;
      const saved = localStorage.getItem("rbooking_favorites");
      if (saved) {
        try {
          const favs = JSON.parse(saved);
          if (Array.isArray(favs)) {
            setFavoriteIds(new Set(favs.map((item: any) => item.id || item)));
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setFavoriteIds(new Set());
    };

    updateFavs();
    window.addEventListener("rbooking_favorites_change", updateFavs);
    window.addEventListener("storage", updateFavs);

    const handleSelectCat = (e: any) => {
      if (e?.detail) {
        setSelectedType(e.detail);
      }
    };
    window.addEventListener("rbooking_select_category", handleSelectCat);

    return () => {
      window.removeEventListener("rbooking_favorites_change", updateFavs);
      window.removeEventListener("storage", updateFavs);
      window.removeEventListener("rbooking_select_category", handleSelectCat);
    };
  }, []);

  const handleToggleFavorite = (hotel: Accommodation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === "undefined") return;

    const isFav = favoriteIds.has(hotel.id);
    const existing = JSON.parse(localStorage.getItem("rbooking_favorites") || "[]");
    let updated: any[];

    if (!isFav) {
      const favItem = {
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
        city: hotel.city,
        country: hotel.country,
        pricePerNight: hotel.pricePerNight,
        imageUrl: hotel.imageUrl || NO_PHOTO_PLACEHOLDER,
        accommodationType: hotel.accommodationType,
        averageRating: hotel.averageRating,
        savedAt: new Date().toISOString(),
      };
      updated = [favItem, ...existing.filter((item: any) => (item.id || item) !== hotel.id)];
    } else {
      updated = existing.filter((item: any) => (item.id || item) !== hotel.id);
    }

    localStorage.setItem("rbooking_favorites", JSON.stringify(updated));
    setFavoriteIds(new Set(updated.map((item: any) => item.id || item)));
    window.dispatchEvent(new Event("rbooking_favorites_change"));
  };

  // Filter options
  const cities = useMemo(() => {
    const set = new Set<string>();
    accommodations.forEach((item) => {
      if (item.city) set.add(item.city);
    });
    return ["All", ...Array.from(set)];
  }, [accommodations]);

  // Filtered accommodations
  const filteredAccommodations = useMemo(() => {
    return accommodations.filter((item) => {
      const matchText =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.city && item.city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType =
        selectedType === "All" ||
        (selectedType === "Favorites"
          ? favoriteIds.has(item.id)
          : item.accommodationType?.toLowerCase() === selectedType.toLowerCase());

      const matchCity =
        selectedCity === "All" ||
        (item.city && item.city.toLowerCase() === selectedCity.toLowerCase());

      return matchText && matchType && matchCity;
    });
  }, [accommodations, searchQuery, selectedType, selectedCity, favoriteIds]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("All");
    setSelectedCity("All");
  };

  const hasActiveFilters =
    searchQuery !== "" || selectedType !== "All" || selectedCity !== "All";

  return (
    <section id="accommodations" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-neutral-300 dark:border-neutral-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono font-semibold tracking-[0.25em] uppercase text-amber-700 dark:text-amber-300">
              {lang === "RO" ? "[ 02 / CAZĂRI ]" : "[ 02 / ACCOMMODATIONS ]"}
            </span>
            {isClient && isFromDatabase ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <Database className="w-3 h-3" />
                <span>{lang === "RO" ? "Bază de Date Live (PostgreSQL)" : "Live PostgreSQL DB"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
                <span>{lang === "RO" ? "Colecție Curată" : "Curated Collection"}</span>
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-neutral-950 dark:text-white tracking-tight">
            {lang === "RO" ? "Cazări Disponibile" : "Accommodations"}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
          <button
            onClick={() => void reloadData()}
            disabled={!isClient ? false : isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            title={lang === "RO" ? "Reîmprospătează datele din baza de date" : "Refresh database records"}
          >
            <RefreshCw className={`w-3 h-3 ${isClient && isLoading ? "animate-spin" : ""}`} />
            <span>{lang === "RO" ? "Reîncarcă DB" : "Reload DB"}</span>
          </button>
          <span>
            {filteredAccommodations.length}{" "}
            {filteredAccommodations.length === 1
              ? lang === "RO"
                ? "opțiune găsită"
                : "option found"
              : lang === "RO"
              ? "opțiuni găsite"
              : "options found"}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#121418] border border-neutral-300 dark:border-neutral-800 p-6 mb-12 shadow-xs transition-colors duration-300 space-y-5">
        {/* Category Tabs with Icons */}
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5 flex items-center justify-between">
            <span>{lang === "RO" ? "Categorie Cazare" : "Accommodation Category"}</span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {filteredAccommodations.length}{" "}
              {filteredAccommodations.length === 1
                ? lang === "RO"
                  ? "rezultat"
                  : "result"
                : lang === "RO"
                ? "rezultate"
                : "results"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
            {[
              {
                id: "All",
                label: lang === "RO" ? "Toate" : "All",
                icon: LayoutGrid,
              },
              {
                id: "Favorites",
                label: lang === "RO" ? `Favorite (${favoriteIds.size})` : `Favorites (${favoriteIds.size})`,
                icon: Heart,
              },
              {
                id: "Hotel",
                label: lang === "RO" ? "Hoteluri" : "Hotels",
                icon: Hotel,
              },
              {
                id: "Apartment",
                label: lang === "RO" ? "Apartamente" : "Apartments",
                icon: Building,
              },
              {
                id: "Hostel",
                label: lang === "RO" ? "Hosteluri" : "Hostels",
                icon: BedDouble,
              },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedType === cat.id;
              const isFavCat = cat.id === "Favorites";
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedType(cat.id)}
                  className={`px-3 py-3 text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 border ${
                    isSelected
                      ? isFavCat
                        ? "bg-rose-600 text-white border-rose-600 font-bold shadow-xs scale-[1.01]"
                        : "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-neutral-950 dark:border-white font-bold shadow-xs scale-[1.01]"
                      : isFavCat
                      ? "bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                      : "bg-neutral-50 dark:bg-[#181a20] text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800 hover:border-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected
                        ? isFavCat
                          ? "fill-white text-white"
                          : "text-amber-400 dark:text-amber-600"
                        : isFavCat
                        ? "text-rose-500 fill-rose-500"
                        : "text-neutral-400"
                    }`}
                  />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input + City Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-4 border-t border-neutral-200 dark:border-neutral-800/80 items-center">
          {/* Search Input */}
          <div className="md:col-span-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "RO" ? "Caută după nume hotel sau locație..." : "Search by hotel name or location..."}
              className="w-full pl-11 pr-10 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white border border-neutral-300 dark:border-neutral-800 font-sans transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* City Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white font-sans transition-all cursor-pointer"
            >
              {cities.map((city) => (
                <option key={city} value={city} className="bg-white dark:bg-[#181a20]">
                  {city === "All" ? (lang === "RO" ? "Toate Orașele" : "All Cities") : city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-neutral-500 dark:text-neutral-400 uppercase">
                {lang === "RO" ? "Filtre active:" : "Active filters:"}
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  „{searchQuery}”
                </span>
              )}
              {selectedCity !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                  {lang === "RO" ? "Oraș:" : "City:"} {selectedCity}
                </span>
              )}
              {selectedType !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                  {lang === "RO" ? "Categorie:" : "Category:"} {selectedType}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-amber-800 dark:text-amber-300 hover:underline uppercase tracking-wider font-semibold cursor-pointer"
            >
              {lang === "RO" ? "[ Resetează ]" : "[ Reset ]"}
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isClient && isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-[#121418] border border-neutral-300 dark:border-neutral-800 animate-pulse"
            >
              <div className="w-full h-72 bg-neutral-200 dark:bg-neutral-800" />
              <div className="p-6 space-y-4">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-800 w-3/4" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-1/2" />
                <div className="h-10 bg-neutral-200 dark:bg-neutral-800 w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAccommodations.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 bg-white dark:bg-[#121418] border border-neutral-300 dark:border-neutral-800 p-8 rounded-2xl shadow-xs">
          {selectedType === "Favorites" ? (
            <Heart className="w-12 h-12 mx-auto text-rose-500 mb-4 stroke-[1.5] fill-rose-500/20" />
          ) : (
            <Compass className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
          )}
          <h3 className="text-xl font-serif text-neutral-900 dark:text-white mb-2">
            {selectedType === "Favorites"
              ? lang === "RO"
                ? "Nu ai nicio cazare salvată la favorite"
                : "No saved favorite stays yet"
              : lang === "RO"
              ? "Nicio cazare în baza de date"
              : "No accommodations found"}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
            {selectedType === "Favorites"
              ? lang === "RO"
                ? "Apasă pe butonul cu inimioară de pe cardul oricărei cazări din colecție pentru a o adăuga la lista ta de favorite."
                : "Click the heart button on any stay card from the collection to add it to your favorites list."
              : lang === "RO"
              ? "Nu am găsit nicio proprietate conform filtrelor selectate. Încearcă să resetezi căutarea."
              : "No properties match your current filters. Try resetting search."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest border border-neutral-950 dark:border-white rounded-xl cursor-pointer"
            >
              {lang === "RO" ? "Vezi Toate Cazările" : "View All Stays"}
            </button>
          )}
        </div>
      ) : (
        /* Hotel Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filteredAccommodations.map((hotel) => (
            <article
              key={hotel.id}
              className="group bg-white dark:bg-[#121418] border border-neutral-300 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-white transition-all duration-300 flex flex-col justify-between shadow-xs"
            >
              {/* 1. Imagine Cazare */}
              <div className="relative w-full h-72 sm:h-80 overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                <Image
                  src={hotel.imageUrl || NO_PHOTO_PLACEHOLDER}
                  alt={hotel.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                {hotel.accommodationType && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest font-semibold bg-white/95 text-neutral-950 dark:bg-neutral-950/95 dark:text-white border border-neutral-300 dark:border-white/20 shadow-sm">
                      {hotel.accommodationType}
                    </span>
                  </div>
                )}

                {/* Buton Salvare Favorite Interactiv */}
                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(hotel, e)}
                  className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xs active:scale-90 ${
                    favoriteIds.has(hotel.id)
                      ? "bg-rose-600 text-white border-rose-600 dark:border-rose-400 shadow-md"
                      : "bg-white/80 dark:bg-black/60 text-neutral-700 dark:text-neutral-200 border-white/40 dark:border-white/20 hover:bg-white dark:hover:bg-black/90"
                  }`}
                  title={
                    favoriteIds.has(hotel.id)
                      ? lang === "RO"
                        ? "Elimină din favorite"
                        : "Remove from favorites"
                      : lang === "RO"
                      ? "Salvează la favorite"
                      : "Save to favorites"
                  }
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favoriteIds.has(hotel.id)
                        ? "fill-white text-white"
                        : "text-neutral-700 dark:text-neutral-200 hover:text-rose-500"
                    }`}
                  />
                </button>
              </div>

              {/* 2. Informații */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif text-neutral-950 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors leading-snug mb-2">
                    {hotel.name}
                  </h3>

                  <div className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
                    <span>{hotel.location}</span>
                  </div>
                </div>

                {/* 3. Buton către Pagina de Detalii */}
                <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <Link
                    href={`/hotels/${hotel.id}`}
                    className="w-full py-3.5 px-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-mono text-xs font-semibold uppercase tracking-widest flex items-center justify-between group-hover:bg-amber-700 dark:group-hover:bg-amber-300 dark:group-hover:text-neutral-950 transition-all duration-200 border border-neutral-950 dark:border-white cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <span>{lang === "RO" ? "Vezi detalii" : "View details"}</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}