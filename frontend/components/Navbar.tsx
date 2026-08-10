import Link from 'next/link';

interface NavbarProps {
  role?: 'guest' | 'user' | 'manager' | 'admin';
}

export default function Navbar({ role = 'guest' }: NavbarProps) {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="font-bold text-xl text-blue-600">
        <Link href="/">RBooking</Link>
      </div>
      
      <div className="flex gap-6 items-center font-medium text-gray-700">
        {/* Vizitator / Guest */}
        {role === 'guest' && (
          <>
            <Link href="/" className="hover:text-blue-600">Accommodations</Link>
            <Link href="/register" className="hover:text-blue-600">Register</Link>
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Login</Link>
          </>
        )}

        {/* User simplu */}
        {role === 'user' && (
          <>
            <Link href="/hotels" className="hover:text-blue-600">Hotels</Link>
            <Link href="/reservations" className="hover:text-blue-600">Reservations</Link>
            <Link href="/account" className="hover:text-blue-600">My account</Link>
            <Link href="/logout" className="text-red-500 hover:text-red-700">Logout</Link>
          </>
        )}

        {/* Manager hotel */}
        {role === 'manager' && (
          <>
            <Link href="/" className="hover:text-blue-600">Accommodations</Link>
            <Link href="/manage-accommodations" className="hover:text-blue-600">Manage my accommodations</Link>
            <Link href="/account" className="hover:text-blue-600">My account</Link>
            <Link href="/logout" className="text-red-500 hover:text-red-700">Logout</Link>
          </>
        )}

        {/* Admin */}
        {role === 'admin' && (
          <>
            <Link href="/" className="hover:text-blue-600">Accommodations</Link>
            <Link href="/admin" className="hover:text-blue-600">Admin</Link>
            <Link href="/account" className="hover:text-blue-600">My account</Link>
            <Link href="/logout" className="text-red-500 hover:text-red-700">Logout</Link>
          </>
        )}
      </div>
    </nav>
  );
}