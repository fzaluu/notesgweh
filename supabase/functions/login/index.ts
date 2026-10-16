// Edge Function: login
// Login email+password dengan kunci server-side:
//   5 kali gagal berturut-turut  ->  login dikunci 1 menit (per email).
// Semua catatan Login berhasil / Login gagal ditulis di sini (service role),
// bukan dari browser, sehingga log tidak bisa dipalsukan.
//
// Deploy: Verify JWT = OFF (fungsi ini memang publik; ia memverifikasi sendiri).
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

const ACT_OK = 'Login berhasil';
const ACT_FAIL = 'Login gagal';

const MSG_INVALID = 'Email atau password salah.';
const MSG_LOCKED = 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, code: 'METHOD', message: 'Method tidak diizinkan.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');

    if (!email || !password) {
      return json({ ok: false, code: 'VALIDATION', message: 'Email dan password wajib diisi.' });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ---- 1. Hitung gagal berturut-turut sejak login berhasil terakhir ----
    const { data: lastOk } = await admin
      .from('activity_logs')
      .select('created_at')
      .eq('email', email)
      .eq('activity', ACT_OK)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let failQuery = admin
      .from('activity_logs')
      .select('created_at')
      .eq('email', email)
      .eq('activity', ACT_FAIL)
      .order('created_at', { ascending: false })
      .limit(500);
    if (lastOk?.created_at) failQuery = failQuery.gt('created_at', lastOk.created_at);

    const { data: fails, error: failErr } = await failQuery;
    if (failErr) throw failErr;

    const failCount = fails?.length ?? 0;
    if (failCount > 0 && failCount % MAX_ATTEMPTS === 0) {
      const elapsed = (Date.now() - new Date(fails![0].created_at).getTime()) / 1000;
      if (elapsed < LOCK_SECONDS) {
        return json({
          ok: false,
          code: 'LOCKED',
          message: MSG_LOCKED,
          retry_after: Math.max(1, Math.ceil(LOCK_SECONDS - elapsed)),
        });
      }
    }

    // ---- 2. Coba login (client terpisah, tanpa menyimpan sesi) ----
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error || !data?.session) {
      await admin.from('activity_logs').insert({
        activity: ACT_FAIL,
        email,
        status: 'failed',
        user_id: null,
      });

      const nowFailCount = failCount + 1;
      if (nowFailCount % MAX_ATTEMPTS === 0) {
        return json({ ok: false, code: 'LOCKED', message: MSG_LOCKED, retry_after: LOCK_SECONDS });
      }

      const code = (error as { code?: string } | null)?.code;
      if (code === 'email_not_confirmed') {
        return json({ ok: false, code: 'EMAIL_NOT_CONFIRMED', message: 'Email belum dikonfirmasi.' });
      }
      return json({ ok: false, code: 'INVALID_CREDENTIALS', message: MSG_INVALID });
    }

    // ---- 3. Berhasil ----
    await admin.from('activity_logs').insert({
      activity: ACT_OK,
      email,
      status: 'success',
      user_id: data.user.id,
    });

    return json({
      ok: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return json({ ok: false, code: 'ERROR', message: 'Terjadi kesalahan saat login. Silakan coba lagi.' }, 500);
  }
});
