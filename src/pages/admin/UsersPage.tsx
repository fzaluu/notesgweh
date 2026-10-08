import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/layout/admin/AdminLayout';

interface UserProfile {
  id: string;
  name?: string;
  role: string;
  created_at?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // State Form (Create / Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  // State Modal Delete
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(profiles || []);
    } catch (err: any) {
      console.error('Gagal memuat data pengguna:', err);
      setErrorMsg('Gagal memuat pengguna. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // CREATE / UPDATE User Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (editingId) {
        // Mode Edit (Update ke tabel profiles)
        const { error } = await supabase
          .from('profiles')
          .update({
            name: newName,
            role: newRole,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        setSuccessMsg('Data pengguna berhasil diperbarui.');
      } else {
        // Mode Tambah Baru via Edge Function
        if (!newEmail || !newPassword) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('Sesi Anda telah habis. Silakan login kembali.');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            name: newName,
            email: newEmail,
            password: newPassword,
            role: newRole,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;
        if (data && data.error) {
          throw new Error(data.message || 'Gagal membuat pengguna.');
        }

        setSuccessMsg('Pengguna berhasil dibuat.');
      }

      // Reset Form & Refresh
      handleCancelEdit();
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Trigger
  const handleEditClick = (user: UserProfile) => {
    setEditingId(user.id);
    setNewName(user.name || '');
    setNewRole(user.role || 'user');
    setNewEmail('');
    setNewPassword('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Batal Edit / Reset Form
  const handleCancelEdit = () => {
    setEditingId(null);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('user');
  };

  // DELETE User Handler
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      setSuccessMsg('Pengguna berhasil dihapus dari sistem.');
      setIsDeleteOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      alert('Gagal menghapus pengguna: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  // Filter berdasarkan Nama
  const filteredUsers = users.filter((u) => 
    u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Perhitungan Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
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
              backgroundColor: '#00F0FF',
              border: '2px solid #000',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 900,
              textTransform: 'uppercase',
              marginBottom: '8px',
              boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
            }}>
              Manajemen Sistem
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
              Kelola Pengguna
            </h1>
          </div>
        </div>

        {/* FEEDBACK NOTIFICATION */}
        {successMsg && (
          <div style={{
            backgroundColor: '#99E885',
            border: '3px solid #000',
            borderRadius: '12px',
            padding: '14px 18px',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', fontWeight: 900, cursor: 'pointer' }}>✕</button>
          </div>
        )}

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

        {/* LAYOUT UTAMA: KIRI (FORM), KANAN (LIST USER) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* KOLOM KIRI: FORM TAMBAH / EDIT PENGGUNA */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '4px solid #000',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
            height: 'fit-content',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                {editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    backgroundColor: '#E0E0E0',
                    border: '2px solid #000',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Nama</label>
                <input
                  type="text"
                  placeholder="Nama lengkap"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', backgroundColor: '#F4F3EC', border: '3px solid #000', borderRadius: '10px', fontWeight: 700, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {!editingId && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Email</label>
                    <input
                      type="email"
                      placeholder="email@domain.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', backgroundColor: '#F4F3EC', border: '3px solid #000', borderRadius: '10px', fontWeight: 700, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Password</label>
                    <input
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', backgroundColor: '#F4F3EC', border: '3px solid #000', borderRadius: '10px', fontWeight: 700, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </>
              )}

              {/* Pilihan Role Bergeser Menjadi Gaya Tombol (Seperti di Finance) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewRole('user')}
                    style={{
                      padding: '10px',
                      backgroundColor: newRole === 'user' ? '#99E885' : '#F4F3EC',
                      border: '3px solid #000',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: newRole === 'user' ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
                      transform: newRole === 'user' ? 'translate(-2px, -2px)' : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    User
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    style={{
                      padding: '10px',
                      backgroundColor: newRole === 'admin' ? '#FFDE59' : '#F4F3EC',
                      border: '3px solid #000',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: newRole === 'admin' ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
                      transform: newRole === 'admin' ? 'translate(-2px, -2px)' : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: editingId ? '#00F0FF' : '#99E885',
                  border: '3px solid #000',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                }}
              >
                {isSubmitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Pengguna'}
              </button>
            </form>
          </div>

          {/* KOLOM KANAN: DAFTAR LIST USER, PENCARIAN, SKELETON & PAGINATION */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '4px solid #000',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                  Daftar Pengguna Sistem
                </h3>
              </div>

              {/* Input Search */}
              <div style={{ marginBottom: '16px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#555' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Cari nama pengguna..."
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

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map((item) => (
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
                        <div style={{ width: '70px', height: '16px', backgroundColor: '#D5D2C4', borderRadius: '4px', border: '1px solid #000' }}></div>
                        <div style={{ width: '80px', height: '12px', backgroundColor: '#D5D2C4', borderRadius: '4px' }}></div>
                      </div>
                      <div style={{ width: '50%', height: '18px', backgroundColor: '#D5D2C4', borderRadius: '6px' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '2px dashed rgba(0,0,0,0.2)', paddingTop: '8px', marginTop: '2px' }}>
                        <div style={{ width: '60px', height: '28px', backgroundColor: '#D5D2C4', borderRadius: '6px', border: '2px solid #000' }}></div>
                        <div style={{ width: '60px', height: '28px', backgroundColor: '#D5D2C4', borderRadius: '6px', border: '2px solid #000' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : currentUsers.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F4F3EC', border: '2px dashed #000', borderRadius: '10px' }}>
                  <p style={{ fontWeight: 700, fontSize: '13px', margin: 0, color: '#666' }}>
                    {users.length === 0 ? 'Belum ada pengguna terdaftar.' : 'Tidak ditemukan pengguna yang cocok.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentUsers.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '14px 16px',
                        backgroundColor: '#F4F3EC',
                        border: '3px solid #000',
                        borderRadius: '12px',
                        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: user.role === 'admin' ? '#FFDE59' : '#E0E0E0',
                          border: '2px solid #000',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                        }}>
                          {user.role}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#666' }}>
                          Dibuat: {formatDate(user.created_at)}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '15px', fontWeight: 900, margin: 0, wordBreak: 'break-word' }}>
                        {user.name || 'Tanpa Nama'}
                      </h4>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '2px dashed rgba(0,0,0,0.2)', paddingTop: '8px', marginTop: '2px' }}>
                        <button
                          onClick={() => handleEditClick(user)}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#FFDE59',
                            border: '2px solid #000',
                            borderRadius: '6px',
                            fontWeight: 900,
                            fontSize: '11px',
                            cursor: 'pointer',
                            boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteOpen(true);
                          }}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#FF5757',
                            color: '#FFF',
                            border: '2px solid #000',
                            borderRadius: '6px',
                            fontWeight: 900,
                            fontSize: '11px',
                            cursor: 'pointer',
                            boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #000', paddingTop: '14px', flexWrap: 'wrap', gap: '8px' }}>
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

        {/* MODAL DELETE CONFIRMATION */}
        {isDeleteOpen && userToDelete && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(2px)'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF', border: '4px solid #000', borderRadius: '20px',
              padding: '24px', boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)', width: '100%', maxWidth: '360px', textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                Hapus Pengguna?
              </h3>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#555', margin: '0 0 16px 0' }}>
                Apakah kamu yakin ingin menghapus profil <br/><strong style={{ color: '#000' }}>{userToDelete.name || 'Tanpa Nama'}</strong>?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button type="button" onClick={() => setIsDeleteOpen(false)} style={{ padding: '12px', backgroundColor: '#E0E0E0', border: '3px solid #000', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>Batal</button>
                <button type="button" onClick={handleDeleteUser} style={{ padding: '12px', backgroundColor: '#FF5757', color: '#FFF', border: '3px solid #000', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>Hapus</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}