// Test if the production client is a singleton
const client1 = require('@/lib/supabase/production-client').supabase;
const client2 = require('@/lib/supabase/production-client').supabase;

console.log('Same instance?', client1 === client2);
console.log('Window singleton exists?', typeof window !== 'undefined' && !!window.__supabase_prod);
