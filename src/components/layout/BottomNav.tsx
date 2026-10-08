import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { supabase } from '../../lib/supabase';

interface BottomNavProps {
  onLogoutClick: () => void;
}

export default function BottomNav({ onLogoutClick }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); 
  const [showMenu, setShowMenu] = useState(false);

  // State untuk Modal Form Tambah Keuangan
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [account, setAccount] = useState('Cash');

  // State Live Search Dompet / Akun di Modal Keuangan
  const [accountSearch, setAccountSearch] = useState('');
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // State untuk Modal Form Tambah Catatan / Tugas
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [entryType, setEntryType] = useState<'catatan' | 'tugas'>('catatan');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');

  const accountList = ['Cash (Tunai)', 'BCA', 'GoPay', 'OVO', 'Dana', 'ShopeePay', 'Mandiri', 'BRI'];
  const filteredAccounts = accountList.filter(acc => 
    acc.toLowerCase().includes(accountSearch.toLowerCase())
  );



  // Format angka ribuan otomatis untuk keuangan
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setAmount('');
      return;
    }
    const numericValue = parseInt(rawValue, 10);
    setAmount(numericValue.toLocaleString('id-ID'));
  };

  // Simpan Transaksi dari Modal BottomNav ke Supabase
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !user) return;

    const cleanAmount = parseFloat(amount.replace(/\./g, ''));

    try {
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          description,
          amount: cleanAmount,
          type,
          account,
          source: account,
          date: new Date().toISOString().split('T')[0],
        },
      ]);

      if (error) throw error;

      // Reset & tutup modal
      setDescription('');
      setAmount('');
      setAccount('Cash');
      setType('income');
      setIsFinanceModalOpen(false);

      if (location.pathname === '/finance') {
        window.location.reload();
      } else {
        navigate('/finance');
      }
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      alert('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  // Simpan Catatan / Tugas dari Modal BottomNav ke Supabase
  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteContent || !user) return;

    try {
      let formattedDeadline = null;
      if (entryType === 'tugas' && deadlineDate) {
        const timePart = deadlineTime ? deadlineTime : '23:59';
        formattedDeadline = new Date(`${deadlineDate}T${timePart}:00+07:00`).toISOString();
      }

      const { error } = await supabase.from('notes').insert([
        {
          user_id: user.id,
          title: noteTitle,
          content: noteContent,
          type: entryType,
          deadline: formattedDeadline,
        },
      ]);

      if (error) throw error;

      // Reset & tutup modal
      setNoteTitle('');
      setNoteContent('');
      setEntryType('catatan');
      setDeadlineDate('');
      setDeadlineTime('');
      setIsNoteModalOpen(false);

      if (location.pathname === '/notes') {
        window.location.reload();
      } else {
        navigate('/notes');
      }
    } catch (err: any) {
      console.error('Error saving note:', err);
      alert('Gagal menyimpan catatan: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  return (
    <>
      {/* Top Mobile Header */}
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
          BUKU
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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Menu Pilihan Mengembang dari Tombol + */}
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

          {/* Opsi 1: Tambah Keuangan */}
          <button
            onClick={() => {
              setShowMenu(false);
              setIsFinanceModalOpen(true);
            }}
            style={{
              backgroundColor: '#F7CB46',
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
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            Tambah Keuangan
          </button>

          {/* Opsi 2: Tambah Catatan (Buka Modal) */}
          <button
            onClick={() => {
              setShowMenu(false);
              setIsNoteModalOpen(true);
            }}
            style={{
              backgroundColor: '#FE90E8',
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
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            Tambah Catatan
          </button>
        </div>
      )}

      {/* MODAL POP-UP TAMBAH KEUANGAN */}
      {isFinanceModalOpen && (
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
            maxWidth: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                Tambah Transaksi Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsFinanceModalOpen(false)}
                style={{
                  backgroundColor: '#FF5757',
                  color: '#FFF',
                  border: '2px solid #000',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                }}
              >
                X
              </button>
            </div>
            
            <form onSubmit={handleSubmitTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Judul / Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Gaji / Belanja"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Jumlah (Rp)</label>
                <input
                  type="text"
                  placeholder="50.000"
                  value={amount}
                  onChange={handleAmountChange}
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

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Tipe</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    style={{
                      padding: '10px',
                      backgroundColor: type === 'income' ? '#99E885' : '#F4F3EC',
                      border: '3px solid #000',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: type === 'income' ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
                      transform: type === 'income' ? 'translate(-2px, -2px)' : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    Pemasukan
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    style={{
                      padding: '10px',
                      backgroundColor: type === 'expense' ? '#FF5757' : '#F4F3EC',
                      color: type === 'expense' ? '#FFF' : '#000',
                      border: '3px solid #000',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: type === 'expense' ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
                      transform: type === 'expense' ? 'translate(-2px, -2px)' : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Dompet / Akun</label>
                <div
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#F4F3EC',
                    border: '3px solid #000',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{account}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isAccountOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

                {isAccountOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    border: '3px solid #000',
                    borderRadius: '10px',
                    boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                    zIndex: 50,
                    padding: '8px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    <input
                      type="text"
                      placeholder="Cari dompet..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#F4F3EC',
                        border: '2px solid #000',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '12px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />

                    <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredAccounts.length === 0 ? (
                        <div style={{ padding: '8px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'center' }}>
                          Tidak ditemukan
                        </div>
                      ) : (
                        filteredAccounts.map((acc) => {
                          const cleanName = acc.split(' ')[0];
                          return (
                            <div
                              key={acc}
                              onClick={() => {
                                setAccount(cleanName);
                                setIsAccountOpen(false);
                                setAccountSearch('');
                              }}
                              style={{
                                padding: '8px 10px',
                                backgroundColor: account === cleanName ? '#FFDE59' : 'transparent',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '12px',
                                cursor: 'pointer',
                                border: account === cleanName ? '2px solid #000' : '2px solid transparent',
                              }}
                            >
                              {acc}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#FFDE59',
                  border: '3px solid #000',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                }}
              >
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POP-UP TAMBAH CATATAN & TUGAS */}
      {isNoteModalOpen && (
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
            maxWidth: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                Tambah Catatan / Tugas Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                style={{
                  backgroundColor: '#FF5757',
                  color: '#FFF',
                  border: '2px solid #000',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                }}
              >
                X
              </button>
            </div>
            
            <form onSubmit={handleSubmitNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  placeholder={entryType === 'tugas' ? 'Contoh: Selesaikan Laporan' : 'Contoh: Ide Projek Baru'}
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
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
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  required
                  rows={4}
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
                  marginTop: '8px',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#FFDE59',
                  border: '3px solid #000',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                }}
              >
                Simpan Entri
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
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
        {/* Beranda */}
        <button
          onClick={() => { setShowMenu(false); navigate('/dashboard'); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 10px',
            backgroundColor: location.pathname === '/dashboard' ? '#00F0FF' : '#F4F3EC',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '9px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: location.pathname === '/dashboard' ? '1px 1px 0px 0px rgba(0,0,0,1)' : '2px 2px 0px 0px rgba(0,0,0,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Beranda</span>
        </button>

        {/* Keuangan */}
        <button
          onClick={() => { setShowMenu(false); navigate('/finance'); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 10px',
            backgroundColor: location.pathname === '/finance' ? '#00F0FF' : '#F4F3EC',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '9px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: location.pathname === '/finance' ? '1px 1px 0px 0px rgba(0,0,0,1)' : '2px 2px 0px 0px rgba(0,0,0,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span>Keuangan</span>
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

        {/* Catatan */}
        <button
          onClick={() => { setShowMenu(false); navigate('/notes'); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 10px',
            backgroundColor: location.pathname === '/notes' ? '#00F0FF' : '#F4F3EC',
            border: '2px solid #000',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '9px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: location.pathname === '/notes' ? '1px 1px 0px 0px rgba(0,0,0,1)' : '2px 2px 0px 0px rgba(0,0,0,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <span>Catatan</span>
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