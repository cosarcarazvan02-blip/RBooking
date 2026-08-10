"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, ArrowUpRight, Compass, X, Database, RefreshCw } from "lucide-react";
import { Accommodation } from "@/types";
import { getActiveApiKey } from "@/lib/apiKey";



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
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFromDatabase, setIsFromDatabase] = useState<boolean>(false);

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

  // Filter options
  const cities = useMemo(() => {
    const set = new Set<string>();
    accommodations.forEach((acc) => {
      if (acc.city) set.add(acc.city);
    });
    return ["All", ...Array.from(set)];
  }, [accommodations]);

  const accommodationTypes = ["All", "Hotel", "Apartment", "Hostel"];

  // Filtered accommodations
  const filteredAccommodations = useMemo(() => {
    return accommodations.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.city && item.city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedType === "All" ||
        item.accommodationType?.toLowerCase() === selectedType.toLowerCase();

      const matchesCity =
        selectedCity === "All" ||
        (item.city && item.city.toLowerCase() === selectedCity.toLowerCase());

      return matchesSearch && matchesType && matchesCity;
    });
  }, [accommodations, searchQuery, selectedType, selectedCity]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("All");
    setSelectedCity("All");
  };

  const hasActiveFilters =
    searchQuery !== "" || selectedType !== "All" || selectedCity !== "All";

  return (
    <section id="accommodations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-neutral-300 dark:border-neutral-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono font-semibold tracking-[0.25em] uppercase text-amber-700 dark:text-amber-300">
              [ 02 / ACCOMMODATIONS ]
            </span>
            {isClient && isFromDatabase ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <Database className="w-3 h-3" />
                <span>Live PostgreSQL DB</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
                <span>Colecție Curată</span>
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-neutral-950 dark:text-white tracking-tight">
            Accommodations
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
          <button
            onClick={() => void reloadData()}
            disabled={!isClient ? false : isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Reîmprospătează datele din baza de date"
          >
            <RefreshCw className={`w-3 h-3 ${isClient && isLoading ? "animate-spin" : ""}`} />
            <span>Reîncarcă DB</span>
          </button>
          <span>
            {filteredAccommodations.length}{" "}
            {filteredAccommodations.length === 1 ? "opțiune" : "opțiuni găsite"}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#121418] border border-neutral-300 dark:border-neutral-800 p-6 mb-12 shadow-xs transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută după nume hotel sau locație..."
              className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white border border-neutral-300 dark:border-neutral-800 font-sans transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* City Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white font-sans transition-all cursor-pointer"
            >
              {cities.map((city) => (
                <option key={city} value={city} className="bg-white dark:bg-[#181a20]">
                  {city === "All" ? "Toate Orașele" : city}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter Buttons */}
          <div className="md:col-span-3 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {accommodationTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-all duration-150 whitespace-nowrap cursor-pointer flex-1 text-center border ${
                  selectedType === type
                    ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-neutral-950 dark:border-white font-bold"
                    : "bg-neutral-50 dark:bg-[#181a20] text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800 hover:border-neutral-500"
                }`}
              >
                {type === "All" ? "Toate" : type}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-neutral-500 dark:text-neutral-400 uppercase">Filtre active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  „{searchQuery}”
                </span>
              )}
              {selectedCity !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                  Oraș: {selectedCity}
                </span>
              )}
              {selectedType !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                  Tip: {selectedType}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-amber-800 dark:text-amber-300 hover:underline uppercase tracking-wider font-semibold cursor-pointer"
            >
              [ Resetează ]
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
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
        <div className="text-center py-20 bg-white dark:bg-[#121418] border border-neutral-300 dark:border-neutral-800 p-8">
          <Compass className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
          <h3 className="text-xl font-serif text-neutral-900 dark:text-white mb-2">
            Nicio cazare găsită
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
            Nu există nicio cazare care să corespundă criteriilor sau baza de date este goală. Puteți adăuga cazări noi direct din Swagger UI (/swagger).
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest border border-neutral-950 dark:border-white cursor-pointer"
            >
              Resetează Filtrele
            </button>
          )}
        </div>
      ) : (
        /* Hotel Cards Grid (Strict: Imagine, Nume, Locatie, Buton Detalii) */
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
              </div>

              {/* 2. Informații: Strict Nume & Locație */}
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
                    <span>Vezi detalii</span>
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
