'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import NotesSection from '@/components/NotesSection';
import EditContactModal from '@/components/EditContactModal';
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
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchContact = async () => {
    if (!id) {
      setError('Missing contact ID.');
      return;
    }

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

  useEffect(() => {
    fetchContact();
  }, [id]);

  const handleContactUpdate = () => {
    fetchContact();
  };

  const handleDeleteContact = async () => {
    if (!contact || !confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) {
        setError(error.message);
      } else {
        router.push('/contacts');
      }
    } catch (err) {
      setError('Failed to delete contact.');
    }
  };

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
              <button 
                onClick={() => setShowEditModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Edit Contact
              </button>
              <button 
                onClick={handleDeleteContact}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Contact
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

      {/* Edit Contact Modal */}
      {contact && (
        <EditContactModal
          contact={contact}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleContactUpdate}
        />
      )}
    </div>
  );
}
