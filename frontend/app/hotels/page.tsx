'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function HotelsPage() {
  const [role] = useState<'guest' | 'user' | 'manager' | 'admin'>('user');

  const hotelsList = [
    { id: 1, name: 'Grand Hotel Bucharest', location: 'Bucharest', rooms: 120 },
    { id: 2, name: 'Hotel Belvedere', location: 'Cluj-Napoca', rooms: 85 },
    { id: 3, name: 'Continental Forum', location: 'Sibiu', rooms: 95 },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar role={role} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hotels Catalog</h1>
        <p className="text-gray-600 mb-8">Browse through available partner hotels.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hotelsList.map((hotel) => (
            <div key={hotel.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
              <h3 className="font-bold text-xl text-gray-800 mb-2">{hotel.name}</h3>
              <p className="text-gray-500 text-sm mb-4">Location: {hotel.location}</p>
              <p className="text-gray-600 text-sm mb-6">Total Rooms: {hotel.rooms}</p>
              <button className="mt-auto bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}