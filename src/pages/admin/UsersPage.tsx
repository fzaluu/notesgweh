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

  // State Modal Create (Nama, Email, Password, Role)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  // State Modal Edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('user');

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

  // CREATE User Handler via Edge Function (Aman, Tanpa signUp, Sesi Admin Tetap Aktif)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // Ambil session aktif secara manual untuk memastikan token terkirim
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
      setIsCreateOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat membuat pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATE User Handler
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName,
          role: editRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setSuccessMsg('Data pengguna berhasil diperbarui.');
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      alert('Gagal memperbarui pengguna: ' + (err.message || 'Terjadi kesalahan'));
    }
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

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Cari nama pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 14px',
                backgroundColor: '#F4F3EC',
                border: '3px solid #000',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                outline: 'none',
                width: '240px',
                boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
              }}
            />

            <button
              onClick={() => setIsCreateOpen(true)}
              style={{
                padding: '10px 18px',
                backgroundColor: '#99E885',
                border: '3px solid #000',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '13px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Tambah Pengguna
            </button>
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

        {/* TABEL PENGGUNA */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '4px solid #000',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
          overflowX: 'auto',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', fontWeight: 900 }}>Memuat data pengguna...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', fontWeight: 700, color: '#666' }}>
              Belum ada pengguna.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '3px solid #000' }}>
                  <th style={{ padding: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>Nama</th>
                  <th style={{ padding: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>Dibuat</th>
                  <th style={{ padding: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '2px solid #eee' }}>
                    <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: 900 }}>
                      {user.name || 'Tanpa Nama'}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        backgroundColor: user.role === 'admin' ? '#FFDE59' : '#E0E0E0',
                        border: '2px solid #000',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: '12px', fontWeight: 700, color: '#666' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditName(user.name || '');
                            setEditRole(user.role || 'user');
                            setIsEditOpen(true);
                          }}
                          style={{
                            padding: '6px 12px',
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
                            padding: '6px 12px',
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL CREATE USER */}
        {isCreateOpen && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(2px)'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF', border: '4px solid #000', borderRadius: '20px',
              padding: '24px', boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)', width: '100%', maxWidth: '400px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 16px 0' }}>
                Tambah Pengguna Baru
              </h3>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Nama</label>
                  <input type="text" placeholder="Nama lengkap" value={newName} onChange={(e) => setNewName(e.target.value)} required style={{ width: '100%', padding: '10px', backgroundColor: '#F4F3EC', border: '3px solid #000', borderRadius: '8px', fontWeight: 700, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Email</label>
                  <input type="email" placeholder="email@domain.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required style={{ width: '100%', padding: '10px', backgroundColor: '#F4F3EC', border: '3px solid #000', borderRadius: '8px', fontWeight: 700, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Password</label>
                  <input type="password" placeholder="Minimal 6 karakter" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '10px', backgroundColor: '#F4F3EC', border: '3px solid #000', borderRadius: '8px', fontWeight: 700, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#F4F3EC', border: '3px solid #000', borderRadius: '8px', fontWeight: 900, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setIsCreateOpen(false)} style={{ padding: '10px', backgroundColor: '#E0E0E0', border: '3px solid #000', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>Batal</button>
                  <button type="submit" disabled={isSubmitting} style={{ padding: '10px', backgroundColor: '#99E885', border: '3px solid #000', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>{isSubmitting ? 'Membuat...' : 'Simpan'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDIT USER */}
        {isEditOpen && selectedUser && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(2px)'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF', border: '4px solid #000', borderRadius: '20px',
              padding: '24px', boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)', width: '100%', maxWidth: '400px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 16px 0' }}>
                Edit Pengguna
              </h3>
              <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Nama</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ width: '100%', padding: '10px', backgroundColor: '#F4F3EC', border: '3px solid #000', borderRadius: '8px', fontWeight: 700, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Role</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#F4F3EC', border: '3px solid #000', borderRadius: '8px', fontWeight: 900, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setIsEditOpen(false)} style={{ padding: '10px', backgroundColor: '#E0E0E0', border: '3px solid #000', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>Batal</button>
                  <button type="submit" style={{ padding: '10px', backgroundColor: '#FFDE59', border: '3px solid #000', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>Perbarui</button>
                </div>
              </form>
            </div>
          </div>
        )}

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