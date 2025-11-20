#!/bin/bash

# SoccerAI Frontend Build Fix and Test Script
echo "🚀 SoccerAI Frontend Build Fix Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Cleaning up old dependencies...${NC}"
cd /workspace/soccer-prediction-app/frontend

# Remove node_modules and package-lock.json if they exist
if [ -d "node_modules" ]; then
    echo "Removing existing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "Removing existing package-lock.json..."
    rm -f package-lock.json
fi

echo -e "${BLUE}Step 2: Installing dependencies with legacy peer deps...${NC}"
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${BLUE}Step 3: Running build test...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Build successful! Frontend is now ready.${NC}"
    echo -e "${GREEN}Build output can be found in: ./build/${NC}"
else
    echo -e "${RED}❌ Build failed. Please check the error messages above.${NC}"
    echo -e "${YELLOW}Common solutions:${NC}"
    echo "- Clear node_modules: rm -rf node_modules package-lock.json"
    echo "- Reinstall: npm install --legacy-peer-deps"
    echo "- Check for TypeScript errors"
    echo "- Verify all imports and dependencies"
    exit 1
fi

echo -e "${BLUE}Step 4: Verifying build output...${NC}"
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo -e "${GREEN}✅ Build output verified: index.html exists${NC}"
    echo -e "${GREEN}✅ Frontend build completed successfully!${NC}"
else
    echo -e "${RED}❌ Build output verification failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎯 SUCCESS: All frontend build issues have been resolved!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test the application locally: npm start"
echo "2. Test Docker build: docker-compose build frontend"
echo "3. Deploy to production using the provided Docker configuration"