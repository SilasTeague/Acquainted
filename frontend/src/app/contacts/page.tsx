'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { format } from 'date-fns';

interface Contact {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  birthday: string | null;
  favorites: Record<string, string>;
  created_at: string;
}

type SortField = 'name' | 'birthday' | 'created';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
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
        .select('id, first_name, middle_name, last_name, birthday, favorites, created_at')
        .eq('owner_id', user.id)
        .order('first_name', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setContacts(data || []);
      }

      setLoading(false);
    };

    fetchContacts();
  }, [router]);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return contacts.filter(contact => {
      // Search in name
      const fullName = `${contact.first_name} ${contact.middle_name || ''} ${contact.last_name || ''}`.toLowerCase();
      if (fullName.includes(query)) {
        return true;
      }

      // Search in individual name parts
      if (contact.first_name.toLowerCase().includes(query) ||
          (contact.middle_name && contact.middle_name.toLowerCase().includes(query)) ||
          (contact.last_name && contact.last_name.toLowerCase().includes(query))) {
        return true;
      }

      // Search in favorites
      if (contact.favorites) {
        const favoritesText = Object.entries(contact.favorites)
          .map(([key, value]) => `${key} ${value}`)
          .join(' ')
          .toLowerCase();
        if (favoritesText.includes(query)) {
          return true;
        }
      }

      return false;
    });
  }, [contacts, searchQuery]);

  // Sort filtered contacts
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = `${a.first_name} ${a.middle_name || ''} ${a.last_name || ''}`.toLowerCase();
          bValue = `${b.first_name} ${b.middle_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'birthday':
          aValue = a.birthday || '';
          bValue = b.birthday || '';
          break;
        case 'created':
          aValue = a.created_at || '';
          bValue = b.created_at || '';
          break;
        default:
          aValue = a.first_name.toLowerCase();
          bValue = b.first_name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredContacts, sortField, sortOrder]);

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === sortedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(sortedContacts.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedContacts.size} contact${selectedContacts.size !== 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', Array.from(selectedContacts));

      if (error) {
        setError(error.message);
      } else {
        setContacts(contacts.filter(c => !selectedContacts.has(c.id)));
        setSelectedContacts(new Set());
      }
    } catch {
      setError('Failed to delete contacts.');
    }
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return contacts.filter(contact => {
      if (!contact.birthday) return false;
      const birthday = new Date(contact.birthday);
      const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      return nextBirthday <= thirtyDaysFromNow;
    }).slice(0, 3);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Contacts</h1>
              <p className="text-gray-600 mt-1">Manage your relationships and keep track of important details</p>
            </div>
            <Link 
              href="/contacts/new" 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              + New Contact
            </Link>
          </div>

          {/* Stats and Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{contacts.length}</div>
              <div className="text-sm text-green-700">Total Contacts</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{getUpcomingBirthdays().length}</div>
              <div className="text-sm text-blue-700">Upcoming Birthdays</div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search contacts by name, favorites, or any detail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="birthday-asc">Birthday (earliest)</option>
                  <option value="birthday-desc">Birthday (latest)</option>
                  <option value="created-desc">Recently Added</option>
                  <option value="created-asc">Oldest Added</option>
                </select>

                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {selectedContacts.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedContacts.size} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>

            {searchQuery && (
              <p className="text-sm text-gray-500">
                Found {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
              </p>
            )}
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first contact to keep track of important relationships.</p>
              <Link 
                href="/contacts/new" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Your First Contact
              </Link>
            </div>
          ) : filteredContacts.length === 0 && searchQuery ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-500 mb-4">Try searching with different keywords or check your spelling.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <>
              {/* Bulk Selection Header */}
              {sortedContacts.length > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedContacts.size === sortedContacts.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                  </label>
                </div>
              )}

              {/* Contact Grid/List */}
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                {sortedContacts.map((contact) => {
                  const fullName = `${contact.first_name} ${contact.middle_name || ''} ${contact.last_name || ''}`.trim();
                  const isSelected = selectedContacts.has(contact.id);
                  
                  return (
                    <div
                      key={contact.id}
                      className={`relative ${viewMode === 'grid' ? 'bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200' : 'bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-200'}`}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectContact(contact.id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </div>

                      <Link href={`/contacts/${contact.id}`} className="block">
                        <div className={viewMode === 'grid' ? 'ml-6' : 'ml-6 flex items-center justify-between'}>
                          <div className="flex-1">
                            <h3 className={`font-medium text-gray-900 ${viewMode === 'list' ? 'text-lg' : ''}`}>
                              {searchQuery ? highlightText(fullName, searchQuery) : fullName}
                            </h3>
                            <p className="text-sm text-gray-500">Click to view details and notes</p>
                            
                            {/* Contact Details */}
                            {contact.birthday && (
                              <p className="text-sm text-gray-600 mt-1">
                                🎂 {format(new Date(contact.birthday + 'T00:00:00'), 'MMM d')}
                              </p>
                            )}
                            
                            {contact.favorites && Object.keys(contact.favorites).length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {Object.entries(contact.favorites).slice(0, viewMode === 'grid' ? 2 : 3).map(([key, value]) => (
                                  <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    {searchQuery ? highlightText(key, searchQuery) : key}: {searchQuery ? highlightText(value, searchQuery) : value}
                                  </span>
                                ))}
                                {Object.keys(contact.favorites).length > (viewMode === 'grid' ? 2 : 3) && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                    +{Object.keys(contact.favorites).length - (viewMode === 'grid' ? 2 : 3)} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {viewMode === 'list' && (
                            <div className="text-gray-400 ml-4">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}