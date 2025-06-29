'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import NotesSection from '@/components/NotesSection';
import { format } from 'date-fns';

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

  const fullName = `${contact.first_name} ${contact.middle_name || ''} ${contact.last_name || ''}`.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Contact Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
              {contact.birthday && (
                <p className="text-gray-600 mt-1">
                  Birthday: {format(new Date(contact.birthday), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Edit Contact
              </button>
            </div>
          </div>

          {/* Favorites Section */}
          {contact.favorites && Object.keys(contact.favorites).length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Favorites</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(contact.favorites).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <span className="font-medium text-gray-900 capitalize">{key}:</span>
                    <span className="text-gray-700 ml-2">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <NotesSection contactId={contact.id} />
        </div>
      </div>
    </div>
  );
}
