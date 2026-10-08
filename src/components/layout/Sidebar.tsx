import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 1. Tambahkan interface untuk menerima props onLogoutClick
interface SidebarProps {
  onLogoutClick: () => void;
}

export default function Sidebar({ onLogoutClick }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mengambil status minimize terakhir dari localStorage agar tidak reset saat pindah halaman
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebar_minimized');
    return saved ? JSON.parse(saved) : false;
  });

  // Menyimpan perubahan state minimize ke localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_minimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  // Hapus fungsi lokal signOut di sini karena sudah ditangani oleh AppLayout via onLogoutClick

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      label: 'Keuangan',
      path: '/finance',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    },
    {
      label: 'Catatan',
      path: '/notes',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      ),
    },
  ];

  return (
    <>
      <div style={{
        width: isMinimized ? '88px' : '260px',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        borderRight: '4px solid #000',
        padding: isMinimized ? '24px 12px' : '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 10,
        transition: 'width 0.2s ease, padding 0.2s ease',
      }}>
        
        {/* Tombol Toggle Minimize di Garis Tepi Kanan Sidebar */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          style={{
            position: 'absolute',
            top: '32px',
            right: '-16px',
            width: '32px',
            height: '32px',
            backgroundColor: '#FFDE59',
            border: '3px solid #000',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
            zIndex: 20,
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{
              transform: isMinimized ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div>
          {/* Logo / Brand */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMinimized ? 'center' : 'flex-start',
            gap: '10px',
            backgroundColor: '#FFDE59',
            border: '3px solid #000',
            borderRadius: '12px',
            padding: isMinimized ? '12px 0' : '12px 14px',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
            marginBottom: '28px',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            {!isMinimized && (
              <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                BUKU
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={isMinimized ? item.label : ''}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isMinimized ? 'center' : 'flex-start',
                    gap: '12px',
                    width: '100%',
                    padding: isMinimized ? '12px 0' : '11px 14px',
                    backgroundColor: isActive ? '#00F0FF' : '#F4F3EC',
                    border: '3px solid #000',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: isActive ? '2px 2px 0px 0px rgba(0,0,0,1)' : '4px 4px 0px 0px rgba(0,0,0,1)',
                    transform: isActive ? 'translate(2px, 2px)' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  {!isMinimized && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Panggil onLogoutClick dari props ketika tombol Keluar diklik */}
        <button
          onClick={onLogoutClick}
          title={isMinimized ? "Keluar" : ""}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '11px',
            backgroundColor: '#FF5757',
            border: '3px solid #000',
            borderRadius: '10px',
            fontWeight: 900,
            fontSize: '13px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
            transition: 'all 0.1s ease',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {!isMinimized && <span>Keluar</span>}
        </button>
      </div>

      {/* Spacer agar konten utama otomatis menyesuaikan */}
      <div style={{ width: isMinimized ? '88px' : '260px', flexShrink: 0, transition: 'width 0.2s ease' }} />
    </>
  );
}