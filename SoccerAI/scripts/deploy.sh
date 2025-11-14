#!/bin/bash

# SoccerAI Production Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Starting SoccerAI deployment to $ENVIRONMENT"
echo "📦 Version: $VERSION"
echo "🕐 Timestamp: $TIMESTAMP"

# Configuration
DEPLOY_DIR="/opt/soccerai"
BACKUP_DIR="/opt/soccerai_backups"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Pre-deployment checks
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running"
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed"
    fi
    
    # Check if deployment directory exists
    if [ ! -d "$DEPLOY_DIR" ]; then
        error "Deployment directory $DEPLOY_DIR does not exist"
    fi
    
    log "✅ Prerequisites check passed"
}

# Backup current deployment
create_backup() {
    log "💾 Creating backup..."
    
    BACKUP_NAME="soccerai_backup_${TIMESTAMP}"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    docker exec soccerai_postgres pg_dump -U soccerai_user soccerai > "$BACKUP_DIR/${BACKUP_NAME}_db.sql"
    
    # Backup application files
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_files.tar.gz" -C "$DEPLOY_DIR" .
    
    # Keep only last 10 backups
    find "$BACKUP_DIR" -name "soccerai_backup_*.tar.gz" -type f | sort -r | tail -n +11 | xargs rm -f
    find "$BACKUP_DIR" -name "soccerai_backup_*.sql" -type f | sort -r | tail -n +11 | xargs rm -f
    
    log "✅ Backup created: $BACKUP_NAME"
}

# Pull latest images
pull_images() {
    log "📥 Pulling Docker images..."
    
    cd "$DEPLOY_DIR"
    
    # Pull specific version or latest
    if [ "$VERSION" != "latest" ]; then
        export SOCCERAI_VERSION="$VERSION"
        sed -i "s/:latest/:$VERSION/g" docker-compose.prod.yml
    fi
    
    docker-compose -f $DOCKER_COMPOSE_FILE pull
    
    log "✅ Images pulled successfully"
}

# Deploy new version
deploy() {
    log "🚀 Deploying SoccerAI..."
    
    cd "$DEPLOY_DIR"
    
    # Stop current services
    log "🛑 Stopping current services..."
    docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
    
    # Start new services
    log "▶️ Starting new services..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    log "✅ Services started"
}

# Health checks
health_check() {
    log "🏥 Performing health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check backend health
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        log "✅ Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f -s http://localhost:80/ > /dev/null; then
        log "✅ Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    # Check database
    if docker exec soccerai_postgres pg_isready -U soccerai_user -d soccerai > /dev/null; then
        log "✅ Database health check passed"
    else
        error "Database health check failed"
    fi
    
    # Check logs for errors
    log "📋 Checking application logs..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=100 | grep -i error || log "✅ No critical errors in logs"
    
    log "✅ All health checks passed"
}

# Post-deployment tasks
post_deployment() {
    log "🔧 Running post-deployment tasks..."
    
    # Clean up old Docker images
    docker image prune -f
    
    # Update ML models if needed
    log "🤖 Checking ML model updates..."
    docker exec soccerai_ml python scripts/check_model_updates.py || warn "ML model check failed"
    
    # Send notification
    log "📢 Sending deployment notification..."
    # Add your notification logic here (Slack, email, etc.)
    
    log "✅ Post-deployment tasks completed"
}

# Rollback function
rollback() {
    log "🔄 Rolling back to previous version..."
    
    # Find the most recent backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | grep "soccerai_backup_.*_db.sql" | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error "No backup found for rollback"
    fi
    
    # Stop current services
    cd "$DEPLOY_DIR"
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Restore database
    log "💾 Restoring database from backup: $LATEST_BACKUP"
    cat "$BACKUP_DIR/$LATEST_BACKUP" | docker exec -i soccerai_postgres psql -U soccerai_user soccerai
    
    # Start services
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    log "✅ Rollback completed"
}

# Main deployment flow
main() {
    case "$1" in
        "deploy")
            check_prerequisites
            create_backup
            pull_images
            deploy
            health_check
            post_deployment
            log "🎉 Deployment completed successfully!"
            ;;
        "rollback")
            rollback
            log "🔄 Rollback completed"
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|health} [version]"
            echo "  deploy [version]  - Deploy to production (default version: latest)"
            echo "  rollback          - Rollback to previous version"
            echo "  health            - Run health checks only"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"