#!/bin/bash
###
# Docker startup script
###
#
BASE_LOC="/usr/src/app/server/"
SCHEMA_PATH="${BASE_LOC}/schema.prisma"
TEMP_SCHEMA_PATH="${BASE_LOC}/temp_schema.prisma"
BACKUP_SCHEMA_PATH="${BASE_LOC}/config/schema_backup.prisma"


cd ${BASE_LOC}

if [ ! -f ./config/nodeunifi.db ]; then
    npm run db
fi

### DB Diff/Migrate
# Backup the original schema
cp $SCHEMA_PATH $BACKUP_SCHEMA_PATH

# Create a temporary schema file for introspection
cp $SCHEMA_PATH $TEMP_SCHEMA_PATH

# Pull the current database schema into the temporary schema file
npx prisma db pull --schema=$TEMP_SCHEMA_PATH

# Compare the original schema with the introspected schema
if diff $BACKUP_SCHEMA_PATH $TEMP_SCHEMA_PATH > /dev/null; then
    echo "Schemas are identical. No migration needed."
else
    echo "Schemas differ. Running migration..."
    # npx prisma migrate dev --name sync-schema --schema=$SCHEMA_PATH
    npx prisma migrate deploy --schema=$SCHEMA_PATH --preview-feature
fi

# Clean up temporary files
rm -f $TEMP_SCHEMA_PATH
# rm $BACKUP_SCHEMA_PATH


### Startup
npm run start