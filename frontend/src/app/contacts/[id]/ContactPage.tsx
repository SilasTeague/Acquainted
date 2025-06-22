'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Contact {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  birthday: string | null;
  favorites: Record<string, string>;
}

export default function ContactPage({ id }: { id: string | undefined }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Missing contact ID.');
      return;
    }

    const fetchContact = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        setError(error?.message ?? 'Contact not found.');
      } else {
        setContact(data);
      }
    };

    fetchContact();
  }, [id]);

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!contact) return <div className="p-4">Loading contact...</div>;

  return (
    <div className="p-4">
      <h1>
        {contact.first_name} {contact.middle_name} {contact.last_name}
      </h1>
      <p>Birthday: {contact.birthday || 'Unknown'}</p>

      <h2 className="mt-4 font-semibold">Favorites:</h2>
      <ul className="list-disc list-inside">
        {Object.entries(contact.favorites || {}).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {value}
          </li>
        ))}
      </ul>
    </div>
  );
}
