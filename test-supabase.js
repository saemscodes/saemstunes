const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://uxyvhqtwkutstihtxdsv.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eXZocXR3a3V0c3RpaHR4ZHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzY0ODksImV4cCI6MjA2MTAxMjQ4OX0.oR-Jl_hJIVgehVr5J9oEB8WqxZCXREXY07cwFoW5COE"

try {
  const supabase = createClient(supabaseUrl, supabaseKey)
  console.log("✅ Supabase client created successfully")
  console.log("URL:", supabaseUrl)
  console.log("Key starts with:", supabaseKey.substring(0, 20) + "...")
} catch (error) {
  console.error("❌ Error creating Supabase client:", error.message)
}
