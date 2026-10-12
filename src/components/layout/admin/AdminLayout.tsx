import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import AdminSidebar from './AdminSidebar';
import AdminBottomNav from './AdminBottomNav';
import PencilLoader from '../../../components/ui/PencilLoader'; // 👈 Impor komponen loader pensil

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 👈 State untuk animasi loading saat logout
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConfirmLogout = async () => {
    setLogoutModalOpen(false); // Tutup modal konfirmasi
    setIsLoggingOut(true);     // Tampilkan animasi pensil loading penuh

    try {
      // Beri jeda sebentar agar animasi tampil mulus sebelum sesi admin dihapus
      await new Promise((resolve) => setTimeout(resolve, 800));
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Admin logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // 👇 Tampilkan layar transparan blur dengan animasi pensil saat proses logout admin berjalan
  if (isLoggingOut) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        backdropFilter: 'blur(6px)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}>
        <PencilLoader />
      </div>
    );
  }

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
      
      <style>{`
        div::-webkit-scrollbar { width: 8px; }
        div::-webkit-scrollbar-track { background: #F4F3EC; }
        div::-webkit-scrollbar-thumb { background: #000; border-radius: 4px; }

        @keyframes smoothFade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .page-transition {
          animation: smoothFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Sidebar Desktop Admin */}
      {!isMobile && <AdminSidebar onLogoutClick={() => setLogoutModalOpen(true)} />}

      {/* Konten Utama Admin dengan key={location.pathname} */}
      <div 
        key={location.pathname}
        className="page-transition"
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isMobile ? '20px 20px 100px 20px' : '32px 40px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
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