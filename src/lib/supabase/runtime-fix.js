// Runtime fix for multiple GoTrueClient instances
// Add this to your main App.tsx or index.tsx

if (typeof window !== 'undefined') {
  // Store the first instance
  if (!window.__supabaseOriginal) {
    window.__supabaseOriginal = window.supabase;
  }

  // Override window.supabase getter to return the same instance
  Object.defineProperty(window, 'supabase', {
    get() {
      return window.__supabaseOriginal;
    },
    set(value) {
      // Only set if not already set
      if (!window.__supabaseOriginal) {
        window.__supabaseOriginal = value;
      }
    },
    configurable: true
  });
}
