import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RBooking — Curated Stays & Boutique Hospitality",
  description: "Discover curated hotels, luxury apartments and architectural stays across the country.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                const saved = localStorage.getItem('rbooking_theme');
                if (saved === 'dark' || (!saved && !window.matchMedia('(prefers-color-scheme: light)').matches)) {
                  document.documentElement.classList.add('dark');
                } else if (saved === 'light') {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#FBFBF9] text-[#1A1A1A] dark:bg-[#0D0E11] dark:text-[#F3F4F6] selection:bg-[#1A1A1A] selection:text-[#FBFBF9] dark:selection:bg-[#F3F4F6] dark:selection:text-[#0D0E11]">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}