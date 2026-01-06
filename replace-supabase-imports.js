const fs = require('fs')
const path = require('path')

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Find all variations of imports
  const patterns = [
    /from ['"]@\/integrations\/supabase\/client['"]/g,
    /from ["']@\/integrations\/supabase\/client["']/g,
    /from ['"]\.\.\/integrations\/supabase\/client['"]/g,
    /from ["']\.\.\/integrations\/supabase\/client["']/g,
    /from ['"]@\/integrations\/supabase\/client\.ts['"]/g,
    /from ["']@\/integrations\/supabase\/client\.ts["']/g
  ]
  
  let newContent = content
  let changed = false
  
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      changed = true
      newContent = newContent.replace(pattern, "from '@/lib/supabase/browser'")
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8')
    console.log(`✅ Updated: ${filePath}`)
    return true
  }
  
  return false
}

function walkDir(dir) {
  const files = fs.readdirSync(dir)
  let updatedCount = 0
  
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      updatedCount += walkDir(fullPath)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Skip the wrapper file itself
      if (!fullPath.includes('lib/supabase/browser.ts')) {
        if (processFile(fullPath)) {
          updatedCount++
        }
      }
    }
  }
  
  return updatedCount
}

console.log('🔄 Replacing Supabase imports...')
const updated = walkDir('src')
console.log(`\n✨ Updated ${updated} files`)
