"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, ArrowUpRight, Compass, X } from "lucide-react";
import { Accommodation } from "@/types";

const CURATED_ACCOMMODATIONS: Accommodation[] = [
  {
    id: "1",
    name: "Grand Hotel Continental",
    location: "Calea Victoriei 56, București",
    city: "București",
    country: "România",
    accommodationType: "Hotel",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "2",
    name: "Kronwell Alpine Retreat",
    location: "Bulevardul Gării 7A, Brașov",
    city: "Brașov",
    country: "România",
    accommodationType: "Hotel",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "3",
    name: "Platinia Modern Suites",
    location: "Calea Mănăștur 2-6, Cluj-Napoca",
    city: "Cluj-Napoca",
    country: "România",
    accommodationType: "Apartment",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "4",
    name: "Atelier Historic Loft",
    location: "Piața Mică 12, Sibiu",
    city: "Sibiu",
    country: "România",
    accommodationType: "Apartment",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "5",
    name: "Botanica Residence & Spa",
    location: "Strada Republicii 44, Oradea",
    city: "Oradea",
    country: "România",
    accommodationType: "Hotel",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "6",
    name: "Urban Nomads Boutique Hostel",
    location: "Strada Potaissa 13, Cluj-Napoca",
    city: "Cluj-Napoca",
    country: "România",
    accommodationType: "Hostel",
    imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=85",
  },
];

interface AccommodationsProps {
  initialAccommodations?: Accommodation[];
}

export default function Accommodations({
  initialAccommodations = CURATED_ACCOMMODATIONS,
}: AccommodationsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedCity, setSelectedCity] = useState<string>("All");

  const cities = useMemo(() => {
    const set = new Set<string>();
    initialAccommodations.forEach((item) => {
      if (item.city) set.add(item.city);
    });
    return ["All", ...Array.from(set)];
  }, [initialAccommodations]);

  const filteredItems = useMemo(() => {
    return initialAccommodations.filter((item) => {
      const matchText =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType =
        selectedType === "All" ||
        item.accommodationType?.toLowerCase() === selectedType.toLowerCase();

      const matchCity =
        selectedCity === "All" ||
        item.city?.toLowerCase() === selectedCity.toLowerCase();

      return matchText && matchType && matchCity;
    });
  }, [initialAccommodations, searchQuery, selectedType, selectedCity]);

  const hasActiveFilters = searchQuery !== "" || selectedType !== "All" || selectedCity !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("All");
    setSelectedCity("All");
  };

  return (
    <section
      id="accommodations"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-6"
    >
      {/* Editorial Header cu linii drepte */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-neutral-300 dark:border-neutral-800 gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-[0.25em] uppercase text-neutral-500 dark:text-neutral-400">
            <span className="w-2 h-2 bg-amber-600 dark:bg-amber-400"></span>
            <span>Portofoliu Selecționat</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-neutral-900 dark:text-neutral-50">
            Accommodations
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed">
            O colecție de spații rafinate, boutique hoteluri și apartamente contemporane alese pentru arhitectură și confort.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-neutral-100 dark:bg-[#15171C] text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-800">
            <span className="font-bold text-neutral-950 dark:text-white mr-1.5">
              {filteredItems.length}
            </span>
            {filteredItems.length === 1 ? "proprietate" : "proprietăți"}
          </div>
        </div>
      </div>

      {/* Modern Refined Search Console (Geometric & Sharp) */}
      <div className="mb-14 bg-white dark:bg-[#121418] border border-neutral-300 dark:border-neutral-800 p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută după nume, adresă sau oraș..."
              className="w-full pl-11 pr-8 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-all font-sans border border-neutral-200 dark:border-neutral-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* City Dropdown */}
          <div className="lg:col-span-3 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full pl-11 pr-8 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-all font-sans appearance-none cursor-pointer border border-neutral-200 dark:border-neutral-800"
            >
              <option value="All">Toate destinațiile</option>
              {cities
                .filter((c) => c !== "All")
                .map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs font-mono">
              ▼
            </div>
          </div>

          {/* Type Filter Buttons (Sharp Geometric Blocks) */}
          <div className="lg:col-span-3 flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-[#181a20] border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
            {[
              { label: "Toate", val: "All" },
              { label: "Hotel", val: "Hotel" },
              { label: "Apartament", val: "Apartment" },
              { label: "Hostel", val: "Hostel" },
            ].map(({ label, val }) => {
              const isActive = selectedType === val;
              return (
                <button
                  key={val}
                  onClick={() => setSelectedType(val)}
                  className={`flex-1 min-w-[60px] py-2 px-2 text-xs font-mono uppercase tracking-wider transition-all text-center ${
                    isActive
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-neutral-400 uppercase tracking-wider">Filtre:</span>
              {searchQuery && (
                <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
                  &ldquo;{searchQuery}&rdquo;
                </span>
              )}
              {selectedCity !== "All" && (
                <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
                  {selectedCity}
                </span>
              )}
              {selectedType !== "All" && (
                <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
                  {selectedType}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-neutral-900 dark:text-white hover:underline underline-offset-4 cursor-pointer"
            >
              [ Resetează ]
            </button>
          </div>
        )}
      </div>

      {/* Accommodations Grid (Strictly Image, Name, Location & Details Button) */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-24 px-4 border border-dashed border-neutral-300 dark:border-neutral-800 bg-white/40 dark:bg-[#121418]/40">
          <Compass className="w-10 h-10 mx-auto text-neutral-400 mb-3 stroke-[1.2]" />
          <h3 className="text-lg font-serif text-neutral-900 dark:text-neutral-100">
            Nicio locație nu corespunde criteriilor
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Încearcă să extinzi căutarea sau să selectezi o altă destinație.
          </p>
          <button
            onClick={clearFilters}
            className="mt-6 px-6 py-3 text-xs font-mono uppercase tracking-wider bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
          >
            Șterge filtrele
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-9">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col bg-white dark:bg-[#131519] border border-neutral-300 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Image Frame with Type Badge */}
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <img
                  src={
                    item.imageUrl ||
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85"
                  }
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {item.accommodationType && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-widest bg-black/85 text-white border border-white/20">
                      {item.accommodationType}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body: Name, Location, Button */}
              <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between gap-6">
                <div className="space-y-2.5">
                  <h3 className="text-xl sm:text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-50 tracking-tight leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors line-clamp-1">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                    <span className="line-clamp-1 font-normal tracking-tight">
                      {item.location}
                    </span>
                  </div>
                </div>

                {/* Details Button with Geometric Minimal Styling */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <Link
                    href={`/accommodations/${item.id}`}
                    className="inline-flex items-center justify-between w-full py-3 px-4 bg-neutral-100 dark:bg-[#1a1d24] group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-semibold tracking-wider uppercase transition-all duration-200 border border-neutral-300 dark:border-neutral-700"
                  >
                    <span>Vezi detalii</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
