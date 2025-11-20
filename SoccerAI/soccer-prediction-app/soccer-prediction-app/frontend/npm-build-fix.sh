#!/bin/bash

echo "🚀 SoccerAI Frontend Build - NPM Compatible Fix"
echo "==============================================="

echo "📋 What this script does:"
echo "1. Removes problematic dependency resolution conflicts"
echo "2. Uses npm-compatible versions"
echo "3. Performs a clean build"
echo ""

cd frontend

echo "🧹 Step 1: Clean removal of node_modules and lock file..."
rm -rf node_modules package-lock.json

echo "📦 Step 2: Fresh install with npm..."
npm install --legacy-peer-deps

echo "🔨 Step 3: Building the frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Frontend build completed successfully!"
    echo "📁 Build files are in: ./build/"
    echo ""
    echo "✅ Your frontend is ready to deploy!"
else
    echo ""
    echo "❌ Build failed. Trying alternative approach..."
    echo ""
    echo "🧪 Alternative: Try with force flag..."
    npm run build -- --force
fi