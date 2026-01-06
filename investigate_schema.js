import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from your .env file
dotenv.config({ path: join(__dirname, '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigate() {
  console.log('🔍 Investigating Supabase Schema...')
  console.log(`Connecting to: ${supabaseUrl}`)
  
  try {
    // 1. List ALL tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError)
      // Try alternative method
      const { data: altTables, error: altError } = await supabase.rpc('get_tables')
      if (altError) {
        console.log('Trying direct query via REST...')
      }
    } else {
      console.log(`\n📊 Tables in database (${tables?.length || 0}):`)
      tables?.forEach(t => console.log(`  - ${t.tablename}`))
    }
    
    // 2. Check for common tables your app might use
    const commonTables = ['tracks', 'artists', 'users', 'profiles', 'resources', 'courses']
    console.log('\n🔎 Checking for specific tables:')
    
    for (const table of commonTables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`  ❌ ${table}: ${error.code} - ${error.message}`)
      } else {
        console.log(`  ✅ ${table}: Accessible (sample count: ${data?.length || 0})`)
      }
    }
    
    // 3. Try to get table structure for tracks (if it exists)
    console.log('\n📋 Checking "tracks" table structure (if exists):')
    const { data: trackColumns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'tracks')
      .eq('table_schema', 'public')
    
    if (colError) {
      console.log('  Could not fetch column info:', colError.message)
    } else if (trackColumns && trackColumns.length > 0) {
      console.log(`  Table "tracks" has ${trackColumns.length} columns:`)
      trackColumns.forEach(col => console.log(`    - ${col.column_name} (${col.data_type})`))
    } else {
      console.log('  ⚠️  Table "tracks" might not exist or has no columns')
    }
    
    // 4. Test a simple query that your app might make
    console.log('\n�� Testing a sample query:')
    const { data: sampleData, error: sampleError } = await supabase
      .from('tracks')
      .select('id, title')
      .limit(3)
    
    if (sampleError) {
      console.log(`  Query failed: ${sampleError.code} - ${sampleError.message}`)
      console.log(`  Hint: ${sampleError.hint || 'No hint available'}`)
      console.log(`  Details: ${sampleError.details || 'No details'}`)
    } else {
      console.log(`  ✅ Query successful! Found ${sampleData?.length || 0} tracks`)
      if (sampleData && sampleData.length > 0) {
        console.log('  Sample tracks:', sampleData)
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

investigate()
