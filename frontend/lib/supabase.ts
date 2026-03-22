import { createClient } from '@supabase/supabase-js'

// La URL estaba funcionando bien, así que la dejamos como estaba
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// 🔥 MODO HACKATHON: Hardcodeamos la llave pública para saltear el bug de Vercel
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtb3ZmdHZpeGlhd2tkeGZibWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTQ5ODgsImV4cCI6MjA4OTY3MDk4OH0.iuHQggg47SQp7UVaF9PW3_QMyq9RCXdIVpZNjd6bHmI"

// Dejamos un log chiquito para confirmar que ahora sí la está tomando
console.log("=== SUPERVIVENCIA HACKATHON ===");
console.log("KEY FORZADA:", supabaseKey.substring(0, 15) + "...");

export const supabase = createClient(supabaseUrl, supabaseKey)