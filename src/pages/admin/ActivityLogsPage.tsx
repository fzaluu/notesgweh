import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/layout/admin/AdminLayout';

interface ActivityLog {
  id: string;
  user_id?: string;
  email?: string;
  activity: string;
  status?: string;
  created_at: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Memanggil fungsi RPC database yang dilindungi oleh verifikasi is_admin()
      const { data, error } = await supabase.rpc('get_activity_logs');

      if (error) throw error;

      setLogs(data || []);
    } catch (err: any) {
      console.error('Gagal memuat log aktivitas:', err);
      // Penanganan error spesifik sesuai panduan keamanan
      if (err?.code === '42501' || err?.message?.includes('Access denied')) {
        setErrorMsg('Akses ditolak: Anda tidak memiliki izin administratif untuk melihat Log Aktivitas.');
      } else {
        setErrorMsg('Gagal memuat log aktivitas. Silakan periksa kembali koneksi atau sesi Anda.');
      }
    } finally {
      setLoading(false);
    }
  };  

  // Filter berdasarkan aktivitas atau email
  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const activity = (log.activity || '').toLowerCase();
    const email = (log.email || '').toLowerCase();
    const status = (log.status || '').toLowerCase();
    return activity.includes(query) || email.includes(query) || status.includes(query);
  });

  // Perhitungan Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
        
        {/* HEADER */}
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
              backgroundColor: '#FFDE59',
              border: '2px solid #000',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 900,
              textTransform: 'uppercase',
              marginBottom: '8px',
              boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
            }}>
              Monitoring Sistem
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
              Log Aktivitas
            </h1>
          </div>
        </div>

        {/* FEEDBACK ERROR */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#FF5757',
            color: '#FFF',
            border: '3px solid #000',
            borderRadius: '12px',
            padding: '14px 18px',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
          }}>
            {errorMsg}
          </div>
        )}

        {/* CSS SKELETON PULSE ANIMATION */}
        <style>{`
          @keyframes pulseSkeleton {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>

        {/* KONTROL UTAMA & LIST LOG */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '4px solid #000',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                Riwayat Aktivitas Pengguna & Admin
              </h3>

              {/* Input Search */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                <span style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#555' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Cari aktivitas atau email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: '#F4F3EC',
                    border: '3px solid #000',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '14px 16px',
                      backgroundColor: '#EAE8DF',
                      border: '3px solid #000',
                      borderRadius: '12px',
                      boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                      gap: '10px',
                      animation: 'pulseSkeleton 1.2s infinite ease-in-out',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '90px', height: '16px', backgroundColor: '#D5D2C4', borderRadius: '4px', border: '1px solid #000' }}></div>
                      <div style={{ width: '120px', height: '12px', backgroundColor: '#D5D2C4', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ width: '70%', height: '18px', backgroundColor: '#D5D2C4', borderRadius: '6px' }}></div>
                    <div style={{ width: '40%', height: '14px', backgroundColor: '#D5D2C4', borderRadius: '4px' }}></div>
                  </div>
                ))}
              </div>
            ) : currentLogs.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#F4F3EC', border: '2px dashed #000', borderRadius: '12px' }}>
                <p style={{ fontWeight: 700, fontSize: '13px', margin: 0, color: '#666' }}>
                  {logs.length === 0 ? 'Belum ada aktivitas tercatat.' : 'Tidak ditemukan log yang cocok dengan pencarian.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '14px 16px',
                      backgroundColor: '#F4F3EC',
                      border: '3px solid #000',
                      borderRadius: '12px',
                      boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: '#00F0FF',
                          border: '2px solid #000',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                        }}>
                          {log.activity}
                        </span>
                        {log.status && (
                          <span style={{
                            backgroundColor: log.status.toLowerCase() === 'success' ? '#99E885' : '#FF5757',
                            color: log.status.toLowerCase() === 'success' ? '#000' : '#FFF',
                            border: '2px solid #000',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                          }}>
                            {log.status}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#555' }}>
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: 900, margin: 0, wordBreak: 'break-word', color: '#000' }}>
                      {log.email ? `Email: ${log.email}` : 'Aktivitas Sistem'}
                    </h4>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #000', paddingTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentPage === 1 ? '#E0E0E0' : '#FFDE59',
                  border: '2px solid #000',
                  borderRadius: '6px',
                  fontWeight: 900,
                  fontSize: '11px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  boxShadow: currentPage === 1 ? 'none' : '2px 2px 0px 0px rgba(0,0,0,1)',
                }}
              >
                Sebelumnya
              </button>

              <span style={{ fontSize: '12px', fontWeight: 900 }}>
                Hal {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentPage === totalPages ? '#E0E0E0' : '#FFDE59',
                  border: '2px solid #000',
                  borderRadius: '6px',
                  fontWeight: 900,
                  fontSize: '11px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  boxShadow: currentPage === totalPages ? 'none' : '2px 2px 0px 0px rgba(0,0,0,1)',
                }}
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}