"use client";

import React, { useState, useEffect } from "react";
import { ArrowDown, Compass, Sparkles, Star, ShieldCheck, MapPin } from "lucide-react";

export default function HeroBanner() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      animationFrameId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollToAccommodations = () => {
    const element = document.getElementById("accommodations");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const imageTranslate = scrollY * 0.38;
  const imageScale = 1 + scrollY * 0.0004;
  const textTranslate = scrollY * 0.22;
  const textOpacity = Math.max(0, 1 - scrollY / 550);
  const floatingCardLeft = scrollY * -0.18;
  const floatingCardRight = scrollY * 0.12;

  return (
    <section className="relative w-full overflow-hidden bg-[#F4F1EA] dark:bg-[#0D0E11] text-neutral-900 dark:text-white min-h-[90vh] flex flex-col justify-between transition-colors duration-300">
      {/* Background Image cu Parallax */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="w-full h-full will-change-transform transition-transform duration-75 ease-out"
          style={{
            transform: `translate3d(0, ${imageTranslate}px, 0) scale(${imageScale})`,
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=90"
            alt="Luxury architectural stay"
            className="w-full h-full object-cover object-center opacity-30 dark:opacity-40"
          />
        </div>

        {/* Gradiente dinamice adaptate pentru Light și Dark mode */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F4F1EA] via-[#F4F1EA]/60 to-transparent dark:from-[#0D0E11] dark:via-[#0D0E11]/60 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4F1EA]/90 via-transparent to-[#F4F1EA]/90 dark:from-[#0D0E11]/80 dark:via-transparent dark:to-[#0D0E11]/80" />
      </div>

      {/* Floating Badges cu geometrie arhitecturală */}
      <div
        className="hidden lg:flex absolute top-32 right-12 xl:right-24 z-20 items-center gap-3.5 p-4 bg-white/95 dark:bg-[#14171E]/90 backdrop-blur-xl border border-neutral-300 dark:border-white/15 shadow-2xl transition-transform duration-100 ease-out will-change-transform text-neutral-900 dark:text-white"
        style={{
          transform: `translate3d(0, ${floatingCardLeft}px, 0)`,
          opacity: textOpacity,
        }}
      >
        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-300">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500 dark:fill-amber-300 dark:text-amber-300" />
        </div>
        <div>
          <div className="text-xs font-bold tracking-wide flex items-center gap-2">
            <span>4.96 / 5.0</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono tracking-widest">[ VERIFICAT ]</span>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-sans mt-0.5">
            Peste 1.400 de recenzii autentice
          </p>
        </div>
      </div>

      <div
        className="hidden lg:flex absolute bottom-36 right-16 xl:right-32 z-20 items-center gap-3 p-3.5 bg-white/95 dark:bg-[#14171E]/90 backdrop-blur-xl border border-neutral-300 dark:border-white/15 shadow-xl transition-transform duration-100 ease-out will-change-transform text-neutral-900 dark:text-white"
        style={{
          transform: `translate3d(0, ${floatingCardRight}px, 0)`,
          opacity: textOpacity,
        }}
      >
        <div className="w-7 h-7 bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-amber-700 dark:text-amber-200">
          <MapPin className="w-3.5 h-3.5" />
        </div>
        <div className="text-xs font-mono tracking-wider uppercase">
          Locații de Top • România
        </div>
      </div>

      {/* Conținut Principal */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-16 flex flex-col justify-between flex-1 will-change-transform transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(0, ${textTranslate}px, 0)`,
          opacity: textOpacity,
        }}
      >
        {/* Kicker Editorial */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-[0.2em] bg-amber-500/10 text-amber-800 border border-amber-500/30 dark:bg-white/10 dark:text-amber-300 dark:border-white/20 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-300" />
            <span>Colecție Exclusivă • 2026</span>
          </div>
          <span className="text-neutral-500 dark:text-neutral-400 text-xs tracking-wider uppercase font-mono hidden sm:inline-block">
            [ 01 / PORTFOLIO ]
          </span>
        </div>

        {/* Titlu Dinamic */}
        <div className="max-w-4xl space-y-6 my-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-normal tracking-tight text-neutral-950 dark:text-white leading-[1.08]">
            Arhitectură, Liniște &amp;{" "}
            <span className="italic font-light text-amber-800 dark:text-amber-200 block sm:inline">
              Ospitalitate Distinctă.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 font-sans font-normal max-w-2xl leading-relaxed text-balance">
            O selecție editorială de boutique hoteluri, conace restaurate și apartamente urbane cu design contemporan. Fiecare destinație este aleasă cu atenție pentru o experiență memorabilă.
          </p>

          {/* Buton cu linii geometrice drepte */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={scrollToAccommodations}
              className="inline-flex items-center gap-3 px-8 py-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold text-xs uppercase tracking-[0.2em] hover:bg-neutral-800 dark:hover:bg-amber-300 dark:hover:text-neutral-950 active:scale-[0.99] transition-all duration-200 shadow-xl shadow-black/10 dark:shadow-black/40 group cursor-pointer border border-neutral-950 dark:border-white"
            >
              <Compass className="w-4 h-4 text-white dark:text-neutral-900 group-hover:rotate-45 transition-transform duration-300" />
              <span>Explorează Hotelurile</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>

            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
              [ scroll în jos pentru listă ↓ ]
            </span>
          </div>
        </div>

        {/* Ticker Bar cu grilă geometrică */}
        <div className="pt-10 mt-8 border-t border-neutral-300 dark:border-white/15 grid grid-cols-2 md:grid-cols-4 gap-6 text-neutral-800 dark:text-neutral-300">
          <div className="space-y-1.5 pl-3 border-l border-amber-600 dark:border-amber-400/40">
            <div className="text-[10px] uppercase font-mono tracking-widest text-amber-800 dark:text-amber-300/90 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>01 / Selecție</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-neutral-950 dark:text-white">100% Verificate Manual</div>
          </div>
          <div className="space-y-1.5 pl-3 border-l border-neutral-300 dark:border-white/20">
            <div className="text-[10px] uppercase font-mono tracking-widest text-amber-800 dark:text-amber-300/90 font-bold">02 / Calitate</div>
            <div className="text-xs sm:text-sm font-medium text-neutral-950 dark:text-white">Standarde Premium</div>
          </div>
          <div className="space-y-1.5 pl-3 border-l border-neutral-300 dark:border-white/20">
            <div className="text-[10px] uppercase font-mono tracking-widest text-amber-800 dark:text-amber-300/90 font-bold">03 / Flexibilitate</div>
            <div className="text-xs sm:text-sm font-medium text-neutral-950 dark:text-white">Rezervare Directă</div>
          </div>
          <div className="space-y-1.5 pl-3 border-l border-neutral-300 dark:border-white/20">
            <div className="text-[10px] uppercase font-mono tracking-widest text-amber-800 dark:text-amber-300/90 font-bold">04 / Destinații</div>
            <div className="text-xs sm:text-sm font-medium text-neutral-950 dark:text-white">Orașe & Zone Montane</div>
          </div>
        </div>
      </div>
    </section>
  );
}
