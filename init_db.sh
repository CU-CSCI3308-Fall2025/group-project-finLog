#!/bin/bash

# ============================================================
# init_db.sh
# Initializes your Render PostgreSQL database by running all
# SQL files inside ProjectSourceCode/init_data in order.
#
# IMPORTANT:
# - You MUST replace <EXTERNAL_DB_URL> below with the complete
#   External Database URL from Render (looks like:
#   postgres://user:password@host:5432/dbname )
# - DO NOT commit this file to GitHub (contains credentials)
# ============================================================

PG_URI="postgresql://finlog_db_user:ZxmuQCqLtIV7kRVb3TEB1W2KaCNYPWLr@dpg-d4fob2odl3ps73d3fdc0-a.oregon-postgres.render.com/finlog_db"

echo "Starting database initialization..."
echo "Using database: $PG_URI"

# Run every SQL file in the init_data folder in sorted order
for file in src/init_data/*.sql; do
    echo "Executing $file..."
    psql "$PG_URI" -f "$file"
done

echo "Database initialization complete!"
