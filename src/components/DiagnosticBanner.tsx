import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/production-client'

export function DiagnosticBanner() {
  const [status, setStatus] = useState<any>({ loading: true })
  
  useEffect(() => {
    async function checkSupabase() {
      try {
        console.log('🩺 Running Supabase diagnostic...')
        
        // Test 1: Check if client exists
        const clientExists = !!supabase
        console.log('Supabase client exists:', clientExists)
        
        // Test 2: Try to fetch tracks
        const { data, error } = await supabase
          .from('tracks')
          .select('count')
          .limit(1)
        
        console.log('Supabase query result:', { data, error: error?.message })
        
        // Test 3: Check auth state
        const { data: authData } = await supabase.auth.getSession()
        console.log('Auth session:', authData?.session ? 'Exists' : 'None')
        
        setStatus({
          clientExists,
          querySuccess: !error,
          queryError: error?.message,
          authState: authData?.session ? 'authenticated' : 'anonymous'
        })
        
      } catch (err: any) {
        console.error('❌ Diagnostic failed:', err.message)
        setStatus({ error: err.message })
      }
    }
    
    checkSupabase()
  }, [])
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: status.querySuccess ? '#10B981' : '#EF4444',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      opacity: 0.9
    }}>
      {status.loading ? '🔍 Checking Supabase...' : 
       status.querySuccess ? '✅ Supabase Connected' : '❌ Supabase Error'}
    </div>
  )
}
