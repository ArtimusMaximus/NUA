#!/bin/bash
###
# Database repair and initialization script
# Use this if the main startup script fails
###

set -e

BASE_LOC="/usr/src/app/server/"
cd "${BASE_LOC}"

echo "🔧 Emergency database repair script"
echo "📁 Working directory: $(pwd)"

# Remove potentially corrupted database
if [ -f "./config/nodeunifi.db" ]; then
    echo "⚠️ Backing up existing database..."
    mv "./config/nodeunifi.db" "./config/nodeunifi.db.backup.$(date +%s)"
fi

# Clean Prisma generated files
echo "🧹 Cleaning Prisma files..."
rm -rf ./node_modules/@prisma/client
rm -rf ./node_modules/.prisma

# Reinstall Prisma dependencies
echo "📦 Reinstalling Prisma dependencies..."
npm install @prisma/client prisma

# Generate fresh Prisma client
echo "🔧 Generating fresh Prisma client..."
npx prisma generate --schema=schema.prisma

# Create fresh database with all migrations
echo "🗄️ Creating fresh database..."
npx prisma migrate deploy --schema=schema.prisma

# Test database connection
echo "🔍 Testing database connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(async () => {
    console.log('✅ Database connection successful');
    // Try to read credentials table
    const count = await prisma.credentials.count();
    console.log('✅ Credentials table accessible, record count:', count);
    await prisma.\$disconnect();
  })
  .catch((e) => {
    console.error('❌ Database connection failed:', e.message);
    process.exit(1);
  });
"

echo "✅ Database repair completed successfully"
echo "📋 You can now restart your container"