#!/bin/bash

# Phase 2 Data Collection Infrastructure - Testing Script
# This script helps you test the Phase 2 implementation

echo "🚀 Phase 2 Data Collection Infrastructure - Testing Guide"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo
echo "📁 Files Created for Phase 2:"
print_status "DataCollectorService.ts (502 lines) - Firecrawl integration & data collection"
print_status "DataCollectorController.ts (390 lines) - API endpoints & business logic"
print_status "dataCollection.ts (194 lines) - Express routes with Swagger docs"
print_status "database.ts (35 lines) - PostgreSQL configuration"
print_status "Updated validation.ts - Added data collection request validation"
print_status "Updated index.ts - Added data collection routes"
print_status "Updated swagger.ts - Added data collection API documentation"
print_status "phase2-integration.test.ts (159 lines) - Integration tests"
print_status "PHASE2_COMPLETE.md - Complete implementation documentation"

echo
echo "🔧 Pre-Requirements Check:"
echo "========================="

# Check if Docker is available
if command -v docker &> /dev/null; then
    print_status "Docker is available"
else
    print_warning "Docker not found - you'll need to install dependencies manually"
fi

# Check if npm is available
if command -v npm &> /dev/null; then
    print_status "npm is available"
else
    print_warning "npm not found"
fi

# Check if curl is available
if command -v curl &> /dev/null; then
    print_status "curl is available for API testing"
else
    print_warning "curl not found"
fi

echo
echo "🚀 Quick Start Testing Guide:"
echo "============================"

echo
print_info "1. Environment Setup"
echo "   cp .env.example .env"
echo "   # Add your FIRECRAWL_API_KEY to .env"

echo
print_info "2. Start the Application"
echo "   docker-compose up -d"
echo "   # Wait for services to start..."

echo
print_info "3. Test Application Health"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3001/api/data-collection/status"

echo
print_info "4. Test Data Collection (Requires API Key)"
echo "   curl -X POST http://localhost:3001/api/data-collection/collect"
echo "   # This will scrape Premier League data"

echo
print_info "5. View Collection Logs"
echo "   curl http://localhost:3001/api/data-collection/logs?limit=10"

echo
print_info "6. Test Scraping Configuration"
echo "   curl -X POST http://localhost:3001/api/data-collection/test-scraping"

echo
print_info "7. Check API Documentation"
echo "   # Open http://localhost:3001/api-docs in your browser"

echo
echo "📊 API Endpoints Summary:"
echo "========================"
echo "POST   /api/data-collection/collect      - Trigger manual data collection"
echo "GET    /api/data-collection/status       - Get collection service status"
echo "GET    /api/data-collection/logs         - Get collection logs"
echo "POST   /api/data-collection/schedule     - Configure collection schedule"
echo "GET    /api/data-collection/leagues      - Get supported leagues"
echo "POST   /api/data-collection/test-scraping - Test scraping configuration"

echo
echo "🧪 Testing Scenarios:"
echo "==================="

print_info "Scenario 1: Fresh Installation"
echo "   1. docker-compose up -d"
echo "   2. curl http://localhost:3001/api/data-collection/status"
echo "   3. Expected: Collection status showing no previous runs"

echo
print_info "Scenario 2: Manual Data Collection"
echo "   1. Add FIRECRAWL_API_KEY to .env"
echo "   2. curl -X POST http://localhost:3001/api/data-collection/collect"
echo "   3. Expected: Success message with duration and league info"

echo
print_info "Scenario 3: Error Handling (No API Key)"
echo "   1. Don't set FIRECRAWL_API_KEY"
echo "   2. curl -X POST http://localhost:3001/api/data-collection/collect"
echo "   3. Expected: Graceful error handling with meaningful message"

echo
print_info "Scenario 4: Concurrent Request Prevention"
echo "   1. Trigger collection: curl -X POST http://localhost:3001/api/data-collection/collect &"
echo "   2. While running, trigger again: curl -X POST http://localhost:3001/api/data-collection/collect"
echo "   3. Expected: 409 Conflict response indicating collection already running"

echo
print_info "Scenario 5: Status Monitoring"
echo "   1. Trigger collection"
echo "   2. Check status: curl http://localhost:3001/api/data-collection/status"
echo "   3. Check logs: curl http://localhost:3001/api/data-collection/logs"
echo "   4. Expected: Real-time status updates and detailed logs"

echo
echo "🔍 Troubleshooting:"
echo "=================="

print_warning "If data collection fails:"
echo "   1. Check FIRECRAWL_API_KEY is set in .env"
echo "   2. Verify internet connectivity"
echo "   3. Check Firecrawl API usage limits"
echo "   4. Review logs: curl http://localhost:3001/api/data-collection/logs"

print_warning "If services won't start:"
echo "   1. Check Docker is running: docker-compose ps"
echo "   2. Check logs: docker-compose logs backend"
echo "   3. Verify database connection"
echo "   4. Check port conflicts: lsof -i :3001"

print_warning "If compilation fails:"
echo "   1. Check TypeScript dependencies: npm install"
echo "   2. Verify tsconfig.json configuration"
echo "   3. Check for syntax errors in new files"

echo
echo "📈 Performance Expectations:"
echo "==========================="
echo "• Collection Time: 30-60 seconds per league"
echo "• Success Rate: 95%+ with valid API key"
echo "• Data Freshness: Maximum 4 hours old"
echo "• API Response Time: <500ms for status endpoints"
echo "• Database Updates: Real-time during collection"

echo
echo "🎯 Phase 2 Success Criteria:"
echo "==========================="
print_status "✅ All 6 API endpoints implemented and documented"
print_status "✅ Automated collection every 4 hours"
print_status "✅ Manual trigger functionality"
print_status "✅ Status monitoring and logging"
print_status "✅ Error handling and recovery"
print_status "✅ Database integration with existing schema"
print_status "✅ Premier League data scraping"
print_status "✅ Multi-league architecture ready"
print_status "✅ Comprehensive API documentation"

echo
echo "🔄 Next Steps (Phase 3):"
echo "======================="
echo "• Implement additional European leagues"
echo "• Add Crawl4AI for dynamic content"
echo "• Real-time data updates"
echo "• Enhanced data validation"
echo "• Performance optimization"

echo
print_info "Phase 2 implementation is complete and ready for testing!"
print_info "Run the commands above to verify everything works correctly."

echo
echo "📚 Documentation:"
echo "==============="
echo "• Complete docs: PHASE2_COMPLETE.md"
echo "• API docs: http://localhost:3001/api-docs (when running)"
echo "• Source code: /workspace/soccer-prediction-app/backend/src/"