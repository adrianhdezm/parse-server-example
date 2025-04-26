#!/bin/bash

# Exit on any error
set -e

echo "🏗️ Building React application..."

# Navigate to web-app directory
cd "$(dirname "$0")/../web/app"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the React app
npm run build

echo "🗑️ Cleaning www directory..."
# Clean the www directory (preserve the directory itself)
rm -rf ../www/*

echo "📋 Copying build files to www directory..."
# Copy all files from dist to www
cp -r dist/* ../www/

# Get APP_ID from .env file (using source to load env vars)
source ../../.env

echo "🔄 Updating Parse app ID in index.html..."
# Use sed to replace both the app ID and server URL in index.html
sed -i '' \
    -e "s|content=\"APP_ID_TO_BE_ADDED\"|content=\"$APP_ID\"|" \
    -e "s|content=\"PARSE_SERVER_API_URL_TO_BE_ADDED\"|content=\"$PARSE_SERVER_API_URL\"|" \
    ../www/index.html

echo "✅ Update completed successfully!"