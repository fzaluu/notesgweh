import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Catat log saat login gagal via RPC
        await supabase.rpc('insert_activity_log', {
          p_activity: 'Login gagal',
          p_email: email,
          p_status: 'failed',
          p_user_id: null
        });
        throw error;
      }

      if (data.session) {
        // Catat log saat login berhasil via RPC
        await supabase.rpc('insert_activity_log', {
          p_activity: 'Login berhasil',
          p_email: email,
          p_status: 'success',
          p_user_id: data.session.user.id
        });
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (profile?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F4F3EC',
      margin: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundImage: 'radial-gradient(#d1d1cb 1px, transparent 1px)',
      backgroundSize: '16px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#FFFFFF',
        border: '4px solid #000000',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
        boxSizing: 'border-box',
      }}>
        
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          backgroundColor: '#99E885',
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 900,
          textTransform: 'uppercase',
          marginBottom: '16px',
          boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)'
        }}>
          Secure Portal
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 4px 0', color: '#000' }}>
          LOGIN
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#666', margin: '0 0 20px 0' }}>
          Personal Notes & Finance App
        </p>

        {errorMessage && (
          <div style={{
            backgroundColor: '#FE90E8',
            border: '2px solid #000',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 800,
            marginBottom: '16px',
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)'
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '3px solid #000',
                borderRadius: '10px',
                backgroundColor: '#F4F3EC',
                fontSize: '14px',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 45px 12px 12px',
                  border: '3px solid #000',
                  borderRadius: '10px',
                  backgroundColor: '#F4F3EC',
                  fontSize: '14px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
                title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#F7CB46',
              border: '4px solid #000',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 900,
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              marginTop: '8px',
              transition: 'all 0.1s ease',
            }}
          >
            {loading ? 'MEMPROSES...' : 'MASUK SEKARANG'}
          </button>
        </form>
      </div>
    </div>
  );
}