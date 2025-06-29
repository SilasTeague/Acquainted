'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Calendar from '@/components/Calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import './styles.css';

interface Event {
  id: string;
  title: string;
  date: string;
  contact_id: string | null;
  contact_name?: string;
  description?: string;
  type: 'birthday' | 'anniversary' | 'custom';
}

interface Contact {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  birthday: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventError, setEventError] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    contact_id: '',
    description: '',
    type: 'custom' as const
  });

  useEffect(() => {
    const getUserDetails = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.push('/login');
        return;
      }

      const user = session.user;
      setDisplayName(user.user_metadata?.display_name || null);
      setLoading(false);
    };

    getUserDetails();
  }, [router]);

  useEffect(() => {
    fetchEvents();
    fetchContacts();
  }, []);

  // Refresh events when contacts change (for new birthdays)
  useEffect(() => {
    if (contacts.length > 0) {
      fetchEvents();
    }
  }, [contacts.length]);

  const fetchEvents = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    try {
      // Fetch custom events
      const { data: customEvents, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          date,
          contact_id,
          description,
          type,
          contacts(first_name, middle_name, last_name)
        `)
        .eq('owner_id', user.id);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
      }

      // Fetch birthdays from contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, first_name, middle_name, last_name, birthday')
        .eq('owner_id', user.id)
        .not('birthday', 'is', null);

      if (contactsError) {
        console.error('Error fetching contacts for birthdays:', contactsError);
        return;
      }

      const birthdayEvents: Event[] = (contacts || [])
        .filter(contact => contact.birthday)
        .map(contact => {
          const birthday = new Date(contact.birthday! + 'T00:00:00');
          const today = new Date();
          const currentYear = today.getFullYear();
          
          // Calculate next birthday for current year
          let nextBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
          
          // If birthday has already passed this year, set it for next year
          if (nextBirthday < today) {
            nextBirthday = new Date(currentYear + 1, birthday.getMonth(), birthday.getDate());
          }
          
          return {
            id: `birthday-${contact.id}`,
            title: `${contact.first_name}'s Birthday`,
            date: nextBirthday.toISOString().split('T')[0], // Format as YYYY-MM-DD
            contact_id: contact.id,
            contact_name: `${contact.first_name} ${contact.middle_name || ''} ${contact.last_name || ''}`.trim(),
            type: 'birthday' as const
          };
        });

      const allEvents = [
        ...(customEvents || []).map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          contact_id: event.contact_id,
          description: event.description || undefined,
          type: event.type as 'birthday' | 'anniversary' | 'custom',
          contact_name: (event as unknown as { contacts?: { first_name: string; middle_name: string | null; last_name: string | null } }).contacts ? 
            `${(event as unknown as { contacts?: { first_name: string; middle_name: string | null; last_name: string | null } }).contacts!.first_name} ${(event as unknown as { contacts?: { first_name: string; middle_name: string | null; last_name: string | null } }).contacts!.middle_name || ''} ${(event as unknown as { contacts?: { first_name: string; middle_name: string | null; last_name: string | null } }).contacts!.last_name || ''}`.trim() : 
            undefined
        })),
        ...birthdayEvents
      ];

      setEvents(allEvents);
    } catch {
      console.error('Error in fetchEvents');
    }
  };

  const fetchContacts = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, middle_name, last_name, birthday')
        .eq('owner_id', user.id);

      if (error) {
        console.error('Error fetching contacts:', error);
        return;
      }

      setContacts(data || []);
    } catch {
      console.error('Error in fetchContacts');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventError('');
    
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setEventError('You must be logged in to create an event.');
      return;
    }

    try {
      const { error } = await supabase.from('events').insert([{
        owner_id: user.id,
        title: newEvent.title.trim(),
        date: newEvent.date,
        contact_id: newEvent.contact_id || null,
        description: newEvent.description.trim() || null,
        type: newEvent.type
      }]);

      if (error) {
        console.error('Error creating event:', error);
        setEventError(error.message);
        return;
      }

      // Success - reset form and refresh events
      setShowEventForm(false);
      setNewEvent({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        contact_id: '',
        description: '',
        type: 'custom'
      });
      await fetchEvents();
    } catch {
      console.error('Error in handleCreateEvent');
      setEventError('An unexpected error occurred. Please try again.');
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), date));
  };

  // Filter contacts for event creation dropdown
  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery.trim()) {
      return contacts;
    }

    const query = contactSearchQuery.toLowerCase().trim();
    
    return contacts.filter(contact => {
      const fullName = `${contact.first_name} ${contact.middle_name || ''} ${contact.last_name || ''}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [contacts, contactSearchQuery]);

  const tileContent = ({ date }: { date: Date }) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;

    const birthdays = dayEvents.filter(event => event.type === 'birthday');
    const otherEvents = dayEvents.filter(event => event.type !== 'birthday');

    return (
      <div className="absolute bottom-1 left-1 right-1">
        <div className="flex flex-wrap gap-1">
          {/* Show birthdays first with pink indicators */}
          {birthdays.slice(0, 2).map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className="w-2 h-2 rounded-full bg-pink-400"
              title={`🎂 ${event.title}`}
            />
          ))}
          
          {/* Show other events with green indicators */}
          {otherEvents.slice(0, 2 - birthdays.length).map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className="w-2 h-2 rounded-full bg-green-400"
              title={event.title}
            />
          ))}
          
          {/* Show "more" indicator if there are additional events */}
          {dayEvents.length > 2 && (
            <div 
              className="w-2 h-2 rounded-full bg-gray-400" 
              title={`${dayEvents.length - 2} more events`} 
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
              <p className="text-gray-600 mt-1">Manage your relationships and never miss important dates</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => router.push('/contacts')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                View Contacts
              </button>
              <button 
                onClick={handleLogout}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{contacts.length}</div>
              <div className="text-sm text-green-700">Total Contacts</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {contacts.filter(contact => {
                  if (!contact.birthday) return false;
                  const today = new Date();
                  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                  const birthday = new Date(contact.birthday);
                  const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
                  
                  if (nextBirthday < today) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                  }
                  
                  return nextBirthday <= thirtyDaysFromNow;
                }).length}
              </div>
              <div className="text-sm text-blue-700">Upcoming Birthdays</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Birthdays from your contacts are automatically included 🎂
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    + Add Event
                  </button>
                </div>
                <Calendar
                  value={selectedDate}
                  onChange={setSelectedDate}
                  tileContent={tileContent}
                />
              </div>
            </div>

            {/* Events for selected date */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Events for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <div className="space-y-3">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500 text-sm">No events scheduled</p>
                ) : (
                  getEventsForDate(selectedDate).map((event) => (
                    <div key={event.id} className={`p-3 rounded-lg ${
                      event.type === 'birthday' ? 'bg-pink-50 border border-pink-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {event.type === 'birthday' && (
                              <span className="text-pink-600">🎂</span>
                            )}
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                          </div>
                          {event.contact_name && (
                            <p className="text-sm text-gray-600 mt-1">Related to: {event.contact_name}</p>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.type === 'birthday' 
                            ? 'bg-pink-100 text-pink-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {event.type === 'birthday' ? 'Birthday' : event.type}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Creation Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <select
                value={newEvent.contact_id}
                onChange={(e) => setNewEvent({...newEvent, contact_id: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">No contact (optional)</option>
                {filteredContacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.middle_name || ''} {contact.last_name || ''}
                  </option>
                ))}
              </select>
              {contacts.length > 5 && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 pl-8 text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}
              <textarea
                placeholder="Description (optional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
              />
              {eventError && (
                <p className="text-red-500 text-sm">{eventError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEventForm(false);
                    setEventError('');
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
