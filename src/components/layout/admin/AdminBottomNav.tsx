import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface AdminBottomNavProps {
  onLogoutClick: () => void;
}

export default function AdminBottomNav({ onLogoutClick }: AdminBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State untuk Modal Tambah User
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fungsi Simpan Tambah User Baru
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Buat akun auth via Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // 2. Masukkan atau update role ke tabel profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: data.user.id,
              email: email,
              role: role,
            },
          ]);

        if (profileError) throw profileError;

        // Reset form & tutup modal
        setEmail('');
        setPassword('');
        setRole('user');
        setIsAddUserModalOpen(false);

        // Refresh halaman jika sedang di halaman manajemen user
        if (location.pathname === '/admin/users') {
          window.location.reload();
        } else {
          navigate('/admin/users');
        }
      }
    } catch (err: any) {
      console.error('Gagal menambah user:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat mendaftarkan user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      

      {/* MODAL POP-UP TAMBAH USER BARU */}
      {isAddUserModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '4px solid #000',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                Tambah User Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                style={{
                  backgroundColor: '#FF5757',
                  color: '#FFF',
                  border: '2px solid #000',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                }}
              >
                X
              </button>
            </div>

            {errorMsg && (
              <div style={{
                backgroundColor: '#FF5757',
                color: '#FFF',
                border: '2px solid #000',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: 800,
                marginBottom: '14px',
                boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
              }}>
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Email User</label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#F4F3EC',
                    border: '3px solid #000',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Password Sementara</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#F4F3EC',
                    border: '3px solid #000',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Role / Hak Akses</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    style={{
                      padding: '10px',
                      backgroundColor: role === 'user' ? '#00F0FF' : '#F4F3EC',
                      border: '3px solid #000',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: role === 'user' ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
                      transform: role === 'user' ? 'translate(-2px, -2px)' : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    User
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    style={{
                      padding: '10px',
                      backgroundColor: role === 'admin' ? '#FFDE59' : '#F4F3EC',
                      border: '3px solid #000',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: role === 'admin' ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
                      transform: role === 'admin' ? 'translate(-2px, -2px)' : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#99E885',
                  border: '3px solid #000',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                }}
              >
                {loading ? 'MENYIMPAN...' : 'Simpan User Baru'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar Admin dengan Tombol + Langsung Membuka Modal */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        backgroundColor: '#FFFFFF',
        borderTop: '4px solid #000',
        padding: '10px 12px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxSizing: 'border-box',
        zIndex: 100,
        boxShadow: '0px -4px 0px 0px rgba(0,0,0,1)',
      }}>
        {/* Dashboard */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 10px',
            backgroundColor: location.pathname === '/admin/dashboard' ? '#00F0FF' : '#F4F3EC',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '9px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: location.pathname === '/admin/dashboard' ? '1px 1px 0px 0px rgba(0,0,0,1)' : '2px 2px 0px 0px rgba(0,0,0,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Dashboard</span>
        </button>

        {/* User */}
        <button
          onClick={() => navigate('/admin/users')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 10px',
            backgroundColor: location.pathname === '/admin/users' ? '#00F0FF' : '#F4F3EC',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '9px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: location.pathname === '/admin/users' ? '1px 1px 0px 0px rgba(0,0,0,1)' : '2px 2px 0px 0px rgba(0,0,0,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          <span>User</span>
        </button>

        {/* Tombol Aksi Plus (+) Langsung Membuka Modal Tambah User */}
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: '#99E885',
            border: '3px solid #000',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
            transition: 'transform 0.1s ease',
          }}
          title="Tambah User Baru"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {/* Log */}
        <button
          onClick={() => navigate('/admin/logs')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 10px',
            backgroundColor: location.pathname === '/admin/logs' ? '#00F0FF' : '#F4F3EC',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '9px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: location.pathname === '/admin/logs' ? '1px 1px 0px 0px rgba(0,0,0,1)' : '2px 2px 0px 0px rgba(0,0,0,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>Log</span>
        </button>

        {/* Keluar */}
        <button
          onClick={onLogoutClick}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 10px',
            backgroundColor: '#FF5757',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '9px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Keluar</span>
        </button>
      </div>
    </>
  );
}