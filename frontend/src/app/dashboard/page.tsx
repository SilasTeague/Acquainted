'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import './styles.css';

export default function Dashboard() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserDetails = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.push('/login');
        return;
      }

      const user = session.user;

      // Get profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Failed to load profile:', error?.message);
        router.push('/login');
        return;
      }

      setUsername(profile.username);
      setEmail(profile.email);
      setLoading(false);
    };

    getUserDetails();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="dashboard">Loading your dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Welcome, @{username}!</h1>
      <p>Email: {email}</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}
