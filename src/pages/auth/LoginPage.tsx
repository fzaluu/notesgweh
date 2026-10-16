import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import PencilLoader from '../../components/ui/PencilLoader';
import ModalOverlay from '../../components/ui/ModalOverlay';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);

  // Deteksi mobile vs desktop supaya ukuran elemen pas di keduanya
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Skala ukuran yang lebih kompak agar muat di layar HP tanpa scroll
  const z = isMobile
    ? { pagePad: '16px', maxW: '380px', cardPad: '24px 20px', badgeMb: '12px', h1: '24px', subMb: '14px', sub: '12px',
        gap: '12px', label: '11px', input: '10px 12px', inputFont: '16px', btn: '12px', btnFont: '13px',
        sep: '14px 0', google: '10px', googleFont: '12px', toggleMt: '14px', toggleFont: '11px' }
    : { pagePad: '24px', maxW: '400px', cardPad: '28px 30px', badgeMb: '14px', h1: '26px', subMb: '20px', sub: '13px',
        gap: '14px', label: '12px', input: '11px 12px', inputFont: '14px', btn: '13px', btnFont: '14px',
        sep: '18px 0', google: '11px', googleFont: '13px', toggleMt: '18px', toggleFont: '12px' };

  // Fungsi Login Email & Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('login', {
        body: { email, password },
      });

      if (error) {
        throw new Error('Terjadi kesalahan saat login. Silakan coba lagi.');
      }
      if (!data?.ok) {
        throw new Error(data?.message || 'Email atau password salah.');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) throw sessionError;

      if (sessionData.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sessionData.session.user.id)
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

  // Fungsi Pendaftaran Akun Mandiri (Otomatis role: user)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (!name.trim()) {
        throw new Error('Nama wajib diisi.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() } },
      });
      if (error) throw error;

      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          throw new Error('Email sudah terdaftar.');
        }

        await supabase.auth.signOut();

        setName('');
        setPassword('');
        setShowPassword(false);
        setShowRegisterSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowRegisterSuccess(false);
    setIsRegisterMode(false);
    setErrorMessage(null);
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal login dengan Google.');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F4F3EC',
          backgroundImage: 'radial-gradient(#d1d1cb 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
        }}
      >
        <PencilLoader />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: z.input,
    border: '3px solid #000',
    borderRadius: '10px',
    backgroundColor: '#F4F3EC',
    fontSize: z.inputFont,
    fontWeight: 700,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: z.label,
    fontWeight: 900,
    textTransform: 'uppercase',
    marginBottom: '4px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F3EC',
        backgroundImage: 'radial-gradient(#d1d1cb 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        padding: z.pagePad,
        boxSizing: 'border-box',
        overflow: 'hidden', // Mencegah scroll total pada halaman utama
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: z.maxW,
          backgroundColor: '#FFFFFF',
          border: '4px solid #000000',
          borderRadius: '16px',
          padding: z.cardPad,
          boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
          boxSizing: 'border-box',
          maxHeight: '100%',
          overflowY: 'auto', // Hanya card jika isinya sangat panjang di layar sangat kecil
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#99E885',
            border: '2px solid #000',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase',
            marginBottom: z.badgeMb,
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
          }}
        >
          {isRegisterMode ? 'Pendaftaran Akun' : 'Secure Portal'}
        </div>

        <h1
          style={{
            fontSize: z.h1,
            fontWeight: 900,
            textTransform: 'uppercase',
            margin: '0 0 4px 0',
            color: '#000',
            lineHeight: 1.1,
          }}
        >
          {isRegisterMode ? 'DAFTAR' : 'LOGIN'}
        </h1>
        <p style={{ fontSize: z.sub, fontWeight: 700, color: '#666', margin: `0 0 ${z.subMb} 0` }}>
          Personal Notes & Finance App
        </p>

        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FF5757',
              color: '#FFF',
              border: '2px solid #000',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 800,
              marginBottom: '14px',
              boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={isRegisterMode ? handleRegister : handleLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: z.gap }}
        >
          {isRegisterMode && (
            <div>
              <label style={labelStyle}>Nama</label>
              <input
                type="text"
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={isRegisterMode ? 6 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                }}
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
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
              padding: z.btn,
              backgroundColor: isRegisterMode ? '#00F0FF' : '#F7CB46',
              border: '4px solid #000',
              borderRadius: '12px',
              fontSize: z.btnFont,
              fontWeight: 900,
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              marginTop: '2px',
            }}
          >
            {isRegisterMode ? 'DAFTAR AKUN BARU' : 'MASUK SEKARANG'}
          </button>
        </form>

        {/* Pemisah */}
        <div style={{ display: 'flex', alignItems: 'center', margin: z.sep, gap: '10px' }}>
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
            padding: z.google,
            backgroundColor: '#FFFFFF',
            border: '3px solid #000',
            borderRadius: '12px',
            fontSize: z.googleFont,
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
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.23 24 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.12 0 9.83 0 11.6s.43 3.48 1.18 5.01l4.09-2.37z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.68 1.18 6.6l4.09 3.15c.95-2.85 3.6-4.96 6.73-4.96z" />
          </svg>
          Masuk dengan Google
        </button>

        {/* Tombol Ganti Mode */}
        <div style={{ marginTop: z.toggleMt, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: z.toggleFont,
              fontWeight: 900,
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: '#000',
              textDecoration: 'underline',
              padding: '4px',
            }}
          >
            {isRegisterMode ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar mandiri'}
          </button>
        </div>
      </div>

      {/* Popup notifikasi pendaftaran berhasil */}
      {showRegisterSuccess && (
        <ModalOverlay>
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%',
              maxWidth: '340px',
              backgroundColor: '#FFFFFF',
              border: '4px solid #000',
              borderRadius: '16px',
              padding: '24px 20px',
              boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 14px auto',
                backgroundColor: '#99E885',
                border: '3px solid #000',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 6px 0' }}>
              Pendaftaran Berhasil!
            </h2>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#444', margin: '0 0 20px 0', lineHeight: 1.4 }}>
              Akun kamu sudah dibuat. Silakan masuk dengan email dan password yang baru didaftarkan.
            </p>

            <button
              type="button"
              onClick={handleCloseSuccess}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#F7CB46',
                border: '4px solid #000',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 900,
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              }}
            >
              Lanjut ke Login
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}