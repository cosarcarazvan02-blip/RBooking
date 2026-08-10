export const DEFAULT_API_KEY = "RBooking_Secret_ApiKey_2026_x9k2M!";

export function getActiveApiKey(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_KEY || DEFAULT_API_KEY;
  }
  const stored = localStorage.getItem("rbooking_api_key");
  if (stored && stored.trim()) {
    return stored.trim();
  }
  return process.env.NEXT_PUBLIC_API_KEY || DEFAULT_API_KEY;
}

export function setActiveApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (!trimmed) {
    localStorage.removeItem("rbooking_api_key");
  } else {
    localStorage.setItem("rbooking_api_key", trimmed);
  }
  window.dispatchEvent(new Event("api-key-change"));
  window.dispatchEvent(new Event("storage"));
}
