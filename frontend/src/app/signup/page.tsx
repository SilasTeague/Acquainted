'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import './styles.css';

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async () => {
    setErrorMsg('');

    // Basic validation
    if (!displayName.trim() || !email.trim() || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    // Sign up with metadata (Supabase stores this in user.user_metadata)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (!data.user) {
      setErrorMsg('Sign-up successful, but no user returned.');
      return;
    }

    // Redirect to dashboard (or ask user to confirm email)
    router.push('/dashboard');
  };

  return (
    <div className="auth-container">
      <h2>Create an Account</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
        <input
          type="text"
          placeholder="Display Name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign Up</button>
        {errorMsg && <p className="error">{errorMsg}</p>}
      </form>
    </div>
  );
}
