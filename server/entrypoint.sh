#!/bin/sh
# Waiting until Postgres is available 
echo "Running migrations..."
npx knex migrate:latest --env development --knexfile=db/knexfile.js
echo "Running seeds..."
npx knex seed:run --env development --knexfile=db/knexfile.js

echo "Starting the server..."
exec node express_backend.js
