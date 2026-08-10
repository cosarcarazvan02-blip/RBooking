'use client';
import Navbar from '@/components/Navbar';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar role="guest" />
      
      <div className="flex flex-col items-center justify-center mt-16">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Register</h1>
          
          <form className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Username" 
              required
              className="border p-2 rounded-lg text-gray-900 placeholder:text-gray-500"
            />
            <input 
              type="email" 
              placeholder="Email" 
              required
              className="border p-2 rounded-lg text-gray-900 placeholder:text-gray-500"
            />
            <input 
              type="password" 
              placeholder="Password" 
              required
              className="border p-2 rounded-lg text-gray-900 placeholder:text-gray-500"
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}