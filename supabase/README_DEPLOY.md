# Deploy (dari folder proyek yang sudah di-link ke Supabase)

1. Salin folder `supabase/` ini menimpa folder `supabase/` di proyek Anda
   (config.toml sudah berisi 3 function; .temp tidak berubah).
2. Deploy Edge Function:
       supabase functions deploy login
       supabase functions deploy create-user
       supabase functions deploy delete-user
3. Buka Dashboard -> SQL Editor -> paste isi `sql/01_perbaikan.sql` -> Run.
   (Sengaja BUKAN di folder migrations supaya tidak ikut `supabase db push`.)
4. Deploy frontend (src-fixed.zip).
5. Opsional: blok G di sql/01_perbaikan.sql setelah frontend baru live.
