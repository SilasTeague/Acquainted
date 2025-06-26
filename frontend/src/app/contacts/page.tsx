'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Contact {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      setError('');

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('id, first_name, middle_name, last_name')
        .eq('owner_id', user.id);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setContacts(data || []);
      }

      setLoading(false);
    };

    fetchContacts();
  }, []);

  if (loading) {
    return <div className="p-4">Loading contacts...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Your Contacts</h1>
      <Link 
        href="/contacts/new" 
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block mb-4"
      >
        New Contact
      </Link>

      {contacts.length === 0 ? (
        <p>No contacts found.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link
                href={`/contacts/${contact.id}`}
                className="block border p-3 rounded hover:bg-gray-50"
              >
                <span className="font-medium">
                  {contact.first_name} 
                  {contact.middle_name ? ` ${contact.middle_name}` : ''}
                  {contact.last_name ? ` ${contact.last_name}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}