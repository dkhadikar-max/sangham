#!/bin/sh
set -e

# Strip ?pgbouncer=true so Prisma's schema engine can use the pooler for migrations.
# The schema engine runs raw DDL and does not use prepared statements, so transaction-mode
# pooler works fine. The app (node dist/index.js) keeps the original DATABASE_URL with
# pgbouncer=true for query-engine use.
MIGRATE_URL="${DATABASE_URL%\?pgbouncer=true}"

echo "Running database migrations..."
DATABASE_URL="$MIGRATE_URL" DIRECT_URL="$MIGRATE_URL" npx prisma migrate deploy

echo "Starting server..."
exec node dist/index.js
