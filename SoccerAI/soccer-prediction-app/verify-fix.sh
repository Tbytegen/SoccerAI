#!/bin/bash

echo "🔍 Verifying the ajv-keywords fix..."
echo "===================================="

cd soccer-prediction-app/frontend

echo "📦 Step 1: Install dependencies..."
npm install --legacy-peer-deps

echo ""
echo "🔍 Step 2: Check installed ajv version..."
npm ls ajv

echo ""
echo "🔍 Step 3: Check installed ajv-keywords version..."
npm ls ajv-keywords

echo ""
echo "✅ Step 4: Verify the problematic file exists..."
if [ -f "node_modules/ajv-keywords/dist/definitions/typeof.js" ]; then
    echo "✅ typeof.js file exists"
    echo "📄 First few lines of typeof.js:"
    head -10 node_modules/ajv-keywords/dist/definitions/typeof.js
else
    echo "❌ typeof.js file not found"
fi

echo ""
echo "🔧 Step 5: Test the import that was failing..."
node -e "
try {
  const ajvKeywords = require('ajv-keywords');
  console.log('✅ ajv-keywords imports successfully');
  console.log('📦 ajv-keywords version:', require('ajv-keywords/package.json').version);
} catch (error) {
  console.log('❌ Error importing ajv-keywords:', error.message);
}
"

echo ""
echo "🏗️ Step 6: Attempt build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Build completed without ajv errors!"
else
    echo ""
    echo "❌ Build failed. Check the error details above."
fi