#!/bin/sh
set -e

# Ensure node_modules exists and has correct permissions
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/nodemon" ]; then
  echo "Installing dependencies..."
  npm install --include=dev
fi

# Ensure execute permissions on node_modules binaries
chmod -R +x node_modules/.bin 2>/dev/null || true

# Execute the command passed to the entrypoint
exec "$@"
