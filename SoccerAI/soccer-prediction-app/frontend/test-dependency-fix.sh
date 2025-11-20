#!/bin/bash

echo "🚀 SoccerAI Frontend Build Test"
echo "================================="

cd frontend

echo "📦 Step 1: Clean install with legacy peer deps..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

echo "✅ Step 2: Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Build completed successfully!"
    echo "📁 Build output in: ./build/"
else
    echo ""
    echo "❌ Build failed. Check the error messages above."
    echo "💡 Try: npm cache clean --force && rm -rf node_modules && npm install --force --legacy-peer-deps"
    exit 1
fi