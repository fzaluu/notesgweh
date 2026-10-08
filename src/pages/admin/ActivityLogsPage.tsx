import AdminLayout from '../../components/layout/admin/AdminLayout'; // Sesuaikan path

export default function ActivityLogsPage() {
  return (
    <AdminLayout>
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '4px solid #000',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
          Log Aktivitas Sistem
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#555', margin: 0 }}>
          Rekam jejak aktivitas sistem dan keamanan pengguna akan ditampilkan di sini.
        </p>
      </div>
    </AdminLayout>
  );
}