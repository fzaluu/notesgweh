import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fungsi Login Email & Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        await supabase.rpc('insert_activity_log', {
          p_activity: 'Login gagal',
          p_email: email,
          p_status: 'failed',
          p_user_id: null
        });
        throw error;
      }

      if (data.session) {
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

  // Fungsi Pendaftaran Akun Mandiri (Otomatis role: user & langsung logout agar kembali ke form masuk)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Masukkan ke tabel profiles dengan role default 'user'
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: data.user.id,
              email: email,
              role: 'user',
            },
          ]);

        if (profileError) throw profileError;

        // 🔥 Langsung logout agar sesi otomatis terhapus dan user harus login manual
        await supabase.auth.signOut();

        setSuccessMessage('Pendaftaran berhasil! Silakan masuk menggunakan akun yang baru dibuat.');
        setIsRegisterMode(false);
        setPassword('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Login dengan Google
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal login dengan Google.');
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
          {isRegisterMode ? 'Pendaftaran Akun' : 'Secure Portal'}
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 4px 0', color: '#000' }}>
          {isRegisterMode ? 'DAFTAR' : 'LOGIN'}
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#666', margin: '0 0 20px 0' }}>
          Personal Notes & Finance App
        </p>

        {errorMessage && (
          <div style={{
            backgroundColor: '#FF5757',
            color: '#FFF',
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

        {successMessage && (
          <div style={{
            backgroundColor: '#99E885',
            color: '#000',
            border: '2px solid #000',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 800,
            marginBottom: '16px',
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)'
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={isRegisterMode ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              backgroundColor: isRegisterMode ? '#00F0FF' : '#F7CB46',
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
            {loading ? 'MEMPROSES...' : (isRegisterMode ? 'DAFTAR AKUN BARU' : 'MASUK SEKARANG')}
          </button>
        </form>

        {/* Pemisah */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '2px', backgroundColor: '#000' }}></div>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#666' }}>Atau</span>
          
          <div style={{ flex: 1, height: '2px', backgroundColor: '#000' }}></div>
        </div>

        {/* Tombol Login Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#FFFFFF',
            border: '3px solid #000',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 900,
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.23 24 12 24z"/>
            <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.12 0 9.83 0 11.6s.43 3.48 1.18 5.01l4.09-2.37z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.68 1.18 6.6l4.09 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
          </svg>
          Masuk dengan Google
        </button>

        {/* Tombol Ganti Mode (Login / Register) */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              fontWeight: 900,
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: '#000',
              textDecoration: 'underline',
            }}
          >
            {isRegisterMode ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar mandiri'}
          </button>
        </div>

      </div>
    </div>
  );
}