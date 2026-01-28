#!/bin/bash
set -e

NEW_VER="$1"

if [ -z "$NEW_VER" ]; then
  echo "Usage: ./scripts/bump-and-tag.sh <version>"
  echo "Example: ./scripts/bump-and-tag.sh 1.2.3"
  exit 1
fi

echo "📦 Bumping version to $NEW_VER"

# Update package.json version
npm version $NEW_VER --no-git-tag-version

# Update version.json
cat > public/version.json << EOF
{
  "version": "$NEW_VER",
  "build": "$(git rev-parse --short HEAD 2>/dev/null || echo 'dev')",
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Stage changes
git add package.json package-lock.json public/version.json || true

# Commit
git commit -m "chore(release): $NEW_VER [ci skip]" || echo "No changes to commit"

# Tag
git tag -a "v$NEW_VER" -m "release v$NEW_VER"

echo "✅ Version bumped to $NEW_VER"
echo "📌 Created tag v$NEW_VER"
echo ""
echo "To push:"
echo "  git push origin HEAD"
echo "  git push origin v$NEW_VER"
