import fs from 'fs'

// Read the built JS file
const buildFile = 'dist/assets/index-DITQLS4D.js'
if (fs.existsSync(buildFile)) {
  const content = fs.readFileSync(buildFile, 'utf8')
  
  // Check for Supabase URL in bundle
  if (content.includes('uxyvhqtwkutstihtxdsv.supabase.co')) {
    console.log('✅ Supabase URL found in production bundle')
  } else {
    console.log('❌ Supabase URL NOT found in production bundle!')
  }
  
  // Check for tracks query
  if (content.includes('from("tracks")') || content.includes('.from("tracks")')) {
    console.log('✅ Supabase tracks query found in bundle')
  } else {
    console.log('❌ No tracks query found in bundle')
  }
} else {
  console.log('❌ Build file not found')
}
