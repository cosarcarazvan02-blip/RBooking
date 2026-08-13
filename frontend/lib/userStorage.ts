// Helper library to manage Favorites (Wishlist) and Reservations strictly PER USER
import { getActiveApiKey } from '@/lib/apiKey';

export interface FavoriteItem {
  id: string;
  name: string;
  location: string;
  city?: string;
  country?: string;
  pricePerNight: number;
  imageUrl: string;
  accommodationType?: string;
  averageRating?: number;
  savedAt?: string;
}

export interface ReservationItem {
  id: string;
  accommodationId?: string;
  hotelId?: string;
  hotelName: string;
  location: string;
  dates: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  imageUrl: string;
  type: 'current' | 'past';
  totalPrice?: number;
  guests?: number;
  userId?: string;
  userEmail?: string;
  createdAt?: string;
}

function isGuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
  if (!rawToken) return null;
  return rawToken.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '').trim();
}

/**
 * Returns a unique storage identifier key for the current active user or 'guest'
 */
export function getCurrentUserStorageKey(): string {
  if (typeof window === 'undefined') return 'guest';

  try {
    const profile = localStorage.getItem('rbooking_user_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      const id = parsed.id || parsed.Id;
      const email = parsed.email || parsed.Email;
      if (id) return `user_${id.toLowerCase()}`;
      if (email) return `user_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      const id = parsed.id || parsed.Id;
      const email = parsed.email || parsed.Email;
      if (id) return `user_${id.toLowerCase()}`;
      if (email) return `user_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
  } catch (e) {
    console.error('Error parsing user storage key:', e);
  }

  return 'guest';
}

/**
 * Get the current user's profile info (or null if guest)
 */
export function getCurrentUserProfile(): { id?: string; email?: string; name?: string; role?: string } | null {
  if (typeof window === 'undefined') return null;

  try {
    const profile = localStorage.getItem('rbooking_user_profile');
    if (profile) return JSON.parse(profile);

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) return JSON.parse(currentUser);
  } catch (e) {
    console.error(e);
  }
  return null;
}

/* =========================================================================
   FAVORITES / WISHLIST PER USER (SYNCHRONIZED WITH POSTGRESQL DB)
   ========================================================================= */

export function getUserFavorites(specificUserKey?: string): FavoriteItem[] {
  if (typeof window === 'undefined') return [];

  const userKey = specificUserKey || getCurrentUserStorageKey();
  const storageKey = `rbooking_favorites_${userKey}`;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }

    // Migration fallback for legacy unpartitioned favorites
    if (userKey !== 'guest') {
      const legacy = localStorage.getItem('rbooking_favorites');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(parsed));
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Error loading favorites:', e);
  }

  return [];
}

export function setUserFavorites(favorites: FavoriteItem[], specificUserKey?: string): void {
  if (typeof window === 'undefined') return;

  const userKey = specificUserKey || getCurrentUserStorageKey();
  const storageKey = `rbooking_favorites_${userKey}`;

  localStorage.setItem(storageKey, JSON.stringify(favorites));
  // Keep legacy synced for backwards compatibility
  localStorage.setItem('rbooking_favorites', JSON.stringify(favorites));
  window.dispatchEvent(new Event('rbooking_favorites_change'));
}

/**
 * Sincronizează favoritele din tabela `Wishlist` din PostgreSQL în mod asincron
 */
export async function syncUserWishlistFromDb(): Promise<FavoriteItem[]> {
  if (typeof window === 'undefined') return [];

  const token = getAuthToken();
  const profile = getCurrentUserProfile();
  if (!token && !profile?.id) return getUserFavorites();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
  const apiKey = getActiveApiKey();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (apiKey) headers['X-Api-Key'] = apiKey;

    const url = token
      ? `${apiUrl}/Wishlist`
      : profile?.id && isGuid(profile.id)
      ? `${apiUrl}/Wishlist/user/${profile.id}`
      : null;

    if (!url) return getUserFavorites();

    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        interface RawWishlistDto {
          accommodationId?: string;
          id?: string;
          accommodationName?: string;
          name?: string;
          location?: string;
          city?: string;
          country?: string;
          pricePerNight?: number;
          imageUrl?: string;
          accommodationType?: string;
          averageRating?: number;
          createdAt?: string;
        }
        const items: FavoriteItem[] = data.map((item: RawWishlistDto) => ({
          id: item.accommodationId || item.id || '',
          name: item.accommodationName || item.name || 'Cazare',
          location: item.location || `${item.city || ''}, ${item.country || ''}`,
          city: item.city,
          country: item.country,
          pricePerNight: item.pricePerNight || 150,
          imageUrl:
            item.imageUrl ||
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          accommodationType: item.accommodationType || 'Hotel',
          averageRating: item.averageRating,
          savedAt: item.createdAt || new Date().toISOString(),
        }));

        setUserFavorites(items);
        return items;
      }
    }
  } catch (err) {
    console.error('Failed to sync wishlist from database:', err);
  }

  return getUserFavorites();
}

export function isAccommodationFavorited(accommodationId: string, specificUserKey?: string): boolean {
  if (!accommodationId) return false;
  const favs = getUserFavorites(specificUserKey);
  return favs.some((item) => item.id === accommodationId);
}

export function toggleUserFavorite(item: FavoriteItem, specificUserKey?: string): { isSaved: boolean; count: number } {
  const current = getUserFavorites(specificUserKey);
  const exists = current.some((f) => f.id === item.id);

  let updated: FavoriteItem[];
  if (exists) {
    updated = current.filter((f) => f.id !== item.id);
  } else {
    updated = [{ ...item, savedAt: new Date().toISOString() }, ...current];
  }

  setUserFavorites(updated, specificUserKey);

  // Sincronizare automată asincronă cu tabela Wishlist din baza de date
  if (typeof window !== 'undefined') {
    const token = getAuthToken();
    const apiKey = getActiveApiKey();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';

    if (token && isGuid(item.id)) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      if (!exists) {
        // Adaugă în Wishlist în baza de date
        fetch(`${apiUrl}/Wishlist`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ accommodationId: item.id }),
        }).catch((err) => console.error('Error adding to wishlist in db:', err));
      } else {
        // Șterge din Wishlist în baza de date
        fetch(`${apiUrl}/Wishlist/${item.id}`, {
          method: 'DELETE',
          headers,
        }).catch((err) => console.error('Error removing from wishlist in db:', err));
      }
    }
  }

  return { isSaved: !exists, count: updated.length };
}

export function removeUserFavorite(accommodationId: string, specificUserKey?: string): void {
  const current = getUserFavorites(specificUserKey);
  const updated = current.filter((f) => f.id !== accommodationId);
  setUserFavorites(updated, specificUserKey);

  // Șterge din Wishlist în baza de date
  if (typeof window !== 'undefined') {
    const token = getAuthToken();
    const apiKey = getActiveApiKey();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';

    if (token && isGuid(accommodationId)) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      fetch(`${apiUrl}/Wishlist/${accommodationId}`, {
        method: 'DELETE',
        headers,
      }).catch((err) => console.error('Error removing favorite from db:', err));
    }
  }
}

/* =========================================================================
   RESERVATIONS PER USER & DELETION TRACKING
   ========================================================================= */

export function getDeletedReservationIds(specificUserKey?: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const userKey = specificUserKey || getCurrentUserStorageKey();
  try {
    const saved = localStorage.getItem(`rbooking_deleted_reservations_${userKey}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {
    console.error(e);
  }
  return new Set();
}

export function trackDeletedReservationId(reservationId: string, specificUserKey?: string): void {
  if (typeof window === 'undefined' || !reservationId) return;
  const userKey = specificUserKey || getCurrentUserStorageKey();
  const deletedSet = getDeletedReservationIds(userKey);
  deletedSet.add(reservationId);
  localStorage.setItem(`rbooking_deleted_reservations_${userKey}`, JSON.stringify(Array.from(deletedSet)));
}

export function getUserReservations(specificUserKey?: string): ReservationItem[] {
  if (typeof window === 'undefined') return [];

  const userKey = specificUserKey || getCurrentUserStorageKey();
  const storageKey = `rbooking_reservations_${userKey}`;
  const deletedIds = getDeletedReservationIds(userKey);

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((r: ReservationItem) => !deletedIds.has(r.id));
      }
    }

    // Migration fallback for legacy unpartitioned reservations
    if (userKey !== 'guest') {
      const legacy = localStorage.getItem('rbooking_user_reservations');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((r: ReservationItem) => !deletedIds.has(r.id));
          localStorage.setItem(storageKey, JSON.stringify(filtered));
          return filtered;
        }
      }
    }
  } catch (e) {
    console.error('Error loading reservations:', e);
  }

  return [];
}

export function setUserReservations(reservations: ReservationItem[], specificUserKey?: string): void {
  if (typeof window === 'undefined') return;

  const userKey = specificUserKey || getCurrentUserStorageKey();
  const storageKey = `rbooking_reservations_${userKey}`;
  const deletedIds = getDeletedReservationIds(userKey);
  const activeReservations = reservations.filter((r) => !deletedIds.has(r.id));

  localStorage.setItem(storageKey, JSON.stringify(activeReservations));
  // Keep legacy synced for backward compatibility
  localStorage.setItem('rbooking_user_reservations', JSON.stringify(activeReservations));
  window.dispatchEvent(new Event('rbooking_reservations_change'));
}

export function addUserReservation(reservation: ReservationItem, specificUserKey?: string): void {
  const current = getUserReservations(specificUserKey);
  const updated = [reservation, ...current.filter((r) => r.id !== reservation.id)];
  setUserReservations(updated, specificUserKey);
}

export function removeUserReservation(reservationId: string, specificUserKey?: string): void {
  const userKey = specificUserKey || getCurrentUserStorageKey();
  trackDeletedReservationId(reservationId, userKey);
  const current = getUserReservations(userKey);
  const updated = current.filter((r) => r.id !== reservationId);
  setUserReservations(updated, userKey);
}
