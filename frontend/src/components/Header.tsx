'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between">
      <h1 className="text-xl font-bold">Acquainted</h1>
      <nav>
        <Link href="/dashboard" className="mr-4">Dashboard</Link>
        <Link href="/contacts" className="mr-4">Contacts</Link>
        <Link href="/contacts/new" className="mr-4">New Contact</Link>
        <Link href="/login">Log Out</Link>
      </nav>
    </header>
  );
}
