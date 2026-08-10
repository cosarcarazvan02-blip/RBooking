import React from "react";
import LoginForm from "@/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autentificare — RBooking",
  description: "Acces securizat pentru clienți, manageri de hotel și administratori.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100">
      <LoginForm />
    </main>
  );
}
