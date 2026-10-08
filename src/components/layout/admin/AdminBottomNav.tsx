import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminBottomNavProps {
  onLogoutClick: () => void;
}

export default function AdminBottomNav({ onLogoutClick }: AdminBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      {/* Top Mobile Header Admin */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '60px',
        backgroundColor: '#FFFFFF',
        borderBottom: '4px solid #000',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        zIndex: 100,
      }}>
        <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '13px' }}>
          ADMIN PANEL
        </span>
        <button
          onClick={onLogoutClick}
          title="Keluar"
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: '#FF5757',
            border: '2px solid #000',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* Overlay Gelap Transparan Ketika Menu + Terbuka */}
      {showMenu && (
        <div 
          onClick={() => setShowMenu(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 99,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Menu Pilihan Mengembang dari Tombol + Admin */}
      {showMenu && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 101,
          width: '85%',
          maxWidth: '320px',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translate(-50%, 20px); }
              to { opacity: 1; transform: translate(-50%, 0); }
            }
          `}</style>

          {/* Opsi 1: Manajemen User */}
          <button
            onClick={() => {
              setShowMenu(false);
              navigate('/admin/users');
            }}
            style={{
              backgroundColor: '#00F0FF',
              border: '3px solid #000',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontWeight: 900,
              fontSize: '14px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
            }}
          >
            <div style={{ width: '32px', height: '32px', backgroundColor: '#FFF', border: '2px solid #000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
            Manajemen User
          </button>

          {/* Opsi 2: Log Aktivitas */}
          <button
            onClick={() => {
              setShowMenu(false);
              navigate('/admin/logs');
            }}
            style={{
              backgroundColor: '#FFDE59',
              border: '3px solid #000',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontWeight: 900,
              fontSize: '14px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
            }}
          >
            <div style={{ width: '32px', height: '32px', backgroundColor: '#FFF', border: '2px solid #000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            Log Aktivitas
          </button>
        </div>
      )}

      {/* Bottom Nav Bar Admin dengan Tombol + */}
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
          onClick={() => { setShowMenu(false); navigate('/admin/dashboard'); }}
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
          onClick={() => { setShowMenu(false); navigate('/admin/users'); }}
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

        {/* Tombol Aksi Plus (+) */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: showMenu ? '#FF5757' : '#99E885',
            border: '3px solid #000',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
            transform: showMenu ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease, background-color 0.2s ease',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {/* Log */}
        <button
          onClick={() => { setShowMenu(false); navigate('/admin/logs'); }}
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
          onClick={() => { setShowMenu(false); onLogoutClick(); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 10px',
            backgroundColor: '#FF5757',
            color: '#FFF',
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