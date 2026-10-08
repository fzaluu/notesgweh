import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import AppLayout from '../../components/layout/AppLayout';

interface Note {
  id: string;
  title: string;
  content: string;
  type?: 'catatan' | 'tugas';
  deadline?: string;
  created_at: string;
}

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryType, setEntryType] = useState<'catatan' | 'tugas'>('catatan');
  
  // State Tanggal & Jam untuk Tugas (WIB / Asia/Jakarta)
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');

  // State untuk Modal Konfirmasi Hapus
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // State untuk Live Search Catatan
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // Fetch Data Catatan dari Supabase
  const fetchNotes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  // Handle Tambah / Update Catatan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !user) return;

    try {
      let formattedDeadline = null;
      if (entryType === 'tugas' && deadlineDate) {
        // Gabungkan Tanggal dan Jam, lalu jadikan ISO string dengan offset WIB (+07:00)
        const timePart = deadlineTime ? deadlineTime : '23:59';
        formattedDeadline = new Date(`${deadlineDate}T${timePart}:00+07:00`).toISOString();
      }

      const payload = {
        user_id: user.id,
        title,
        content,
        type: entryType,
        deadline: formattedDeadline,
      };

      if (editingId) {
        // Proses Update
        const { error } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Proses Insert Baru
        const { error } = await supabase.from('notes').insert([payload]);
        if (error) throw error;
      }

      // Reset form & refresh data
      setTitle('');
      setContent('');
      setEntryType('catatan');
      setDeadlineDate('');
      setDeadlineTime('');
      setEditingId(null);
      fetchNotes();
    } catch (err: any) {
      console.error('Error saving note:', err);
      alert('Gagal menyimpan entri: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  // Handle Edit Trigger
  const handleEditClick = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setEntryType(note.type || 'catatan');
    
    if (note.deadline) {
      // Pecah ISO string kembali ke tanggal (YYYY-MM-DD) dan jam (HH:MM) lokal WIB
      const dt = new Date(note.deadline);
      // Mengonversi waktu ke zona Asia/Jakarta
      const optionsDate = { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
      const optionsTime = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false } as const;
      
      const dateStr = new Intl.DateTimeFormat('en-CA', optionsDate).format(dt); // Format YYYY-MM-DD
      const timeStr = new Intl.DateTimeFormat('en-GB', optionsTime).format(dt); // Format HH:MM
      
      setDeadlineDate(dateStr);
      setDeadlineTime(timeStr);
    } else {
      setDeadlineDate('');
      setDeadlineTime('');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Batal Edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setEntryType('catatan');
    setDeadlineDate('');
    setDeadlineTime('');
  };

  // Buka Modal Konfirmasi Hapus
  const confirmDelete = (id: string) => {
    setNoteToDelete(id);
    setDeleteModalOpen(true);
  };

  // Eksekusi Hapus Catatan
  const handleDeleteConfirmed = async () => {
    if (!noteToDelete) return;
    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteToDelete);
      if (error) throw error;
      setNotes(notes.filter((note) => note.id !== noteToDelete));
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setDeleteModalOpen(false);
      setNoteToDelete(null);
    }
  };

  // Filter catatan berdasarkan pencarian (judul atau isi)
  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase();
    const t = (note.title || '').toLowerCase();
    const c = (note.content || '').toLowerCase();
    return t.includes(query) || c.includes(query);
  });

  // Perhitungan Pagination
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <AppLayout>
      {/* Header Halaman */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '4px solid #000000',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '45px',
          height: '45px',
          backgroundColor: '#00F0FF',
          border: '3px solid #000',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
          flexShrink: 0,
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '-0.5px' }}>
            Catatan & Tugas
          </h1>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#555', margin: '4px 0 0 0' }}>
            Kelola catatan harian dan daftar tugas beserta tenggat waktu WIB.
          </p>
        </div>
      </div>

      {/* Grid Utama: Form Input & Daftar Catatan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', paddingBottom: '40px' }}>
        
        {/* Form Tambah / Edit Catatan / Tugas */}
        <div style={{ backgroundColor: '#FFFFFF', border: '4px solid #000', borderRadius: '20px', padding: '20px', boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
              {editingId ? 'Edit Entri' : 'Tambah Entri Baru'}
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
            
            {/* Opsi Radio Tipe: Catatan atau Tugas */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Pilih Tipe</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEntryType('catatan')}
                  style={{
                    padding: '10px',
                    backgroundColor: entryType === 'catatan' ? '#00F0FF' : '#F4F3EC',
                    border: '3px solid #000',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: entryType === 'catatan' ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
                    transform: entryType === 'catatan' ? 'translate(-2px, -2px)' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                >
                  Catatan
                </button>

                <button
                  type="button"
                  onClick={() => setEntryType('tugas')}
                  style={{
                    padding: '10px',
                    backgroundColor: entryType === 'tugas' ? '#FFDE59' : '#F4F3EC',
                    border: '3px solid #000',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: entryType === 'tugas' ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
                    transform: entryType === 'tugas' ? 'translate(-2px, -2px)' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                >
                  Tugas
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Judul</label>
              <input
                type="text"
                placeholder={entryType === 'tugas' ? 'Contoh: Selesaikan Laporan Projek' : 'Contoh: Ide Projek Baru'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#F4F3EC',
                  border: '3px solid #000',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Input Tanggal & Jam Deadline (Format Indonesia 24 Jam) */}
            {entryType === 'tugas' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Tanggal Deadline</label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    required={entryType === 'tugas'}
                    style={{
                      width: '100%',
                      padding: '10px 8px',
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
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Jam (24 Jam)</label>
                  <input
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    required={entryType === 'tugas'}
                    style={{
                      width: '100%',
                      padding: '10px 8px',
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
            )}

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Isi Keterangan</label>
              <textarea
                placeholder="Tulis detail catatan atau tugas di sini..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={5}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#F4F3EC',
                  border: '3px solid #000',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: '4px',
                width: '100%',
                padding: '12px',
                backgroundColor: editingId ? '#00F0FF' : '#FFDE59',
                border: '3px solid #000',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '13px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                transition: 'transform 0.1s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-2px, -2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(0, 0)'}
            >
              {editingId ? 'Simpan Perubahan' : 'Simpan Entri'}
            </button>
          </form>
        </div>

        {/* Daftar Catatan & Tugas dengan Live Search, Skeleton & Pagination */}
        <div style={{ backgroundColor: '#FFFFFF', border: '4px solid #000', borderRadius: '20px', padding: '20px', boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                Daftar Catatan & Tugas
              </h3>
            </div>

            {/* Input Live Search dengan Ikon Vektor */}
            <div style={{ marginBottom: '16px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#555' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari judul, isi, atau tugas..."
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

            {/* Animasi CSS Skeleton */}
            <style>{`
              @keyframes pulseSkeleton {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
              }
            `}</style>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px 14px',
                      backgroundColor: '#EAE8DF',
                      border: '3px solid #000',
                      borderRadius: '10px',
                      boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                      gap: '10px',
                      animation: 'pulseSkeleton 1.2s infinite ease-in-out',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '60px', height: '16px', backgroundColor: '#D5D2C4', borderRadius: '4px', border: '1px solid #000' }}></div>
                      <div style={{ width: '70px', height: '12px', backgroundColor: '#D5D2C4', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ width: '80%', height: '18px', backgroundColor: '#D5D2C4', borderRadius: '6px' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed rgba(0,0,0,0.2)', paddingTop: '8px', marginTop: '2px' }}>
                      <div style={{ width: '100px', height: '18px', backgroundColor: '#D5D2C4', borderRadius: '6px' }}></div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ width: '30px', height: '30px', backgroundColor: '#D5D2C4', borderRadius: '6px', border: '2px solid #000' }}></div>
                        <div style={{ width: '30px', height: '30px', backgroundColor: '#D5D2C4', borderRadius: '6px', border: '2px solid #000' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F4F3EC', border: '2px dashed #000', borderRadius: '10px' }}>
                <p style={{ fontWeight: 700, fontSize: '12px', margin: 0 }}>
                  {notes.length === 0 ? 'Belum ada catatan atau tugas tersimpan.' : 'Tidak ditemukan entri yang cocok.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentNotes.map((note) => {
                  const isTask = note.type === 'tugas';
                  return (
                    <div
                      key={note.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '12px 14px',
                        backgroundColor: '#F4F3EC',
                        border: '3px solid #000',
                        borderRadius: '10px',
                        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                        gap: '10px',
                      }}
                    >
                      {/* Baris Atas: Badge Tipe & Deadline WIB */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{
                          backgroundColor: isTask ? '#FFDE59' : '#00F0FF',
                          border: '2px solid #000',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '9px',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                        }}>
                          {isTask ? 'Tugas' : 'Catatan'}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#555' }}>
                            {note.created_at ? new Date(note.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>

                      {/* Judul Entri */}
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: 900, 
                        margin: 0, 
                        color: '#000',
                        wordBreak: 'break-word',
                      }}>
                        {note.title}
                      </h4>

                      {/* Isi Keterangan */}
                      <p style={{ 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        margin: 0, 
                        color: '#333', 
                        wordBreak: 'break-word', 
                        whiteSpace: 'pre-wrap',
                      }}>
                        {note.content}
                      </p>

                      {/* Baris Bawah: Deadline di Kiri, Tombol Aksi di Kanan */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed rgba(0,0,0,0.2)', paddingTop: '8px', marginTop: '2px' }}>
                        <div>
                          {isTask && note.deadline && (
                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#CC0000', backgroundColor: '#FFD1D1', border: '1px solid #000', padding: '2px 6px', borderRadius: '4px' }}>
                              Deadline: {new Date(note.deadline).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          
                          {/* Tombol Edit */}
                          <button
                            onClick={() => handleEditClick(note)}
                            title="Edit"
                            style={{
                              backgroundColor: '#00F0FF',
                              border: '2px solid #000',
                              borderRadius: '6px',
                              width: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            onClick={() => confirmDelete(note.id)}
                            title="Hapus"
                            style={{
                              backgroundColor: '#FF5757',
                              border: '2px solid #000',
                              borderRadius: '6px',
                              width: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigasi Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '2px solid #000', paddingTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
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

              <span style={{ fontSize: '11px', fontWeight: 900 }}>
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

      {/* MODAL KONFIRMASI HAPUS ENTRI */}
      {deleteModalOpen && (
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
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              Hapus Entri?
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#555', margin: '0 0 20px 0' }}>
              Tindakan ini tidak dapat dibatalkan. Apakah kamu yakin ingin menghapus catatan/tugas ini?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
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
                onClick={handleDeleteConfirmed}
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
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}