// Helper keuangan yang dipakai FinancePage dan BottomNav

// Tanggal lokal (YYYY-MM-DD). toISOString() memakai UTC sehingga di WIB
// (UTC+7) transaksi jam 00:00-07:00 tercatat sebagai tanggal kemarin.
export const getLocalDateString = (): string => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
};

// Database/ERD: transactions.source hanya 'cash' atau 'cashless'.
// Nama dompet (BCA, GoPay, dst.) tetap disimpan di kolom `account`.
export const getSourceFromAccount = (account: string): 'cash' | 'cashless' =>
  account.trim().toLowerCase().startsWith('cash') ? 'cash' : 'cashless';
