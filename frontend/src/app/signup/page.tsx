'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import './styles.css';

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async () => {
    setErrorMsg('');

    // Basic validation
    if (!username.trim() || !email.trim() || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    // Check if username is taken
    const { data: existingUser} = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (existingUser) {
      setErrorMsg('Username is already taken.');
      return;
    }

    // Create the user
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signupError) {
      setErrorMsg(signupError.message);
      return;
    }

    const user = signupData.user;
    if (!user) {
      setErrorMsg('Sign-up successful, but no user returned.');
      return;
    }

    // Add to profiles table
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: user.id,
        username: username.trim(),
        email: email.trim(),
      },
    ]);

    if (profileError) {
      setErrorMsg('Account created, but failed to save profile.');
      return;
    }

    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <div className="auth-container">
      <h2>Create an Account</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
        <input
          type="text"
          placeholder="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
