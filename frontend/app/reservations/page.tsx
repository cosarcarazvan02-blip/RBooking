'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function ReservationsPage() {
  const [role] = useState<'guest' | 'user' | 'manager' | 'admin'>('user');

  const [reservations, setReservations] = useState([
    { id: 101, hotel: 'Grand Hotel Bucharest', location: 'Bucharest, Romania', checkIn: '2026-09-10', checkOut: '2026-09-15', status: 'Confirmed', payment: 'Credit Card' },
  ]);

  // Stări pentru formular
  const [country, setCountry] = useState('Romania');
  const [county, setCounty] = useState('Cluj');
  const [city, setCity] = useState('Cluj-Napoca');
  const [hotelName, setHotelName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // Date specifice cardului
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Sugestii pentru hoteluri (funcționează și ca scriere liberă)
  const hotelSuggestions = [
    'Hotel Belvedere',
    'Grand Hotel Napoca',
    'Plaza Hotel',
    'Hotel Transilvania',
  ];

  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName || !checkIn || !checkOut || !paymentMethod) return;

    const newRes = {
      id: Date.now(),
      hotel: hotelName,
      location: `${city}, ${country}`,
      checkIn,
      checkOut,
      status: 'Confirmed',
      payment: paymentMethod === 'Credit Card' ? `Credit Card ending in ${cardNumber.slice(-4) || '1234'}` : paymentMethod
    };

    setReservations([...reservations, newRes]);
    
    // Resetare
    setHotelName('');
    setCheckIn('');
    setCheckOut('');
    setPaymentMethod('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
  };

  const handleCancel = (id: number) => {
    setReservations(reservations.filter((res) => res.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar role={role} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reservations</h1>
        <p className="text-gray-600 mb-8">Manage your active and past hotel bookings.</p>

        {/* Formular de rezervare */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Book a New Stay</h2>
          
          <form onSubmit={handleAddReservation} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Țară */}
            <select 
              value={country} 
              onChange={(e) => setCountry(e.target.value)}
              className="border p-2 rounded-lg text-gray-900 bg-white"
            >
              <option value="Romania">Romania</option>
              <option value="Hungary">Hungary</option>
              <option value="Germany">Germany</option>
            </select>

            {/* Județ */}
            <select 
              value={county} 
              onChange={(e) => setCounty(e.target.value)}
              className="border p-2 rounded-lg text-gray-900 bg-white"
            >
              <option value="Cluj">Cluj</option>
              <option value="Mureș">Mureș</option>
              <option value="București">București</option>
            </select>

            {/* Oraș */}
            <select 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              className="border p-2 rounded-lg text-gray-900 bg-white"
            >
              <option value="Cluj-Napoca">Cluj-Napoca</option>
              <option value="Târgu Mureș">Târgu Mureș</option>
              <option value="Bucharest">Bucharest</option>
            </select>

            {/* Nume Hotel: Permite atât scriere liberă cât și selecție din listă (datalist) */}
            <div>
              <input 
                type="text" 
                list="hotels-list"
                placeholder="Type or select hotel name" 
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                required
                className="w-full border p-2 rounded-lg text-gray-900 placeholder:text-gray-500"
              />
              <datalist id="hotels-list">
                {hotelSuggestions.map((h, index) => (
                  <option key={index} value={h} />
                ))}
              </datalist>
            </div>

            {/* Metodă de plată */}
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              className="border p-2 rounded-lg text-gray-900 bg-white md:col-span-2"
            >
              <option value="" disabled>Select Payment Method</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Apple Pay">Apple Pay</option>
              <option value="Google Pay">Google Pay</option>
              <option value="PayPal">PayPal</option>
            </select>

            {/* Dacă alege Credit Card, cerem detaliile cardului */}
            {paymentMethod === 'Credit Card' && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border">
                <input 
                  type="text" 
                  placeholder="Card Number (16 digits)" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={16}
                  required
                  className="border p-2 rounded-lg text-gray-900 bg-white md:col-span-1"
                />
                <input 
                  type="text" 
                  placeholder="MM/YY" 
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  maxLength={5}
                  required
                  className="border p-2 rounded-lg text-gray-900 bg-white"
                />
                <input 
                  type="password" 
                  placeholder="CVV" 
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  maxLength={3}
                  required
                  className="border p-2 rounded-lg text-gray-900 bg-white"
                />
              </div>
            )}

            {/* Date Check-in */}
            <input 
              type="date" 
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className="border p-2 rounded-lg text-gray-900"
            />

            {/* Date Check-out */}
            <input 
              type="date" 
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className="border p-2 rounded-lg text-gray-900"
            />

            <button 
              type="submit" 
              className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition mt-2"
            >
              Confirm & Pay
            </button>
          </form>
        </div>

        {/* Listă rezervări */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Active Bookings</h2>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {reservations.map((res) => (
              <div key={res.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{res.hotel}</h3>
                  <p className="text-xs text-gray-500">📍 {res.location}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Check-in: {res.checkIn} → Check-out: {res.checkOut}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                     💳 Paid with {res.payment}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {res.status}
                  </span>
                  <button 
                    onClick={() => handleCancel(res.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}