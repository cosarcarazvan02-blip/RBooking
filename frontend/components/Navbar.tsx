"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { LogIn, LogOut, User as UserIcon, Shield, Hotel } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface CurrentUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
}

interface NavbarProps {
  role?: string;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("auth-state-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("auth-state-change", callback);
  };
}

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("currentUser");
}

function getServerSnapshot(): string | null {
  return null;
}

export default function Navbar({ role: propRole }: NavbarProps = {}) {
  const userJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let currentUser: CurrentUser | null = null;
  if (userJson) {
    try {
      currentUser = JSON.parse(userJson);
    } catch {
      currentUser = null;
    }
  } else if (propRole) {
    currentUser = {
      id: "mock-id",
      email: `${propRole}@booking.com`,
      firstName: propRole.charAt(0).toUpperCase() + propRole.slice(1),
      role: propRole,
    };
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    window.dispatchEvent(new Event("auth-state-change"));
    window.dispatchEvent(new Event("storage"));
  };

  const getRoleIcon = (role?: string) => {
    const r = role?.toLowerCase();
    if (r === "admin") return <Shield className="w-3.5 h-3.5 text-amber-500" />;
    if (r === "operator" || r === "manager") return <Hotel className="w-3.5 h-3.5 text-sky-500" />;
    return <UserIcon className="w-3.5 h-3.5 text-emerald-500" />;
  };

  const getUserDisplayName = () => {
    if (!currentUser) return "";
    if (currentUser.firstName) {
      return `${currentUser.firstName} ${currentUser.lastName || ""}`.trim();
    }
    return currentUser.email.split("@")[0];
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 dark:border-white/10 bg-white/30 dark:bg-[#0D0E11]/30 backdrop-blur-[6px] text-neutral-900 dark:text-white transition-colors duration-200 isolate transform-gpu">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-9 h-9 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-serif font-bold text-lg shadow-sm group-hover:bg-amber-600 dark:group-hover:bg-amber-300 transition-colors">
            R
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl tracking-tight font-medium text-neutral-950 dark:text-white">
              RBooking
            </span>
            <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-500 dark:text-neutral-400 font-mono -mt-0.5">
              Hospitality
            </span>
          </div>
        </Link>

        {/* Navigation & Auth Section */}
        <nav className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {currentUser ? (
            /* Logged In State */
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Profile Card */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/85 dark:bg-white/10 border border-neutral-300 dark:border-white/20 shadow-xs">
                <div className="w-7 h-7 bg-neutral-100 dark:bg-white/10 flex items-center justify-center border border-neutral-200 dark:border-white/10">
                  {getRoleIcon(currentUser.role)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-neutral-950 dark:text-white leading-tight max-w-[120px] sm:max-w-[180px] truncate">
                    {getUserDisplayName()}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-300">
                    [{currentUser.role || "Client"}]
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-red-600/10 hover:bg-red-600 text-red-700 hover:text-white dark:bg-red-500/15 dark:hover:bg-red-600 dark:text-red-300 dark:hover:text-white transition-all border border-red-300 dark:border-red-500/30 cursor-pointer shadow-xs active:scale-95"
                title="Deconectare din cont"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ieșire</span>
              </button>
            </div>
          ) : (
            /* Logged Out State */
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-amber-300 dark:hover:text-neutral-950 transition-all border border-neutral-950 dark:border-white active:scale-95 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Autentificare</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}