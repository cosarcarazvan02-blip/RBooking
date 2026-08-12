'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Building2, Plus, Trash2, Edit, MapPin, Euro, X } from 'lucide-react';
import { getActiveApiKey } from '@/lib/apiKey';

const NO_PHOTO_PLACEHOLDER = 'https://www.tez-tour.ro/static/images/nophoto-hotel.png';

type AccommodationTypeOption = 'Hotel' | 'Apartment' | 'Hostel';

// Forma bruta primita de la GET /Accommodations - camelCase, cum serializeaza System.Text.Json.
interface RawAccommodationDto {
  id: string;
  name: string;
  location?: string;
  city?: string;
  country?: string;
  accommodationType?: string;
  imageUrl?: string;
  pricePerNight?: number;
  description?: string;
  stars?: number;
  hasPool?: boolean;
  hasRoomService?: boolean;
  totalRooms?: number;
  floorNumber?: number;
  hasElevator?: boolean;
  numberOfRooms?: number;
  isFurnished?: boolean;
  bedInSharedRoomPrice?: number;
  hasSharedKitchen?: boolean;
  totalBeds?: number;
}

// Model local, plat, folosit pentru afisare si pentru prefill la editare.
interface Accommodation {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  description: string;
  image: string;
  stars?: number;
  hasPool?: boolean;
  hasRoomService?: boolean;
  totalRooms?: number;
  floorNumber?: number;
  hasElevator?: boolean;
  numberOfRooms?: number;
  isFurnished?: boolean;
  bedInSharedRoomPrice?: number;
  hasSharedKitchen?: boolean;
  totalBeds?: number;
}

// Payload trimis la POST/PUT - aliniat exact cu CreateAccommodationDto din backend.
interface AccommodationPayload {
  name: string;
  description: string;
  location: string;
  city: string;
  country: string;
  pricePerNight: number;
  accommodationType: string;
  imageUrl?: string;
  stars?: number;
  hasPool?: boolean;
  hasRoomService?: boolean;
  totalRooms?: number;
  floorNumber?: number;
  hasElevator?: boolean;
  numberOfRooms?: number;
  isFurnished?: boolean;
  bedInSharedRoomPrice?: number;
  hasSharedKitchen?: boolean;
  totalBeds?: number;
}

function getAuthToken(): string | null {
  const rawToken = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
  if (!rawToken) return null;
  return rawToken.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '').trim();
}

function buildAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const apiKey = getActiveApiKey();
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }
  } catch {
    // fara cheie - cererea oricum va pica la ApiKeyMiddleware, dar nu blocam UI-ul aici
  }

  return headers;
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.message ?? fallback;
  } catch {
    return fallback;
  }
}

// "Ex: Brașov, România" - despartim location in city/country dupa prima virgula,
// pentru ca backend-ul stocheaza City si Country separat.
function splitLocation(location: string): { city: string; country: string } {
  const parts = location.split(',').map((p) => p.trim());
  return {
    city: parts[0] || location,
    country: parts[1] || '',
  };
}

function mapRawToAccommodation(item: RawAccommodationDto, index: number): Accommodation {
  return {
    id: item.id || `acc-${index}`,
    title: item.name,
    location: item.location || `${item.city || 'România'}, ${item.country || ''}`,
    price: item.pricePerNight || 150,
    type: item.accommodationType || 'Hotel',
    description: item.description || '',
    image: item.imageUrl && item.imageUrl.trim() ? item.imageUrl : NO_PHOTO_PLACEHOLDER,
    stars: item.stars,
    hasPool: item.hasPool,
    hasRoomService: item.hasRoomService,
    totalRooms: item.totalRooms,
    floorNumber: item.floorNumber,
    hasElevator: item.hasElevator,
    numberOfRooms: item.numberOfRooms,
    isFurnished: item.isFurnished,
    bedInSharedRoomPrice: item.bedInSharedRoomPrice,
    hasSharedKitchen: item.hasSharedKitchen,
    totalBeds: item.totalBeds,
  };
}

// Input numeric mic, reutilizat in sectiunile specifice de tip - pastreaza '' cat timp
// campul e gol, ca sa nu forteze 0 inainte ca userul sa apuce sa scrie ceva.
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | '';
  onChange: (v: number | '') => void;
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 cursor-pointer"
      />
      {label}
    </label>
  );
}

export default function ManageAccommodationsPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state - campuri comune
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState(150);
  const [type, setType] = useState<AccommodationTypeOption>('Hotel');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  // Form state - specifice Hotel
  const [stars, setStars] = useState<number | ''>('');
  const [hasPool, setHasPool] = useState(false);
  const [hasRoomService, setHasRoomService] = useState(false);
  const [totalRooms, setTotalRooms] = useState<number | ''>('');

  // Form state - specifice Apartment
  const [floorNumber, setFloorNumber] = useState<number | ''>('');
  const [hasElevator, setHasElevator] = useState(false);
  const [numberOfRooms, setNumberOfRooms] = useState<number | ''>('');
  const [isFurnished, setIsFurnished] = useState(false);

  // Form state - specifice Hostel
  const [bedInSharedRoomPrice, setBedInSharedRoomPrice] = useState<number | ''>('');
  const [hasSharedKitchen, setHasSharedKitchen] = useState(false);
  const [totalBeds, setTotalBeds] = useState<number | ''>('');

  // Verificăm tokenul și rolul de Manager/Operator la încărcarea paginii
  useEffect(() => {
    const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
    const savedProfile = localStorage.getItem('rbooking_user_profile') || localStorage.getItem('currentUser');

    if (!token || !savedProfile) {
      router.push('/login');
      return;
    }

    try {
      const profile = JSON.parse(savedProfile);
      const userRole = (profile.role || profile.Role || '').toLowerCase();
      if (userRole !== 'manager' && userRole !== 'operator' && userRole !== 'admin') {
        router.push('/');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';

  const fetchAccommodations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/Accommodations?PageNumber=1&PageSize=50`, {
        method: 'GET',
        headers: buildAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        const items: RawAccommodationDto[] = Array.isArray(data) ? data : data.items || data.Items || [];
        setAccommodations(items.map(mapRawToAccommodation));
        setIsLoading(false);
        return;
      }
    } catch {
      // ignore - eroarea reala se vede la operatiile de scriere (formError)
    }

    setAccommodations([]);
    setIsLoading(false);
  }, [apiUrl]);

  useEffect(() => {
    fetchAccommodations();

    const handleKeyChange = () => {
      fetchAccommodations();
    };

    window.addEventListener('api-key-change', handleKeyChange);
    return () => {
      window.removeEventListener('api-key-change', handleKeyChange);
    };
  }, [fetchAccommodations]);

  const resetTypeSpecificFields = () => {
    setStars('');
    setHasPool(false);
    setHasRoomService(false);
    setTotalRooms('');
    setFloorNumber('');
    setHasElevator(false);
    setNumberOfRooms('');
    setIsFurnished(false);
    setBedInSharedRoomPrice('');
    setHasSharedKitchen(false);
    setTotalBeds('');
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormError(null);
    setTitle('');
    setLocation('');
    setPrice(150);
    setType('Hotel');
    setDescription('');
    setImage('');
    resetTypeSpecificFields();
    setIsModalOpen(true);
  };

  const handleEdit = (item: Accommodation) => {
    setEditingId(item.id);
    setFormError(null);
    setTitle(item.title);
    setLocation(item.location);
    setPrice(item.price);
    // ATENTIE: presupunem ca accommodationType stocat e mereu unul din cele 3 valori canonice.
    // Daca in DB exista valori vechi/diferite (ex. "Hotel Boutique" din formularul anterior),
    // cad pe fallback 'Hotel' - trebuie curatate manual acele randuri sau extins mapping-ul aici.
    setType((['Hotel', 'Apartment', 'Hostel'] as const).includes(item.type as AccommodationTypeOption)
      ? (item.type as AccommodationTypeOption)
      : 'Hotel');
    setDescription(item.description);
    setImage(item.image === NO_PHOTO_PLACEHOLDER ? '' : item.image);

    setStars(item.stars ?? '');
    setHasPool(item.hasPool ?? false);
    setHasRoomService(item.hasRoomService ?? false);
    setTotalRooms(item.totalRooms ?? '');
    setFloorNumber(item.floorNumber ?? '');
    setHasElevator(item.hasElevator ?? false);
    setNumberOfRooms(item.numberOfRooms ?? '');
    setIsFurnished(item.isFurnished ?? false);
    setBedInSharedRoomPrice(item.bedInSharedRoomPrice ?? '');
    setHasSharedKitchen(item.hasSharedKitchen ?? false);
    setTotalBeds(item.totalBeds ?? '');

    setIsModalOpen(true);
  };

  // FIX: trimite DELETE catre backend, nu doar filtreaza local.
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      lang === 'RO' ? 'Sigur doriți să ștergeți această cazare?' : 'Are you sure you want to delete this accommodation?'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${apiUrl}/Accommodations/${id}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
      });

      if (res.ok || res.status === 204) {
        await fetchAccommodations();
      } else {
        const message = await extractErrorMessage(
          res,
          lang === 'RO' ? 'Eroare la ștergerea cazării.' : 'Error deleting accommodation.'
        );
        alert(message);
      }
    } catch {
      alert(lang === 'RO' ? 'Eroare de rețea la ștergere.' : 'Network error while deleting.');
    }
  };

  // FIX: trimite POST/PUT catre backend, cu payload aliniat exact la CreateAccommodationDto,
  // inclusiv campurile specifice de tip (Hotel/Apartment/Hostel) si imageUrl.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location) return;

    setFormError(null);
    setIsSaving(true);

    const { city, country } = splitLocation(location);
    const payload: AccommodationPayload = {
      name: title,
      description,
      location,
      city,
      country,
      pricePerNight: Number(price),
      accommodationType: type,
      imageUrl: image.trim() ? image.trim() : undefined,
    };

    if (type === 'Hotel') {
      payload.stars = stars === '' ? undefined : Number(stars);
      payload.hasPool = hasPool;
      payload.hasRoomService = hasRoomService;
      payload.totalRooms = totalRooms === '' ? undefined : Number(totalRooms);
    } else if (type === 'Apartment') {
      payload.floorNumber = floorNumber === '' ? undefined : Number(floorNumber);
      payload.hasElevator = hasElevator;
      payload.numberOfRooms = numberOfRooms === '' ? undefined : Number(numberOfRooms);
      payload.isFurnished = isFurnished;
    } else if (type === 'Hostel') {
      payload.bedInSharedRoomPrice = bedInSharedRoomPrice === '' ? undefined : Number(bedInSharedRoomPrice);
      payload.hasSharedKitchen = hasSharedKitchen;
      payload.totalBeds = totalBeds === '' ? undefined : Number(totalBeds);
    }

    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingId || '');

    try {
      const res = (editingId && isGuid)
        ? await fetch(`${apiUrl}/Accommodations/${editingId}`, {
            method: 'PUT',
            headers: buildAuthHeaders(),
            body: JSON.stringify(payload),
          })
        : await fetch(`${apiUrl}/Accommodations`, {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify(payload),
          });

      if (res.ok || res.status === 204) {
        setIsModalOpen(false);
        await fetchAccommodations();
      } else {
        const message = await extractErrorMessage(
          res,
          lang === 'RO' ? 'Eroare la salvarea cazării.' : 'Error saving accommodation.'
        );
        setFormError(message);
      }
    } catch {
      setFormError(lang === 'RO' ? 'Eroare de rețea la salvare.' : 'Network error while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500">
              {lang === 'RO' ? '[ PANOU MANAGEMENT ]' : '[ MANAGEMENT PANEL ]'}
            </span>
            <h1 className="font-serif text-3xl font-medium mt-1">
              {lang === 'RO' ? 'Gestionare Cazări' : 'Manage Accommodations'}
            </h1>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-amber-300 transition-all rounded-xl shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'RO' ? 'Adaugă Cazare Nouă' : 'Add New Accommodation'}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-neutral-500 font-mono text-sm">
            {lang === 'RO' ? 'Se încarcă...' : 'Loading...'}
          </div>
        ) : accommodations.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
            <Building2 className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
            <p className="font-mono text-sm text-neutral-500">
              {lang === 'RO' ? 'Nu există cazări adăugate momentan.' : 'No accommodations added yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accommodations.map((item) => (
              <div
                key={item.id}
                className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#121418] flex flex-col shadow-xs transition-all hover:border-neutral-400 dark:hover:border-neutral-700"
              >
                <div className="h-48 overflow-hidden relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono uppercase tracking-widest rounded-lg">
                    {item.type}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-medium mb-1">{item.title}</h3>
                    <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      {item.location}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-1 font-serif font-semibold text-lg">
                      <Euro className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>{item.price}</span>
                      <span className="text-xs font-mono text-neutral-400 font-normal">
                        {lang === 'RO' ? '/ noapte' : '/ night'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        title={lang === 'RO' ? 'Editează' : 'Edit'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleDelete(item.id)}
                        className="p-2 border border-red-200 dark:border-red-900/40 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                        title={lang === 'RO' ? 'Șterge' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Adăugare / Editare */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white dark:bg-[#121418] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="font-serif text-2xl font-medium mb-4">
                {editingId
                  ? (lang === 'RO' ? 'Editează Cazarea' : 'Edit Accommodation')
                  : (lang === 'RO' ? 'Adaugă Cazare Nouă' : 'Add New Accommodation')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
                    {formError}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                    {lang === 'RO' ? 'Titlu Cazare' : 'Accommodation Title'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder={lang === 'RO' ? 'Ex: Conacul Transilvaniei' : 'Ex: Transylvania Manor'}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                      {lang === 'RO' ? 'Locație (Oraș, Țară)' : 'Location (City, Country)'}
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      placeholder={lang === 'RO' ? 'Ex: Brașov, România' : 'Ex: Brasov, Romania'}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                      {lang === 'RO' ? 'Preț / Noapte (€)' : 'Price / Night (€)'}
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                    {lang === 'RO' ? 'Tip Cazare' : 'Accommodation Type'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccommodationTypeOption)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Hotel">{lang === 'RO' ? 'Hotel' : 'Hotel'}</option>
                    <option value="Apartment">{lang === 'RO' ? 'Apartament' : 'Apartment'}</option>
                    <option value="Hostel">{lang === 'RO' ? 'Hostel' : 'Hostel'}</option>
                  </select>
                </div>

                {/* Campuri specifice, afisate in functie de tipul selectat */}
                {type === 'Hotel' && (
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
                    <p className="text-[11px] font-mono uppercase text-neutral-500">
                      {lang === 'RO' ? 'Detalii Hotel' : 'Hotel Details'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField label={lang === 'RO' ? 'Stele' : 'Stars'} value={stars} onChange={setStars} />
                      <NumberField
                        label={lang === 'RO' ? 'Total Camere' : 'Total Rooms'}
                        value={totalRooms}
                        onChange={setTotalRooms}
                      />
                    </div>
                    <div className="flex gap-6">
                      <CheckboxField
                        label={lang === 'RO' ? 'Are Piscină' : 'Has Pool'}
                        checked={hasPool}
                        onChange={setHasPool}
                      />
                      <CheckboxField
                        label={lang === 'RO' ? 'Room Service' : 'Room Service'}
                        checked={hasRoomService}
                        onChange={setHasRoomService}
                      />
                    </div>
                  </div>
                )}

                {type === 'Apartment' && (
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
                    <p className="text-[11px] font-mono uppercase text-neutral-500">
                      {lang === 'RO' ? 'Detalii Apartament' : 'Apartment Details'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField
                        label={lang === 'RO' ? 'Etaj' : 'Floor Number'}
                        value={floorNumber}
                        onChange={setFloorNumber}
                      />
                      <NumberField
                        label={lang === 'RO' ? 'Nr. Camere' : 'Number of Rooms'}
                        value={numberOfRooms}
                        onChange={setNumberOfRooms}
                      />
                    </div>
                    <div className="flex gap-6">
                      <CheckboxField
                        label={lang === 'RO' ? 'Are Lift' : 'Has Elevator'}
                        checked={hasElevator}
                        onChange={setHasElevator}
                      />
                      <CheckboxField
                        label={lang === 'RO' ? 'Mobilat' : 'Furnished'}
                        checked={isFurnished}
                        onChange={setIsFurnished}
                      />
                    </div>
                  </div>
                )}

                {type === 'Hostel' && (
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
                    <p className="text-[11px] font-mono uppercase text-neutral-500">
                      {lang === 'RO' ? 'Detalii Hostel' : 'Hostel Details'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField
                        label={lang === 'RO' ? 'Preț / Pat în Cameră Comună (€)' : 'Bed in Shared Room Price (€)'}
                        value={bedInSharedRoomPrice}
                        onChange={setBedInSharedRoomPrice}
                      />
                      <NumberField
                        label={lang === 'RO' ? 'Total Paturi' : 'Total Beds'}
                        value={totalBeds}
                        onChange={setTotalBeds}
                      />
                    </div>
                    <CheckboxField
                      label={lang === 'RO' ? 'Bucătărie Comună' : 'Shared Kitchen'}
                      checked={hasSharedKitchen}
                      onChange={setHasSharedKitchen}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                    {lang === 'RO' ? 'URL Imagine' : 'Image URL'}
                  </label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                    {lang === 'RO' ? 'Descriere' : 'Description'}
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={lang === 'RO' ? 'Detalii despre proprietate...' : 'Property details...'}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-mono uppercase tracking-widest border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    {lang === 'RO' ? 'Anulează' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-amber-300 transition-all rounded-xl shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving
                      ? (lang === 'RO' ? 'Se salvează...' : 'Saving...')
                      : editingId
                      ? (lang === 'RO' ? 'Salvează Modificările' : 'Save Changes')
                      : (lang === 'RO' ? 'Adaugă Cazare' : 'Add Stay')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}