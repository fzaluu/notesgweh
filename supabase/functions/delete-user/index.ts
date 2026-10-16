// Edge Function: delete-user
// Admin menghapus akun user SECARA PENUH (auth.users).
// Karena foreign key, profil + transaksi + catatan ikut terhapus (CASCADE),
// sedangkan activity_logs.user_id menjadi NULL (histori tetap).
//   body: { user_id }
//   sukses -> { success: true }
//   gagal  -> { error: true, message }
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

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.user_id ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return fail('ID pengguna tidak valid.');
    if (userId === caller.user.id) return fail('Kamu tidak dapat menghapus akunmu sendiri.');

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error('deleteUser error:', delErr);
      return fail('Gagal menghapus pengguna.');
    }

    return json({ success: true });
  } catch (err) {
    console.error('delete-user error:', err);
    return json({ error: true, message: 'Terjadi kesalahan pada server.' }, 500);
  }
});
