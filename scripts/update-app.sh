#!/bin/bash

# Exit on any error
set -e

echo "🏗️ Building React application..."

# Navigate to react-app directory
cd "$(dirname "$0")/../web/react-app"

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

echo "✅ Update completed successfully!"
