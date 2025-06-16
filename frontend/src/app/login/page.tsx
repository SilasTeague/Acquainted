'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import './styles.css';

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter both your username/email and password.');
      return;
    }

    let emailToUse = identifier.trim();

    // If the identifier is not an email, treat it as a username and look it up
    if (!emailToUse.includes('@')) {
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailToUse)
        .single();

      if (lookupError || !profile?.email) {
        setErrorMsg('No account found with that username.');
        return;
      }

      emailToUse = profile.email;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (loginError) {
      setErrorMsg('Incorrect email/username or password.');
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="auth-container">
      <h2>Log In</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
        <input
          type="text"
          placeholder="Username or Email"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Log In</button>
        {errorMsg && <p className="error">{errorMsg}</p>}
      </form>
    </div>
  );
}