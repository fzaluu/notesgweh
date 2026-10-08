import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "UNAUTHORIZED", message: "Token otorisasi tidak ditemukan." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Inisialisasi Supabase Client untuk memvalidasi token user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verifikasi user dari token JWT yang dikirim frontend
    const { data: { user: callerUser }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "UNAUTHORIZED", message: "Sesi tidak valid atau kedaluwarsa." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inisialisasi Admin Client untuk mengecek database profiles secara aman
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Periksa role user di tabel profiles menggunakan Admin Client (menghindari RLS block)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .single();

    if (profileError || !profileData || profileData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "FORBIDDEN", message: "Anda tidak memiliki izin admin." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ambil payload dari request body
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "BAD_REQUEST", message: "Data tidak lengkap." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Buat user baru menggunakan Supabase Admin API
    const { data: createdAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: { name, role: role || "user" },
    });

    if (createError) {
      if (createError.message.toLowerCase().includes("already registered")) {
        return new Response(
          JSON.stringify({ error: "CONFLICT", message: "Email tersebut sudah digunakan." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "BAD_REQUEST", message: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (createdAuth && createdAuth.user) {
      const { error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert([
          {
            id: createdAuth.user.id,
            name: name.trim(),
            role: role || "user",
            updated_at: new Date().toISOString(),
          }
        ]);

      if (upsertError) {
        await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
        throw upsertError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Pengguna berhasil dibuat." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "SERVER_ERROR", message: err.message || "Terjadi kesalahan server." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});