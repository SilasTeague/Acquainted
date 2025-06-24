'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function NewContactPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [favorites, setFavorites] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setError('You must be logged in to create a contact.');
      return;
    }

    const { error: insertError } = await supabase.from('contacts').insert([
      {
        owner_id: user.id,
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        birthday: birthday || null,
        favorites: parseFavorites(favorites),
      },
    ]);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push('/contacts');
    }
  };

  const parseFavorites = (input: string): Record<string, string> => {
    const lines = input.split('\n');
    const entries: Record<string, string> = {};
    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) entries[key.trim()] = value.trim();
    }
    return entries;
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create New Contact</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          className="w-full border px-3 py-2"
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          className="w-full border px-3 py-2"
          type="text"
          placeholder="Middle Name"
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
        />
        <input
          className="w-full border px-3 py-2"
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          className="w-full border px-3 py-2"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
        <textarea
          className="w-full border px-3 py-2"
          placeholder="Favorites (e.g. food: ice cream)"
          value={favorites}
          onChange={(e) => setFavorites(e.target.value)}
          rows={4}
        />

        {error && <p className="text-red-500">{error}</p>}

        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" type="submit">
          Save Contact
        </button>
      </form>
    </div>
  );
}
