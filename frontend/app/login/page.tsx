import React from "react";
import LoginForm from "@/components/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autentificare — RBooking",
  description: "Acces securizat pentru clienți, manageri de hotel și administratori.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-8 bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      {/* Top Header cu Logo și Theme Switcher */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-serif font-bold text-base shadow-sm">
            R
          </div>
          <span className="font-serif text-lg tracking-tight font-medium text-neutral-900 dark:text-white">
            RBooking
          </span>
        </Link>

        <ThemeToggle />
      </header>

      {/* Formularul de Login */}
      <div className="my-auto py-8">
        <LoginForm />
      </div>

      {/* Footer Minimal */}
      <footer className="text-center py-4 text-xs font-mono text-neutral-400">
        © {new Date().getFullYear()} RBooking Hospitality Platform
      </footer>
    </main>
  );
}
