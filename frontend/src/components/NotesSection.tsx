'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NotesSectionProps {
  contactId: string;
}

export default function NotesSection({ contactId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [contactId]);

  const fetchNotes = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setError('You must be logged in to view notes.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('contact_id', contactId)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setNotes(data || []);
      }
    } catch (err) {
      setError('Failed to load notes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newNote.title.trim() || !newNote.content.trim()) {
      setError('Please fill in both title and content.');
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setError('You must be logged in to create notes.');
        return;
      }

      const { error: createError } = await supabase.from('notes').insert([{
        owner_id: user.id,
        contact_id: contactId,
        title: newNote.title.trim(),
        content: newNote.content.trim()
      }]);

      if (createError) {
        setError(createError.message);
      } else {
        setNewNote({ title: '', content: '' });
        setShowCreateForm(false);
        await fetchNotes();
      }
    } catch (err) {
      setError('Failed to create note.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        setError(error.message);
      } else {
        await fetchNotes();
      }
    } catch (err) {
      setError('Failed to delete note.');
    }
  };

  if (loading) {
    return <div className="p-4">Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
        >
          + Add Note
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-gray-500 text-sm">No notes yet. Add your first note to remember important details about this contact.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{note.title}</h4>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
              <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">{note.content}</p>
              <p className="text-gray-500 text-xs">
                Created: {format(new Date(note.created_at), 'MMM d, yyyy')}
                {note.updated_at !== note.created_at && 
                  ` • Updated: ${format(new Date(note.updated_at), 'MMM d, yyyy')}`
                }
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <input
                type="text"
                placeholder="Note title"
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <textarea
                placeholder="Note content"
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                rows={4}
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Note
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewNote({ title: '', content: '' });
                    setError('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 