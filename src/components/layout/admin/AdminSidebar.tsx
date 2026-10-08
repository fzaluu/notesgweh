import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
  onLogoutClick: () => void;
}

export default function AdminSidebar({ onLogoutClick }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('admin_sidebar_minimized');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('admin_sidebar_minimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  const menuItems = [
    {
      label: 'Dashboard Admin',
      path: '/admin/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
    },
    {
      label: 'Manajemen User',
      path: '/admin/users',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      label: 'Log Aktivitas',
      path: '/admin/logs',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
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
        
        {/* Tombol Toggle Minimize */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          style={{
            position: 'absolute',
            top: '32px',
            right: '-16px',
            width: '32px',
            height: '32px',
            backgroundColor: '#FF5757',
            border: '3px solid #000',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
            zIndex: 20,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isMinimized ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div>
          {/* Logo / Brand Admin */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMinimized ? 'center' : 'flex-start',
            gap: '10px',
            backgroundColor: '#FF5757',
            color: '#FFF',
            border: '3px solid #000',
            borderRadius: '12px',
            padding: isMinimized ? '12px 0' : '12px 14px',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
            marginBottom: '28px',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            {!isMinimized && (
              <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                ADMIN PANEL
              </span>
            )}
          </div>

          {/* Menu Items */}
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

        {/* Tombol Keluar / Logout */}
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
            color: '#FFF',
            border: '3px solid #000',
            borderRadius: '10px',
            fontWeight: 900,
            fontSize: '13px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {!isMinimized && <span>Keluar</span>}
        </button>
      </div>

      <div style={{ width: isMinimized ? '88px' : '260px', flexShrink: 0, transition: 'width 0.2s ease' }} />
    </>
  );
}