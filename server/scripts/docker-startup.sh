#!/bin/bash
###
# Docker startup script
###
#

BASE_LOC="/usr/src/app/server/"
SCHEMA_PATH="${BASE_LOC}/schema.prisma"
BACKUP_SCHEMA_PATH="${BASE_LOC}/config/schema_backup.prisma"
SERVER_LOGS="${BASE_LOC}/config/server_logs"


cd "${BASE_LOC}"

# Create server_logs folder if it doesn't exist
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Check for server_logs dir"
if [ ! -d "${SERVER_LOGS}" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Creating server_logs dir"
    mkdir $SERVER_LOGS
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - server_logs dir already exists"
fi

# Initialize database if it doesn't exist
if [ ! -f ./config/nodeunifi.db ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Initializing database"
    npm run db
fi

### DB Diff/Migrate
# Compare the original schema with the introspected schema
echo "$(date '+%Y-%m-%d %H:%M:%S') - Comparing schemas"
MIGRATION_STATUS=$(npx prisma migrate status --schema=schema.prisma)
if echo "${MIGRATION_STATUS}" | grep -q "Database schema is up to date!"; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Schemas are identical. No migration needed."
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Schemas differ. Running migration..."
    # npx prisma migrate dev --name sync-schema --schema=$SCHEMA_PATH
    npx prisma migrate deploy --schema="$SCHEMA_PATH"
fi


### Startup
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting application"
npm run start