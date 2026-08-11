'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Building2, Plus, Trash2, Edit, MapPin, Euro, X, RefreshCw } from 'lucide-react';
import { getActiveApiKey } from '@/lib/apiKey';

const NO_PHOTO_PLACEHOLDER = 'https://www.tez-tour.ro/static/images/nophoto-hotel.png';

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
}

interface Accommodation {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  description: string;
  image: string;
}

export default function ManageAccommodationsPage() {
  const { lang } = useLanguage();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState(150);
  const [type, setType] = useState('Hotel Boutique');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const fetchAccommodations = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
      const apiKey = getActiveApiKey();

      const res = await fetch(`${apiUrl}/Accommodations?PageNumber=1&PageSize=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const items: RawAccommodationDto[] = Array.isArray(data)
          ? data
          : data.items || data.Items || [];

        const mapped: Accommodation[] = items.map((item, index) => ({
          id: item.id || `acc-${index}`,
          title: item.name,
          location: item.location || `${item.city || 'România'}, ${item.country || ''}`,
          price: item.pricePerNight || 150,
          type: item.accommodationType || 'Hotel Boutique',
          description: item.description || '',
          image: item.imageUrl && item.imageUrl.trim() ? item.imageUrl : NO_PHOTO_PLACEHOLDER,
        }));

        setAccommodations(mapped);
        localStorage.setItem('rbooking_accommodations', JSON.stringify(mapped));
        setIsLoading(false);
        return;
      }
    } catch {
      // ignore
    }

    // Do NOT spawn any mock accommodations. Only load what exists or empty array.
    const saved = localStorage.getItem('rbooking_accommodations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setAccommodations(parsed);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setAccommodations([]);
    setIsLoading(false);
  }, []);

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

  const saveToStorage = (updated: Accommodation[]) => {
    setAccommodations(updated);
    localStorage.setItem('rbooking_accommodations', JSON.stringify(updated));
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setTitle('');
    setLocation('');
    setPrice(150);
    setType('Hotel Boutique');
    setDescription('');
    setImage('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: Accommodation) => {
    setEditingId(item.id);
    setTitle(item.title);
    setLocation(item.location);
    setPrice(item.price);
    setType(item.type);
    setDescription(item.description);
    setImage(item.image);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const filtered = accommodations.filter((item) => item.id !== id);
    saveToStorage(filtered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location) return;

    if (editingId) {
      const updated = accommodations.map((item) =>
        item.id === editingId
          ? { ...item, title, location, price: Number(price), type, description, image: image || item.image }
          : item
      );
      saveToStorage(updated);
    } else {
      const newItem: Accommodation = {
        id: Date.now().toString(),
        title,
        location,
        price: Number(price),
        type,
        description,
        image: image || NO_PHOTO_PLACEHOLDER,
      };
      saveToStorage([...accommodations, newItem]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500">
              [ PANOU MANAGEMENT ]
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

        {accommodations.length === 0 ? (
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
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
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
                      <span className="text-xs font-mono text-neutral-400 font-normal">/ noapte</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        title="Editează"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 border border-red-200 dark:border-red-900/40 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                        title="Șterge"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#121418] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
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
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">Titlu Cazare</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ex: Conacul Transilvaniei"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">Locație</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      placeholder="Ex: Brașov, România"
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">Preț / Noapte (€)</label>
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
                  <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">Tip Cazare</label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    placeholder="Ex: Hotel Boutique, Conac, Apartament"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">URL Imagine</label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">Descriere</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalii despre proprietate..."
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-mono uppercase tracking-widest border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-amber-300 transition-all rounded-xl shadow-sm cursor-pointer"
                  >
                    {editingId ? 'Salvează Modificările' : 'Adaugă Cazare'}
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