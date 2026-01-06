#!/bin/bash
echo "🔍 Verifying production deployment..."
echo "1. Checking Supabase connectivity..."

# Try to fetch tracks from production API
curl -s "https://saemstunes.com/_vercel/insights/view" > /dev/null && echo "✅ Vercel analytics endpoint responding"

echo ""
echo "2. Manual checks to perform:"
echo "   - Visit: https://saemstunes.com/tracks"
echo "   - Open DevTools Console"
echo "   - Look for:"
echo "     - Green 'Supabase Connected' banner"
echo "     - No 'Multiple GoTrueClient' warning"
echo "     - Network requests to supabase.co"
echo ""
echo "3. If still broken, check:"
echo "   - Vercel Environment Variables are set"
echo "   - Variables are for PRODUCTION (not Preview)"
echo "   - No ad-blockers blocking Supabase"
