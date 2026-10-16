// Edge Function: create-user  (menggantikan versi lama)
// Admin membuat akun baru. Kontrak sama dengan yang dipakai UsersPage:
//   body: { name, email, password, role }
//   sukses -> { success: true, user_id }
//   gagal  -> { error: true, message }
//
// Deploy: Verify JWT boleh ON atau OFF (fungsi memverifikasi sendiri).
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
const fail = (message: string) => json({ error: true, message });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: true, message: 'Method tidak diizinkan.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ---- Verifikasi pemanggil: harus admin ----
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) return fail('Sesi tidak valid. Silakan login kembali.');

    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) return fail('Sesi tidak valid. Silakan login kembali.');

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', caller.user.id)
      .maybeSingle();
    if (callerProfile?.role !== 'admin') return fail('Kamu tidak memiliki akses untuk aksi ini.');

    // ---- Validasi input ----
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    const role = body?.role === 'admin' ? 'admin' : 'user';
    const name =
      String(body?.name ?? '').trim() || email.split('@')[0] || 'New User';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Format email tidak valid.');
    if (password.length < 6) return fail('Password minimal 6 karakter.');

    // ---- Buat akun auth ----
    // role disimpan di app_metadata (hanya bisa diisi server-side)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
      app_metadata: { role },
    });

    if (createErr || !created?.user) {
      const code = (createErr as { code?: string } | null)?.code;
      const msg = createErr?.message ?? '';
      if (code === 'email_exists' || /already|registered|exists/i.test(msg)) {
        return fail('Email sudah digunakan.');
      }
      console.error('createUser error:', createErr);
      return fail('Gagal membuat pengguna.');
    }

    // ---- Pastikan profil sesuai (trigger handle_new_user sudah membuatnya) ----
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert({ id: created.user.id, name, role }, { onConflict: 'id' });
    if (profileErr) {
      // Rollback: hapus akun auth agar tidak ada akun tanpa profil
      console.error('profile upsert error:', profileErr);
      await admin.auth.admin.deleteUser(created.user.id);
      return fail('Gagal menyimpan profil pengguna. Silakan coba lagi.');
    }

    return json({ success: true, user_id: created.user.id });
  } catch (err) {
    console.error('create-user error:', err);
    return json({ error: true, message: 'Terjadi kesalahan pada server.' }, 500);
  }
});
