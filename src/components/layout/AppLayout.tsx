import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider'; // <-- Sesuaikan path import
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface LayoutContextType {
  openLogoutModal: () => void;
}

const LayoutContext = createContext<LayoutContextType>({ openLogoutModal: () => {} });
export const useLayout = () => useContext(LayoutContext);

export default function AppLayout({ children }: AppLayoutProps) {
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
    <LayoutContext.Provider value={{ openLogoutModal: () => setLogoutModalOpen(true) }}>
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
        `}</style>

        {/* Sidebar Desktop */}
        {!isMobile && <Sidebar onLogoutClick={() => setLogoutModalOpen(true)} />}

        {/* Konten Utama */}
        <div style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          padding: isMobile ? '80px 20px 120px 20px' : '32px 40px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {children}
        </div>

        {/* Bottom Nav Mobile */}
        {isMobile && <BottomNav onLogoutClick={() => setLogoutModalOpen(true)} />}

        {/* MODAL KONFIRMASI KELUAR */}
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
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#FF5757',
                border: '3px solid #000',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                Keluar Aplikasi?
              </h3>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#555', margin: '0 0 20px 0' }}>
                Apakah kamu yakin ingin keluar dari sesi akun saat ini?
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
                    textTransform: 'uppercase',
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
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                  }}
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutContext.Provider>
  );
}