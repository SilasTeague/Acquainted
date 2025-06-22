import { supabase } from '@/lib/supabaseClient';

interface Contact {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string | null;
    birthday: string | null;
    favorites: Record<string, string>;
}

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('Failed to load contact:', error);
        return <div className="p-4">Contact not found.</div>;
    }

    const contact = data as Contact;

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
