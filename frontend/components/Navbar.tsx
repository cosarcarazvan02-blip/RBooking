"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LogIn, LogOut, User as UserIcon, Shield, Hotel, Key, Check, X, Eye, EyeOff, RefreshCw } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { getActiveApiKey, setActiveApiKey, DEFAULT_API_KEY } from "@/lib/apiKey";

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

function subscribeAuth(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("auth-state-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("auth-state-change", callback);
  };
}

function getAuthSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("currentUser");
}

function subscribeApiKey(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("api-key-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("api-key-change", callback);
  };
}

function getApiKeySnapshot(): string {
  return getActiveApiKey();
}

function getServerSnapshotNull(): string | null {
  return null;
}

function getServerSnapshotDefault(): string {
  return DEFAULT_API_KEY;
}

export default function Navbar({ role: propRole }: NavbarProps = {}) {
  const userJson = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerSnapshotNull);
  const currentApiKey = useSyncExternalStore(subscribeApiKey, getApiKeySnapshot, getServerSnapshotDefault);

  // Modal State for API Key
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "valid" | "invalid">("idle");
  const [testMessage, setTestMessage] = useState("");

  const handleOpenModal = () => {
    setInputKey(currentApiKey);
    setTestStatus("idle");
    setTestMessage("");
    setIsKeyModalOpen(true);
  };

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

  const handleSaveKey = () => {
    setActiveApiKey(inputKey);
    setTestStatus("valid");
    setTestMessage("Cheia API a fost salvată și activată cu succes!");
    setTimeout(() => {
      setIsKeyModalOpen(false);
      setTestStatus("idle");
      setTestMessage("");
    }, 900);
  };

  const handleResetDefaultKey = () => {
    setInputKey(DEFAULT_API_KEY);
    setActiveApiKey(DEFAULT_API_KEY);
    setTestStatus("valid");
    setTestMessage("Restabilit la cheia API implicită din 2026.");
  };

  const handleTestKey = async () => {
    setTestStatus("testing");
    setTestMessage("Se verifică cheia cu backend-ul...");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5293/api";
      const res = await fetch(`${apiUrl}/Accommodations?PageNumber=1&PageSize=1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": inputKey.trim(),
        },
      });

      if (res.ok) {
        setTestStatus("valid");
        setTestMessage("✓ Conexiune reușită! Cheia API este validă.");
      } else {
        setTestStatus("invalid");
        setTestMessage(`✕ Acces respins (${res.status}). Cheia API este incorectă.`);
      }
    } catch {
      setTestStatus("invalid");
      setTestMessage("✕ Nu s-a putut conecta la serverul backend (http://localhost:5293).");
    }
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
    <>
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
          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Buton Cheie API */}
            <button
              onClick={handleOpenModal}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Setează sau modifică cheia API"
            >
              <Key className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
              <span className="hidden md:inline">Cheie API</span>
              <span className="text-[10px] opacity-75 font-mono">
                {currentApiKey ? `[•••${currentApiKey.slice(-4)}]` : "[Setează]"}
              </span>
            </button>

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

      {/* Modal Configurare Cheie API */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#131519] border border-neutral-300 dark:border-neutral-800 w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif text-neutral-900 dark:text-white font-medium">
                  Configurare Cheie API
                </h3>
                <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                  [ Header: X-Api-Key ]
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-5 leading-relaxed">
              Introduceți cheia API de securitate pentru a autoriza cererile frontend către backend-ul .NET și baza de date PostgreSQL.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Valoare Cheie API
                </label>
                <div className="relative">
                  <input
                    type={showKeyText ? "text" : "password"}
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value);
                      setTestStatus("idle");
                    }}
                    placeholder="RBooking_Secret_ApiKey_..."
                    className="w-full pl-3 pr-11 py-2.5 bg-neutral-50 dark:bg-[#181a20] text-xs font-mono text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {testMessage && (
                <div
                  className={`p-3 text-xs font-mono flex items-center gap-2 border ${
                    testStatus === "valid"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : testStatus === "invalid"
                      ? "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                      : "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  {testStatus === "testing" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {testStatus === "valid" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  {testStatus === "invalid" && <X className="w-3.5 h-3.5 text-red-600" />}
                  <span>{testMessage}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="flex-1 py-2.5 px-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest font-semibold border border-neutral-950 dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer text-center"
                >
                  Salvează &amp; Aplică
                </button>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testStatus === "testing" || !inputKey.trim()}
                  className="py-2.5 px-4 border border-neutral-300 dark:border-neutral-800 text-xs font-mono uppercase tracking-widest text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                >
                  Test Conexiune
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-[11px] font-mono">
                <span className="text-neutral-400">Cheie prestabilită:</span>
                <button
                  type="button"
                  onClick={handleResetDefaultKey}
                  className="text-amber-700 dark:text-amber-300 hover:underline uppercase tracking-wider"
                >
                  [ Încarcă Cheia Default 2026 ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}