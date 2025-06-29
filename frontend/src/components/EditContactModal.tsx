'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Contact {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  birthday: string | null;
  favorites: Record<string, string>;
}

interface EditContactModalProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditContactModal({ contact, isOpen, onClose, onUpdate }: EditContactModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    birthday: '',
    favorites: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name,
        middle_name: contact.middle_name || '',
        last_name: contact.last_name || '',
        birthday: contact.birthday || '',
        favorites: formatFavoritesForInput(contact.favorites)
      });
    }
  }, [contact]);

  const formatFavoritesForInput = (favorites: Record<string, string>): string => {
    return Object.entries(favorites || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  const parseFavorites = (input: string): Record<string, string> => {
    const lines = input.split('\n');
    const entries: Record<string, string> = {};
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();
          if (key && value) {
            entries[key] = value;
          }
        }
      }
    }
    return entries;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.first_name.trim()) {
      setError('First name is required.');
      setLoading(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setError('You must be logged in to edit contacts.');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          first_name: formData.first_name.trim(),
          middle_name: formData.middle_name.trim() || null,
          last_name: formData.last_name.trim() || null,
          birthday: formData.birthday || null,
          favorites: parseFavorites(formData.favorites)
        })
        .eq('id', contact.id)
        .eq('owner_id', user.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        onUpdate();
        onClose();
      }
    } catch {
      setError('Failed to update contact.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Contact</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              value={formData.middle_name}
              onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birthday
            </label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({...formData, birthday: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Favorites
            </label>
            <textarea
              value={formData.favorites}
              onChange={(e) => setFormData({...formData, favorites: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={4}
              placeholder="food: pizza&#10;color: blue&#10;movie: The Matrix"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter each favorite on a new line in format: &quot;category: value&quot;
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 