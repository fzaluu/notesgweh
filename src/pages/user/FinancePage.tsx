import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import AppLayout from '../../components/layout/AppLayout';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  account: string;
  source: string;
  date: string;
}

export default function FinancePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [account, setAccount] = useState('Cash');

  // State untuk Modal Konfirmasi Hapus
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // State untuk Live Search Dompet / Akun di Form Input
  const [accountSearch, setAccountSearch] = useState('');
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // State untuk Live Search Riwayat Transaksi (Pencarian Judul / Akun)
  const [historySearch, setHistorySearch] = useState('');

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const accountList = ['Cash (Tunai)', 'BCA', 'GoPay', 'OVO', 'Dana', 'ShopeePay', 'Mandiri', 'BRI'];
  const filteredAccounts = accountList.filter(acc => 
    acc.toLowerCase().includes(accountSearch.toLowerCase())
  );

  // Fetch Data Transaksi dari Supabase
  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  // Fungsi untuk memformat angka dengan titik (.) ribuan secara otomatis
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setAmount('');
      return;
    }
    const numericValue = parseInt(rawValue, 10);
    setAmount(numericValue.toLocaleString('id-ID'));
  };

  // Handle Tambah / Update Transaksi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !user) return;

    // Bersihkan titik (.) sebelum dikirim ke database
    const cleanAmount = parseFloat(amount.replace(/\./g, ''));

    try {
      if (editingId) {
        // Proses Update
        const { error } = await supabase
          .from('transactions')
          .update({
            description,
            amount: cleanAmount,
            type,
            account,
            source: account,
          })
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Proses Insert Baru
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
      }

      // Reset form & refresh data
      setDescription('');
      setAmount('');
      setAccount('Cash');
      setEditingId(null);
      fetchTransactions();
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      alert('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  // Handle Edit Trigger
  const handleEditClick = (tx: Transaction) => {
    setEditingId(tx.id);
    setDescription(tx.description);
    setAmount(Number(tx.amount).toLocaleString('id-ID'));
    setType(tx.type);
    setAccount(tx.account || tx.source || 'Cash');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Batal Edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setAccount('Cash');
    setType('income');
  };

  // Buka Modal Konfirmasi Hapus
  const confirmDelete = (id: string) => {
    setTransactionToDelete(id);
    setDeleteModalOpen(true);
  };

  // Eksekusi Hapus Transaksi
  const handleDeleteConfirmed = async () => {
    if (!transactionToDelete) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', transactionToDelete);
      if (error) throw error;
      setTransactions(transactions.filter((tx) => tx.id !== transactionToDelete));
    } catch (err) {
      console.error('Error deleting transaction:', err);
    } finally {
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  // Filter transaksi berdasarkan pencarian riwayat (mencocokkan judul/deskripsi atau akun/source)
  const filteredTransactions = transactions.filter((tx) => {
    const query = historySearch.toLowerCase();
    const desc = (tx.description || '').toLowerCase();
    const acc = (tx.account || tx.source || '').toLowerCase();
    return desc.includes(query) || acc.includes(query);
  });

  // Perhitungan Pagination berdasarkan hasil filter
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  // Hitung Ringkasan Saldo, Pemasukan, Pengeluaran (berdasarkan keseluruhan data transaksi)
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const balance = totalIncome - totalExpense;

  // Custom Hook / Fungsi untuk Animasi Counter Angka dari 0 ke Nilai Asli
  const useAnimatedCounter = (endValue: number, duration: number = 800) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (endValue === 0) {
        setCount(0);
        return;
      }

      let startTime: number | null = null;
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(easeOutProgress * endValue));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setCount(endValue);
        }
      };

      requestAnimationFrame(step);
    }, [endValue, duration]);

    return count;
  };

  const animatedBalance = useAnimatedCounter(balance);
  const animatedIncome = useAnimatedCounter(totalIncome);
  const animatedExpense = useAnimatedCounter(totalExpense);

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
          backgroundColor: '#F7CB46',
          border: '3px solid #000',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
          flexShrink: 0,
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '-0.5px' }}>
            Manajemen Keuangan
          </h1>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#555', margin: '4px 0 0 0' }}>
            Catat dan pantau arus pemasukan, pengeluaran, serta dompet digitalmu.
          </p>
        </div>
      </div>

      {/* Ringkasan Kartu Keuangan dengan Animasi Counter Angka */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Total Saldo */}
        <div style={{ backgroundColor: '#00F0FF', border: '4px solid #000', borderRadius: '16px', padding: '20px', boxShadow: '5px 5px 0px 0px rgba(0,0,0,1)' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Total Saldo</span>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '6px 0 0 0', wordBreak: 'break-word' }}>
            Rp {animatedBalance.toLocaleString('id-ID')}
          </h2>
        </div>

        {/* Pemasukan */}
        <div style={{ backgroundColor: '#99E885', border: '4px solid #000', borderRadius: '16px', padding: '20px', boxShadow: '5px 5px 0px 0px rgba(0,0,0,1)' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Total Pemasukan</span>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '6px 0 0 0', color: '#006600', wordBreak: 'break-word' }}>
            + Rp {animatedIncome.toLocaleString('id-ID')}
          </h2>
        </div>

        {/* Pengeluaran */}
        <div style={{ backgroundColor: '#FF5757', border: '4px solid #000', borderRadius: '16px', padding: '20px', boxShadow: '5px 5px 0px 0px rgba(0,0,0,1)' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#FFF' }}>Total Pengeluaran</span>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '6px 0 0 0', color: '#FFF', wordBreak: 'break-word' }}>
            - Rp {animatedExpense.toLocaleString('id-ID')}
          </h2>
        </div>

      </div>

      {/* Grid Utama: Form Input & Daftar Transaksi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', paddingBottom: '40px' }}>
        
        {/* Form Tambah / Edit Transaksi */}
        <div style={{ backgroundColor: '#FFFFFF', border: '4px solid #000', borderRadius: '20px', padding: '20px', boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
              {editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}
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

            {/* Opsi Tipe (Pemasukan / Pengeluaran) */}
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

            {/* Dompet / Akun dengan Live Search */}
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
              {editingId ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </form>
        </div>

        {/* Riwayat Transaksi dengan Live Search, Skeleton Loading & Pagination */}
        <div style={{ backgroundColor: '#FFFFFF', border: '4px solid #000', borderRadius: '20px', padding: '20px', boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                Riwayat Transaksi
              </h3>
            </div>

            {/* Input Live Search Riwayat dengan Ikon Vektor */}
            <div style={{ marginBottom: '16px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#555' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari keterangan atau dompet (cth: bca, gaji)..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
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

            {/* Animasi CSS untuk Skeleton Pulse */}
            <style>{`
              @keyframes pulseSkeleton {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
              }
            `}</style>

            {loading ? (
              // TAMPILAN SKELETON LOADING KETIKA MEMUAT DATA
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
            ) : filteredTransactions.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F4F3EC', border: '2px dashed #000', borderRadius: '10px' }}>
                <p style={{ fontWeight: 700, fontSize: '12px', margin: 0 }}>
                  {transactions.length === 0 ? 'Belum ada catatan transaksi keuangan.' : 'Tidak ditemukan transaksi yang cocok.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentTransactions.map((tx) => (
                  <div
                    key={tx.id}
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
                    {/* Baris Atas: Badge Akun & Tanggal */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        backgroundColor: '#FFDE59',
                        border: '2px solid #000',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '9px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                      }}>
                        {tx.account || tx.source || 'Cash'}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#555' }}>{tx.date}</span>
                    </div>

                    {/* Baris Tengah: Judul Keterangan Transaksi */}
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: 900, 
                      margin: 0, 
                      color: '#000',
                      wordBreak: 'break-word',
                    }}>
                      {tx.description}
                    </h4>

                    {/* Baris Bawah: Nominal & Tombol Aksi (Edit & Hapus) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed rgba(0,0,0,0.2)', paddingTop: '8px', marginTop: '2px' }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 900,
                        color: tx.type === 'income' ? '#008800' : '#CC0000',
                      }}>
                        {tx.type === 'income' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                      </span>
                      
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {/* Tombol Edit */}
                        <button
                          onClick={() => handleEditClick(tx)}
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
                          onClick={() => confirmDelete(tx.id)}
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
                ))}
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

      {/* MODAL KONFIRMASI HAPUS (NEO-BRUTALISM) */}
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
              Hapus Transaksi?
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#555', margin: '0 0 20px 0' }}>
              Tindakan ini tidak dapat dibatalkan. Apakah kamu yakin ingin menghapus catatan ini?
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