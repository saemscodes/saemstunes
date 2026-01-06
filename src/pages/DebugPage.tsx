import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export default function DebugPage() {
  const [status, setStatus] = useState<any>({})
  const [tracks, setTracks] = useState<any[]>([])
  
  useEffect(() => {
    async function runDiagnostics() {
      const diagnostics: any = {}
      
      // 1. Check if supabase client exists
      diagnostics.supabaseExists = !!supabase
      diagnostics.supabaseUrl = supabase?.supabaseUrl
      
      // 2. Check environment variables
      diagnostics.envVars = {
        NEXT_PUBLIC_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
        hasUrl: !!(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)
      }
      
      // 3. Try to fetch tracks
      try {
        const { data, error } = await supabase
          .from('tracks')
          .select('id, title')
          .limit(3)
        
        diagnostics.tracksFetch = {
          success: !error,
          error: error?.message,
          count: data?.length || 0
        }
        
        if (data) setTracks(data)
      } catch (err: any) {
        diagnostics.tracksFetch = { error: err.message }
      }
      
      // 4. Check window object
      diagnostics.windowProps = {
        location: window.location.href,
        hasLocalStorage: !!window.localStorage
      }
      
      setStatus(diagnostics)
    }
    
    runDiagnostics()
  }, [])
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Production Debug Page</h1>
      <pre>{JSON.stringify(status, null, 2)}</pre>
      
      <h2>Sample Tracks:</h2>
      <ul>
        {tracks.map(track => (
          <li key={track.id}>{track.title} ({track.id})</li>
        ))}
      </ul>
      
      <h2>Environment:</h2>
      <pre>{JSON.stringify({
        nodeEnv: import.meta.env.MODE,
        isProduction: import.meta.env.PROD,
        baseUrl: import.meta.env.BASE_URL
      }, null, 2)}</pre>
    </div>
  )
}
