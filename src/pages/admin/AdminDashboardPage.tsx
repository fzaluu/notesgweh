import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/layout/admin/AdminLayout';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAdmins: number;
  loginSuccess: number;
  loginFailed: number;
}

interface ActivityLogItem {
  id: string;
  email?: string;
  activity: string;
  status: 'success' | 'failed';
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAdmins: 0,
    loginSuccess: 0,
    loginFailed: 0,
  });
  const [recentActivities, setRecentActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const totalUsers = profiles?.length || 0;
      const totalAdmins = profiles?.filter((p) => p.role === 'admin').length || 0;
      const activeUsers = totalUsers; 

      let successCount = 0;
      let failedCount = 0;
      let logsData: ActivityLogItem[] = [];

      // Mengambil data log menggunakan RPC get_activity_logs agar konsisten dan aman dari RLS 403
      const { data: logs, error: logsError } = await supabase.rpc('get_activity_logs');

      if (!logsError && logs) {
        successCount = logs.filter((l: any) => l.status?.toLowerCase() === 'success').length;
        failedCount = logs.filter((l: any) => l.status?.toLowerCase() === 'failed').length;
        
        logsData = logs.slice(0, 5).map((l: any) => ({
          id: l.id,
          email: l.email || 'Sistem / Anonim',
          activity: l.activity || 'Aktivitas sistem',
          status: (l.status?.toLowerCase() === 'failed' ? 'failed' : 'success') as 'success' | 'failed',
          created_at: l.created_at,
        }));
      }

      setStats({
        totalUsers,
        activeUsers,
        totalAdmins,
        loginSuccess: successCount,
        loginFailed: failedCount,
      });

      setRecentActivities(logsData);
    } catch (err: any) {
      console.error('Gagal memuat data dashboard admin:', err);
      setErrorMsg('Gagal memuat data dari server. Pastikan sesi admin aktif.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ' • ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
        
        {/* 1. HEADER */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '4px solid #000',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#FF5757',
              color: '#FFF',
              border: '2px solid #000',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 900,
              textTransform: 'uppercase',
              marginBottom: '8px',
              boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
            }}>
              Panel Kontrol Utama
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
              Dashboard Admin
            </h1>
          </div>

          <button
            onClick={fetchAdminDashboardData}
            style={{
              padding: '12px 20px',
              backgroundColor: '#FFDE59',
              border: '3px solid #000',
              borderRadius: '10px',
              fontWeight: 900,
              fontSize: '13px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.1s ease',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.23-5.19"></path>
            </svg>
            Muat Ulang Data
          </button>
        </div>

        {/* Error State Banner */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#FF5757',
            color: '#FFF',
            border: '3px solid #000',
            borderRadius: '12px',
            padding: '16px',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
          }}>
            {errorMsg}
          </div>
        )}

        {/* 2. USER OVERVIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            User Overview
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}>
            {/* Card 1: Total User */}
            <div style={{
              backgroundColor: '#00F0FF',
              border: '4px solid #000',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                Total User
              </span>
              <span style={{ fontSize: '32px', fontWeight: 900 }}>
                {loading ? '...' : stats.totalUsers}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8 }}>
                Jumlah seluruh akun terdaftar
              </span>
            </div>

            {/* Card 2: User Aktif */}
            <div style={{
              backgroundColor: '#99E885',
              border: '4px solid #000',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                User Aktif
              </span>
              <span style={{ fontSize: '32px', fontWeight: 900 }}>
                {loading ? '...' : stats.activeUsers}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8 }}>
                Jumlah akun aktif dalam sistem
              </span>
            </div>

            {/* Card 3: Total Admin */}
            <div style={{
              backgroundColor: '#FFDE59',
              border: '4px solid #000',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                Total Admin
              </span>
              <span style={{ fontSize: '32px', fontWeight: 900 }}>
                {loading ? '...' : stats.totalAdmins}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8 }}>
                Jumlah akun berhak akses admin
              </span>
            </div>
          </div>
        </div>

        {/* 3. ACTIVITY OVERVIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            Activity Overview
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}>
            {/* Card 1: Login Berhasil */}
            <div style={{
              backgroundColor: '#99E885',
              border: '4px solid #000',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                Login Berhasil
              </span>
              <span style={{ fontSize: '32px', fontWeight: 900 }}>
                {loading ? '...' : stats.loginSuccess}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8 }}>
                Akumulasi login sukses
              </span>
            </div>

            {/* Card 2: Login Gagal */}
            <div style={{
              backgroundColor: '#FF5757',
              color: '#FFF',
              border: '4px solid #000',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                Login Gagal
              </span>
              <span style={{ fontSize: '32px', fontWeight: 900 }}>
                {loading ? '...' : stats.loginFailed}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.9 }}>
                Akumulasi percobaan login gagal
              </span>
            </div>
          </div>
        </div>

        {/* 4. AKTIVITAS TERBARU */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '4px solid #000',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
              Aktivitas Terbaru
            </h2>
            <button
              onClick={() => navigate('/admin/logs')}
              style={{
                background: 'none',
                border: 'none',
                fontWeight: 900,
                fontSize: '12px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Lihat Semua →
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', fontWeight: 800 }}>Memuat aktivitas...</div>
          ) : recentActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', fontWeight: 700, color: '#666' }}>
              Belum ada aktivitas terbaru.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentActivities.map((log) => (
                <div key={log.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: '#F4F3EC',
                  border: '2px solid #000',
                  borderRadius: '10px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 900 }}>{log.email || 'Sistem'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: log.status === 'success' ? '#99E885' : '#FF5757',
                      color: log.status === 'success' ? '#000' : '#FFF',
                      border: '2px solid #000',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                    }}>
                      {log.activity}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#666' }}>
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. QUICK ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            <button
              onClick={() => navigate('/admin/users')}
              style={{
                padding: '16px 20px',
                backgroundColor: '#00F0FF',
                border: '3px solid #000',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '13px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                <span>Kelola User</span>
              </div>
              <span>→</span>
            </button>

            <button
              onClick={() => navigate('/admin/logs')}
              style={{
                padding: '16px 20px',
                backgroundColor: '#FE90E8',
                border: '3px solid #000',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '13px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>Log Aktivitas</span>
              </div>
              <span>→</span>
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}