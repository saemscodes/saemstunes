import('@supabase/supabase-js').then(async ({ createClient }) => {
  const supabase = createClient(
    "https://uxyvhqtwkutstihtxdsv.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eXZocXR3a3V0c3RpaHR4ZHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzY0ODksImV4cCI6MjA2MTAxMjQ4OX0.oR-Jl_hJIVgehVr5J9oEB8WqxZCXREXY07cwFoW5COE"
  )
  
  console.log("Testing Supabase connection...")
  try {
    const { data, error } = await supabase.from('tracks').select('count').limit(1)
    if (error) {
      console.error("Query error:", error.message)
    } else {
      console.log("✅ Successfully connected to Supabase")
      console.log("Response:", data)
    }
  } catch (err) {
    console.error("Connection error:", err.message)
  }
}).catch(err => {
  console.error("Import error:", err.message)
})
