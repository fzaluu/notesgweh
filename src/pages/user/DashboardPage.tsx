import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import AppLayout from '../../components/layout/AppLayout';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <AppLayout>
      {/* Header Informasi User */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '4px solid #000000',
        borderRadius: '20px',
        padding: '20px 28px',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '45px',
            height: '45px',
            backgroundColor: '#F7CB46',
            border: '3px solid #000',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div>
            <span style={{
              backgroundColor: '#00F0FF',
              border: '2px solid #000',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 900,
              textTransform: 'uppercase',
              boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)'
            }}>
              {profile?.role || 'User Portal'}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: '4px 0 0 0', color: '#000' }}>
              {profile?.name || user?.email || 'My Workspace'}
            </h2>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div style={{
        backgroundColor: '#99E885',
        border: '4px solid #000',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
      }}>
        <h1 style={{ fontSize: '30px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0', color: '#000', letterSpacing: '-0.5px' }}>
          Dashboard Utama
        </h1>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
          Selamat datang kembali! Pilih menu navigasi di samping (atau di bawah jika menggunakan HP) untuk mulai mengelola keuangan atau catatan pribadimu.
        </p>
      </div>

      {/* Quick Menus Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', paddingBottom: '40px' }}>
        
        {/* Card Keuangan */}
        <div 
          onClick={() => navigate('/finance')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '4px solid #000',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(-2px, -2px)';
            e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0,0,0,1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate(0px, 0px)';
            e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
          }}
        >
          <div style={{ 
            width: '50px', 
            height: '50px', 
            backgroundColor: '#F7CB46', 
            border: '3px solid #000', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '16px',
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Keuangan</h3>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#555', margin: '0 0 20px 0', lineHeight: '1.4' }}>
            Catat pemasukan, pengeluaran, dan target tabungan harian dengan rapi.
          </p>
          <div style={{ display: 'inline-block', fontSize: '13px', fontWeight: 900, borderBottom: '3px solid #000', paddingBottom: '2px' }}>
            Buka Menu Keuangan →
          </div>
        </div>

        {/* Card Catatan */}
        <div 
          onClick={() => navigate('/notes')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '4px solid #000',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(-2px, -2px)';
            e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0,0,0,1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate(0px, 0px)';
            e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
          }}
        >
          <div style={{ 
            width: '50px', 
            height: '50px', 
            backgroundColor: '#FE90E8', 
            border: '3px solid #000', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '16px',
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Catatan</h3>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#555', margin: '0 0 20px 0', lineHeight: '1.4' }}>
            Simpan ide kreatif, tugas penting, dan jurnal harianmu dengan aman.
          </p>
          <div style={{ display: 'inline-block', fontSize: '13px', fontWeight: 900, borderBottom: '3px solid #000', paddingBottom: '2px' }}>
            Buka Menu Catatan →
          </div>
        </div>

      </div>
    </AppLayout>
  );
}