import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import AdminSidebar from './AdminSidebar';
import AdminBottomNav from './AdminBottomNav'; // <-- Import Bottom Nav Admin

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConfirmLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#F4F3EC',
      backgroundImage: 'radial-gradient(#d1d1cb 1.5px, transparent 1.5px)',
      backgroundSize: '20px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
    }}>
      {/* Sidebar Desktop Admin */}
      {!isMobile && <AdminSidebar onLogoutClick={() => setLogoutModalOpen(true)} />}

      {/* Konten Utama Admin */}
      <div style={{
        flex: 1,
        height: '100vh',
        overflowY: 'auto',
        padding: isMobile ? '20px 20px 100px 20px' : '32px 40px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {children}
      </div>

      {/* Bottom Nav Mobile Admin */}
      {isMobile && <AdminBottomNav onLogoutClick={() => setLogoutModalOpen(true)} />}

      {/* Modal Konfirmasi Logout */}
      {logoutModalOpen && (
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
            maxWidth: '360px',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              Keluar Sesi Admin?
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#555', margin: '0 0 20px 0' }}>
              Apakah Anda yakin ingin keluar dari panel admin?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                style={{
                  padding: '12px',
                  backgroundColor: '#E0E0E0',
                  border: '3px solid #000',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                style={{
                  padding: '12px',
                  backgroundColor: '#FF5757',
                  color: '#FFF',
                  border: '3px solid #000',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                }}
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}