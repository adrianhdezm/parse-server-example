#!/bin/bash

# Exit on any error
set -e

# Determine project root (one level up from this scripts folder)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "🔧 Project root directory: $ROOT_DIR"

# Define key paths
APP_DIR="$ROOT_DIR/web/app"
WWW_DIR="$ROOT_DIR/web/www"
ENV_FILE="$ROOT_DIR/.env"

echo "🏗️ Building React application in $APP_DIR..."

# Navigate to react-app directory
cd "$APP_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the React app
npm run build

echo "🗑️ Cleaning www directory at $WWW_DIR..."
# Clean the www directory (preserve the directory itself)
rm -rf "$WWW_DIR"/*

echo "📋 Copying build files to $WWW_DIR..."
# Copy all files from dist to www
cp -r dist/* "$WWW_DIR"/

# Load environment variables
source "$ENV_FILE"

echo "🔄 Updating Parse config in $WWW_DIR/index.html..."
# Replace APP_ID and server URL placeholders
sed -i '' \
    -e "s|content=\"APP_ID_TO_BE_ADDED\"|content=\"$APP_ID\"|" \
    -e "s|content=\"PARSE_SERVER_API_URL_TO_BE_ADDED\"|content=\"$PARSE_SERVER_API_URL\"|" \
    "$WWW_DIR/index.html"

echo "✅ Update completed successfully!"
