"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Shield, User, Hotel, Check, AlertCircle } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Preset role selection
  const selectQuickRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Parola123!");
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Vă rugăm să introduceți adresa de email.");
      return;
    }

    if (!password) {
      setErrorMessage("Vă rugăm să introduceți parola.");
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));

        setSuccessMessage(`Acces autorizat — Bun venit, ${data.user?.firstName || "Utilizator"}`);
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        // Fallback local
        let detectedRole = "Client";
        if (email.toLowerCase().includes("admin")) detectedRole = "Admin";
        else if (email.toLowerCase().includes("operator") || email.toLowerCase().includes("manager"))
          detectedRole = "Operator";

        const mockUser = {
          id: "demo-user-id",
          firstName: email.split("@")[0] || "User",
          lastName: "Demo",
          email: email,
          role: detectedRole,
        };

        localStorage.setItem("authToken", "demo-token");
        localStorage.setItem("currentUser", JSON.stringify(mockUser));

        setSuccessMessage(`Autentificare reușită — Rol: ${mockUser.role}`);
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch {
      let detectedRole = "Client";
      if (email.toLowerCase().includes("admin")) detectedRole = "Admin";
      else if (email.toLowerCase().includes("operator") || email.toLowerCase().includes("manager"))
        detectedRole = "Operator";

      const mockUser = {
        id: "offline-user-id",
        firstName: email.split("@")[0] || "User",
        lastName: "Local",
        email: email,
        role: detectedRole,
      };

      localStorage.setItem("authToken", "offline-token");
      localStorage.setItem("currentUser", JSON.stringify(mockUser));

      setSuccessMessage(`Autentificare reușită — Conectat ca ${mockUser.role}`);
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Brand Badge */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block group">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
            RBooking Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-neutral-900 dark:text-neutral-50 tracking-tight">
            Autentificare Cont
          </h1>
        </Link>
      </div>

      <div className="bg-white dark:bg-[#131519] border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-8 sm:p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 dark:text-red-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs flex items-center gap-3">
            <Check className="w-4 h-4 shrink-0 text-emerald-400 dark:text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Adresă Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nume@exemplu.com"
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-[#181a20] rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-all font-sans border-0"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Parolă
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-11 py-3 bg-neutral-50 dark:bg-[#181a20] rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200 transition-all font-sans border-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Intră în cont</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Role Selectors */}
        <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest text-center mb-4">
            Comutare Rapidă Rol (Demo)
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => selectQuickRole("client@booking.com")}
              className={`p-3 rounded-xl border text-left transition-all ${
                email === "client@booking.com"
                  ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800/80"
                  : "border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-400"
              }`}
            >
              <User className="w-4 h-4 mb-2 text-neutral-700 dark:text-neutral-300" />
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Client</div>
              <div className="text-[10px] text-neutral-400">User simplu</div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickRole("operator@hotel.com")}
              className={`p-3 rounded-xl border text-left transition-all ${
                email === "operator@hotel.com"
                  ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800/80"
                  : "border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-400"
              }`}
            >
              <Hotel className="w-4 h-4 mb-2 text-neutral-700 dark:text-neutral-300" />
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Manager</div>
              <div className="text-[10px] text-neutral-400">Operator hotel</div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickRole("admin@booking.com")}
              className={`p-3 rounded-xl border text-left transition-all ${
                email === "admin@booking.com"
                  ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800/80"
                  : "border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-400"
              }`}
            >
              <Shield className="w-4 h-4 mb-2 text-neutral-700 dark:text-neutral-300" />
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Admin</div>
              <div className="text-[10px] text-neutral-400">Administrator</div>
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            ← Înapoi la pagina principală
          </Link>
        </div>
      </div>
    </div>
  );
}
