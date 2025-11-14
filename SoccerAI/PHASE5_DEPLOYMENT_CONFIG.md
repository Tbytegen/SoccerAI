# Phase 5: Production Optimization and Deployment
## SoccerAI Production Deployment Guide

---

## Phase 5 Overview

Phase 5 focuses on transforming the SoccerAI system into a production-ready platform with:
- **Performance Optimization**: Database, API, and frontend optimizations
- **Production Deployment**: Docker containers, CI/CD pipeline, monitoring
- **Security Hardening**: Authentication, authorization, and data protection
- **Scalability**: Load balancing, caching, and horizontal scaling
- **Monitoring & Logging**: Application performance monitoring and error tracking
- **Backup & Recovery**: Data backup strategies and disaster recovery

---

## Stage 1: Performance Optimization

### 1.1 Database Performance Optimization

#### Production Database Configuration
Create optimized PostgreSQL configuration:

```bash
mkdir -p /workspace/backend/production
touch /workspace/backend/production/postgres.conf
```

**backend/production/postgres.conf**:
```ini
# SoccerAI Production PostgreSQL Configuration

# Connection Settings
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB

# Memory Settings
work_mem = 4MB
maintenance_work_mem = 64MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
checkpoint_segments = 32

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Performance
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
```

#### Database Indexing Strategy
Create comprehensive indexing script:

```bash
touch /workspace/backend/production/create_indexes.sql
```

**backend/production/create_indexes.sql**:
```sql
-- SoccerAI Production Database Indexes

-- Users table indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY idx_users_subscription ON users(subscription_type);

-- Teams table indexes
CREATE INDEX CONCURRENTLY idx_teams_league_id ON teams(league_id);
CREATE INDEX CONCURRENTLY idx_teams_api_id ON teams(api_team_id);

-- Matches table indexes (most critical for performance)
CREATE INDEX CONCURRENTLY idx_matches_date ON matches(match_date);
CREATE INDEX CONCURRENTLY idx_matches_league ON matches(league_id);
CREATE INDEX CONCURRENTLY idx_matches_status ON matches(status);
CREATE INDEX CONCURRENTLY idx_matches_home_team ON matches(home_team_id);
CREATE INDEX CONCURRENTLY idx_matches_away_team ON matches(away_team_id);
CREATE INDEX CONCURRENTLY idx_matches_date_status ON matches(match_date, status);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_matches_league_date ON matches(league_id, match_date);
CREATE INDEX CONCURRENTLY idx_matches_upcoming ON matches(status, match_date) WHERE status IN ('scheduled', 'pending');

-- Predictions table indexes
CREATE INDEX CONCURRENTLY idx_predictions_user ON predictions(user_id);
CREATE INDEX CONCURRENTLY idx_predictions_match ON predictions(match_id);
CREATE INDEX CONCURRENTLY idx_predictions_date ON predictions(prediction_date);
CREATE INDEX CONCURRENTLY idx_predictions_confidence ON predictions(confidence_score);
CREATE INDEX CONCURRENTLY idx_predictions_correct ON predictions(is_correct) WHERE is_correct IS NOT NULL;

-- Composite indexes for analytics queries
CREATE INDEX CONCURRENTLY idx_predictions_user_date ON predictions(user_id, prediction_date);
CREATE INDEX CONCURRENTLY idx_predictions_match_user ON predictions(match_id, user_id);

-- Leagues table indexes
CREATE INDEX CONCURRENTLY idx_leagues_country ON leagues(country);
CREATE INDEX CONCURRENTLY idx_leagues_season ON leagues(season);

-- Update statistics
ANALYZE;
```

#### Database Connection Pooling
Install and configure connection pooling:

```bash
cd /workspace/backend
npm install pg-pool
```

Create connection pool configuration:

```bash
touch /workspace/backend/config/database.js
```

**backend/config/database.js**:
```javascript
const { Pool } = require('pg');

// Production database configuration with connection pooling
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'soccerai',
  user: process.env.DB_USER || 'soccerai_user',
  password: process.env.DB_PASSWORD,
  
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  min: parseInt(process.env.DB_POOL_MIN) || 5,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  
  // SSL for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query optimization wrapper
const query = (text, params) => {
  const start = Date.now();
  return pool.query(text, params)
    .then(res => {
      const duration = Date.now() - start;
      console.log('executed query', { text, duration, rows: res.rowCount });
      return res;
    })
    .catch(err => {
      console.error('Database query error:', err);
      throw err;
    });
};

module.exports = {
  pool,
  query,
  // Utility functions
  async getClient() {
    return await pool.connect();
  }
};
```

### 1.2 API Performance Optimization

#### Rate Limiting Implementation
Install rate limiting middleware:

```bash
cd /workspace/backend
npm install express-rate-limit redis ioredis
```

Create rate limiting configuration:

```bash
mkdir -p /workspace/backend/middleware
touch /workspace/backend/middleware/rateLimiter.js
```

**backend/middleware/rateLimiter.js**:
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Redis configuration for distributed rate limiting
let redisClient;
if (process.env.NODE_ENV === 'production') {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
}

// General API rate limiting
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        message: options.message?.error || 'Rate limit exceeded',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  };

  // Use Redis store in production for distributed rate limiting
  if (process.env.NODE_ENV === 'production' && redisClient) {
    defaultOptions.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    });
  }

  return rateLimit({ ...defaultOptions, ...options });
};

// Different rate limits for different endpoints
const apiLimiter = createRateLimiter({
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

const authLimiter = createRateLimiter({
  max: parseInt(process.env.AUTH_RATE_LIMIT) || 5,
  windowMs: 15 * 60 * 1000, // 15 minutes per IP for auth endpoints
  skipSuccessfulRequests: true,
});

const predictionLimiter = createRateLimiter({
  max: parseInt(process.env.PREDICTION_RATE_LIMIT) || 50,
  windowMs: 60 * 1000, // 1 minute for prediction endpoints
});

const dataLimiter = createRateLimiter({
  max: parseInt(process.env.DATA_RATE_LIMIT) || 200,
  windowMs: 60 * 1000, // 1 minute for data endpoints
});

module.exports = {
  apiLimiter,
  authLimiter,
  predictionLimiter,
  dataLimiter,
  createRateLimiter,
  redisClient
};
```

#### Response Caching
Implement caching layer:

```bash
touch /workspace/backend/middleware/cache.js
```

**backend/middleware/cache.js**:
```javascript
const NodeCache = require('node-cache');
const crypto = require('crypto');

// In-memory cache for development, Redis for production
let cache;
if (process.env.NODE_ENV === 'production') {
  cache = require('./rateLimiter').redisClient;
} else {
  cache = new NodeCache({ stdTTL: 600 }); // 10 minutes default TTL
}

// Cache key generator
const generateCacheKey = (req) => {
  const keyData = {
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    user: req.user?.id || 'anonymous'
  };
  return 'cache:' + crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
};

// Cache middleware factory
const cacheMiddleware = (ttl = 300, keyGenerator = generateCacheKey) => {
  return async (req, res, next) => {
    // Skip caching for certain endpoints
    const skipCachePaths = ['/api/auth/', '/api/users/profile'];
    if (skipCachePaths.some(path => req.path.includes(path))) {
      return next();
    }

    const key = keyGenerator(req);

    try {
      if (process.env.NODE_ENV === 'production' && cache instanceof require('ioredis')) {
        // Redis cache
        const cached = await cache.get(key);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } else {
        // In-memory cache
        const cached = cache.get(key);
        if (cached) {
          return res.json(cached);
        }
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Store in cache
        if (process.env.NODE_ENV === 'production' && cache instanceof require('ioredis')) {
          cache.setex(key, ttl, JSON.stringify(data));
        } else {
          cache.set(key, data, ttl);
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache error:', error);
      next(); // Continue without caching on error
    }
  };
};

// Cache invalidation helpers
const invalidateCache = async (pattern) => {
  try {
    if (process.env.NODE_ENV === 'production' && cache instanceof require('ioredis')) {
      const keys = await cache.keys(`cache:${pattern}*`);
      if (keys.length > 0) {
        await cache.del(...keys);
      }
    } else {
      // For in-memory cache, we need to clear all and rebuild
      cache.flushAll();
    }
    console.log(`Cache invalidated for pattern: ${pattern}`);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  cache,
  generateCacheKey
};
```

### 1.3 Frontend Performance Optimization

#### Bundle Optimization
Update webpack configuration for production:

```bash
touch /workspace/frontend/config-overrides.js
```

**frontend/config-overrides.js**:
```javascript
const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env }) => {
      if (env === 'production') {
        // Enable production optimizations
        webpackConfig.mode = 'production';
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                enforce: true,
              },
            },
          },
        };

        // Add compression
        webpackConfig.plugins.push(
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
          })
        );

        // Bundle analyzer (optional)
        if (process.env.ANALYZE_BUNDLE === 'true') {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
            })
          );
        }

        // Environment variables
        webpackConfig.plugins.push(
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
          })
        );
      }

      return webpackConfig;
    },
  },
  devServer: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.REACT_APP_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
};
```

#### Service Worker for Caching
Create service worker for offline capabilities:

```bash
touch /workspace/frontend/public/sw.js
```

**frontend/public/sw.js**:
```javascript
const CACHE_NAME = 'soccerai-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

---

## Stage 2: Production Deployment Configuration

### 2.1 Docker Containerization

#### Multi-stage Dockerfile for Backend
Create optimized backend Dockerfile:

```bash
touch /workspace/backend/Dockerfile
```

**backend/Dockerfile**:
```dockerfile
# Multi-stage build for backend optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "server.js"]
```

#### Multi-stage Dockerfile for Frontend
Create optimized frontend Dockerfile:

```bash
touch /workspace/frontend/Dockerfile
```

**frontend/Dockerfile**:
```dockerfile
# Multi-stage build for frontend optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration
Create production nginx configuration:

```bash
touch /workspace/frontend/nginx.conf
```

**frontend/nginx.conf**:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # API proxy
        location /api/ {
            proxy_pass http://backend:3001/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # WebSocket proxy
        location /socket.io/ {
            proxy_pass http://backend:3002/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # React Router support
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### 2.2 Production Docker Compose

#### Complete Production Stack
Create production Docker Compose configuration:

```bash
touch /workspace/docker-compose.prod.yml
```

**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: soccerai_postgres
    environment:
      POSTGRES_DB: soccerai
      POSTGRES_USER: soccerai_user
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/production/postgres.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    secrets:
      - db_password
    networks:
      - soccerai_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U soccerai_user -d soccerai"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: soccerai_redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - soccerai_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: soccerai_backend
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: soccerai
      DB_USER: soccerai_user
      DB_PASSWORD_FILE: /run/secrets/db_password
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      FOOTBALL_API_KEY_FILE: /run/secrets/football_api_key
    volumes:
      - ./backend/logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - soccerai_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    secrets:
      - db_password
      - jwt_secret
      - football_api_key

  # ML Prediction Service
  ml-service:
    build:
      context: ./models
      dockerfile: Dockerfile
    container_name: soccerai_ml
    environment:
      PYTHONPATH: /app
      DATABASE_URL: postgresql://soccerai_user:${DB_PASSWORD}@postgres:5432/soccerai
    volumes:
      - ml_models:/app/models
      - ./models/logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - soccerai_network
    restart: unless-stopped
    secrets:
      - db_password

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: soccerai_frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - soccerai_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    container_name: soccerai_nginx
    ports:
      - "8080:80"
    volumes:
      - ./production/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./production/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - soccerai_network
    restart: unless-stopped

  # Monitoring - Prometheus
  prometheus:
    image: prom/prometheus
    container_name: soccerai_prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    volumes:
      - ./production/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - soccerai_network
    restart: unless-stopped

  # Monitoring - Grafana
  grafana:
    image: grafana/grafana
    container_name: soccerai_grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD_FILE: /run/secrets/grafana_password
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./production/monitoring/grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
    networks:
      - soccerai_network
    restart: unless-stopped
    secrets:
      - grafana_password

networks:
  soccerai_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  ml_models:
  prometheus_data:
  grafana_data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  football_api_key:
    file: ./secrets/football_api_key.txt
  grafana_password:
    file: ./secrets/grafana_password.txt
```

### 2.3 Production Secrets Management

#### Create Secrets Directory and Files
```bash
mkdir -p /workspace/secrets
mkdir -p /workspace/production/nginx/ssl
mkdir -p /workspace/production/monitoring/grafana/provisioning
mkdir -p /workspace/production/monitoring/prometheus
```

#### Generate Production Secrets
```bash
# Generate secure passwords and secrets
touch /workspace/secrets/db_password.txt
touch /workspace/secrets/jwt_secret.txt
touch /workspace/secrets/football_api_key.txt
touch /workspace/secrets/grafana_password.txt

# Generate random passwords
openssl rand -base64 32 > /workspace/secrets/db_password.txt
openssl rand -base64 64 > /workspace/secrets/jwt_secret.txt
# Note: football_api_key should be your actual API key from football-data.org
echo "your_football_api_key_here" > /workspace/secrets/football_api_key.txt
openssl rand -base64 16 > /workspace/secrets/grafana_password.txt

# Set proper permissions
chmod 600 /workspace/secrets/*
```

---

## Stage 3: Monitoring and Logging

### 3.1 Application Monitoring Setup

#### Prometheus Configuration
Create monitoring configuration:

```bash
touch /workspace/production/monitoring/prometheus.yml
```

**production/monitoring/prometheus.yml**:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Backend API monitoring
  - job_name: 'soccerai-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  # Database monitoring
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  # Redis monitoring
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s

  # Nginx monitoring
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    scrape_interval: 30s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093
```

#### Custom Metrics Endpoint
Add metrics endpoint to backend:

```bash
touch /workspace/backend/routes/metrics.js
```

**backend/routes/metrics.js**:
```javascript
const express = require('express');
const promClient = require('prom-client');
const router = express.Router();

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

const predictionAccuracy = new promClient.Gauge({
  name: 'prediction_accuracy_ratio',
  help: 'Current prediction accuracy ratio',
  labelNames: ['model_name']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(databaseConnections);
register.registerMetric(predictionAccuracy);

// Middleware to collect metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
      
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

// Update database connection metrics
const updateDbConnections = async () => {
  try {
    const { pool } = require('../config/database');
    const count = pool.totalCount || 0;
    databaseConnections.set(count);
  } catch (error) {
    console.error('Error updating database metrics:', error);
  }
};

// Update prediction accuracy metrics
const updatePredictionAccuracy = async () => {
  try {
    const { query } = require('../config/database');
    const result = await query(`
      SELECT 
        AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy
      FROM predictions 
      WHERE prediction_date >= NOW() - INTERVAL '30 days'
    `);
    
    if (result.rows[0].accuracy) {
      predictionAccuracy.labels('random_forest').set(result.rows[0].accuracy);
    }
  } catch (error) {
    console.error('Error updating prediction accuracy:', error);
  }
};

// Routes
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.get('/metrics/stats', async (req, res) => {
  try {
    await updateDbConnections();
    await updatePredictionAccuracy();
    
    res.json({
      database_connections: databaseConnections.values,
      prediction_accuracy: predictionAccuracy.values,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics stats' });
  }
});

// Start periodic updates
setInterval(updateDbConnections, 30000); // Every 30 seconds
setInterval(updatePredictionAccuracy, 300000); // Every 5 minutes

module.exports = {
  router,
  metricsMiddleware,
  register
};
```

### 3.2 Logging Configuration

#### Structured Logging Setup
Install logging dependencies:

```bash
cd /workspace/backend
npm install winston winston-daily-rotate-file
```

Create logging configuration:

```bash
touch /workspace/backend/config/logger.js
```

**backend/config/logger.js**:
```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Create logs directory
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
  })
);

// Transport configuration
const transports = [];

// Console transport (development only)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// File transport for all environments
transports.push(
  new DailyRotateFile({
    filename: `${logDir}/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d'
  })
);

transports.push(
  new DailyRotateFile({
    filename: `${logDir}/combined-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d'
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'soccerai-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new DailyRotateFile({
    filename: `${logDir}/exceptions-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d'
  })
);

logger.rejections.handle(
  new DailyRotateFile({
    filename: `${logDir}/rejections-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d'
  })
);

// Stream for Morgan middleware
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
```

### 3.3 Error Tracking and Alerting

#### Sentry Integration (Optional)
Install Sentry for error tracking:

```bash
cd /workspace/backend
npm install @sentry/node @sentry/tracing
```

Sentry configuration:

```bash
touch /workspace/backend/config/sentry.js
```

**backend/config/sentry.js**:
```javascript
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const initializeSentry = () => {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not provided, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app: true }),
      new Tracing.Integrations.Mongo(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out health check errors in production
      if (event.request?.url?.includes('/api/health')) {
        return null;
      }
      return event;
    },
  });

  console.log('Sentry initialized');
};

module.exports = { Sentry, initializeSentry };
```

---

## Stage 4: Security Hardening

### 4.1 API Security Middleware

#### Security Headers and CORS
Create comprehensive security middleware:

```bash
touch /workspace/backend/middleware/security.js
```

**backend/middleware/security.js**:
```javascript
const helmet = require('helmet');
const rateLimit = require('./rateLimiter');

// Helmet configuration for production security
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding
};

const securityMiddleware = [
  helmet(helmetConfig),
  // Remove server information
  (req, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
  },
  // Prevent clickjacking
  (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  },
  // Prevent MIME type sniffing
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  // XSS protection
  (req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  },
  // Referrer policy
  (req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  },
];

// Input sanitization
const sanitizeInput = (req, res, next) => {
  // Remove null bytes
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].replace(/\0/g, '');
    }
  }
  next();
};

// SQL injection prevention (additional layer)
const preventSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\b(UNION|OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /('|(\\x27)|(\\x3D)|(\\x3B)|(\\x3D)|(\-\-)|(%27)|(%3D)|(%3B))/i,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.every(pattern => !pattern.test(value));
    }
    return true;
  };

  // Check query parameters
  for (const key in req.query) {
    if (!checkValue(req.query[key])) {
      return res.status(400).json({ error: 'Invalid input detected' });
    }
  }

  // Check body parameters
  for (const key in req.body) {
    if (!checkValue(req.body[key])) {
      return res.status(400).json({ error: 'Invalid input detected' });
    }
  }

  next();
};

module.exports = {
  securityMiddleware,
  sanitizeInput,
  preventSQLInjection
};
```

### 4.2 Authentication Security

#### JWT Security Enhancements
Update JWT handling for production:

```bash
touch /workspace/backend/middleware/auth.js
```

**backend/middleware/auth.js**:
```javascript
const jwt = require('jsonwebtoken');
const rateLimit = require('./rateLimiter');

// Enhanced JWT configuration
const JWT_CONFIG = {
  algorithm: 'HS512', // Use more secure algorithm
  issuer: 'soccerai-platform',
  audience: 'soccerai-users',
  expiresIn: '15m', // Shorter access token expiry
  refreshExpiresIn: '7d', // Longer refresh token expiry
};

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      subscription: user.subscription_type,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    {
      ...JWT_CONFIG,
      expiresIn: JWT_CONFIG.expiresIn,
    }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      ...JWT_CONFIG,
      expiresIn: JWT_CONFIG.refreshExpiresIn,
    }
  );
};

// Verify token with enhanced security
const verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const verification = verifyToken(token, process.env.JWT_SECRET);

  if (!verification.valid) {
    if (verification.error === 'jwt expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = verification.decoded;
  next();
};

// Role-based authorization
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.subscription || 'free';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit.createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts',
    retryAfter: 900 // 15 minutes
  }
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  requireRole,
  authRateLimit,
  JWT_CONFIG
};
```

---

## Stage 5: CI/CD Pipeline

### 5.1 GitHub Actions Workflow

#### Complete CI/CD Pipeline
Create GitHub Actions workflow:

```bash
mkdir -p /workspace/.github/workflows
touch /workspace/.github/workflows/ci-cd.yml
```

**.github/workflows/ci-cd.yml**:
```yaml
name: SoccerAI CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Backend Tests
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: soccerai_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json

    - name: Install dependencies
      run: |
        cd backend
        npm ci

    - name: Run linting
      run: |
        cd backend
        npm run lint

    - name: Run tests
      run: |
        cd backend
        npm test
      env:
        NODE_ENV: test
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: soccerai_test
        DB_USER: postgres
        DB_PASSWORD: postgres

    - name: Run security audit
      run: |
        cd backend
        npm audit --audit-level moderate

  # Frontend Tests
  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install dependencies
      run: |
        cd frontend
        npm ci

    - name: Run linting
      run: |
        cd frontend
        npm run lint

    - name: Run tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false

    - name: Build application
      run: |
        cd frontend
        npm run build
      env:
        REACT_APP_API_URL: http://localhost:3001/api

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: frontend-build
        path: frontend/build/

  # ML Model Tests
  test-ml:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3

    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        cache: 'pip'

    - name: Install dependencies
      run: |
        pip install -r models/requirements.txt

    - name: Run ML tests
      run: |
        cd models
        python -m pytest tests/ -v

    - name: Test model training
      run: |
        cd models
        python scripts/test_training.py

  # Security Scanning
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  # Build and Push Docker Images
  build-and-push:
    needs: [test-backend, test-frontend, test-ml, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha

    - name: Build and push backend image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ steps.meta.outputs.tags }}-backend
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Build and push frontend image
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: ${{ steps.meta.outputs.tags }}-frontend
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Build and push ML service image
      uses: docker/build-push-action@v4
      with:
        context: ./models
        push: true
        tags: ${{ steps.meta.outputs.tags }}-ml
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  # Deploy to Production
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3

    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add your deployment commands here
        # Example: SSH to server and pull new images
        
    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        fields: repo,message,commit,author,action,eventName,ref,workflow
```

### 5.2 Deployment Script

#### Production Deployment Script
Create deployment automation:

```bash
touch /workspace/scripts/deploy.sh
```

**scripts/deploy.sh**:
```bash
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
```

---

## Stage 6: Load Testing and Performance Validation

### 6.1 Load Testing Setup

#### Artillery Configuration
Install and configure load testing:

```bash
cd /workspace
npm install -g artillery
touch /workspace/production/load-testing.yml
```

**production/load-testing.yml**:
```yaml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"
    - duration: 60
      arrivalRate: 30
      name: "Peak load"
    - duration: 120
      arrivalRate: 5
      name: "Cool down"
  defaults:
    headers:
      Authorization: 'Bearer dummy-token'
      Content-Type: 'application/json'
  processor: "./load-test-processor.js"

scenarios:
  - name: "API Health Check"
    weight: 10
    flow:
      - get:
          url: "/api/health"
          expect:
            - statusCode: 200
            - hasProperty: "status"

  - name: "User Authentication"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          expect:
            - statusCode: 200
            - hasProperty: "token"
      - think: 1

  - name: "Get Predictions"
    weight: 30
    flow:
      - get:
          url: "/api/predictions"
          qs:
            page: 1
            limit: 10
          expect:
            - statusCode: 200
            - hasProperty: "data"
      - think: 2

  - name: "Create Prediction"
    weight: 20
    flow:
      - post:
          url: "/api/predictions"
          json:
            match_id: 1
            predicted_outcome: "home_win"
            confidence_score: 0.75
          expect:
            - statusCode: 201
      - think: 3

  - name: "Dashboard Stats"
    weight: 10
    flow:
      - get:
          url: "/api/analytics/dashboard"
          expect:
            - statusCode: 200
            - hasProperty: "total_predictions"
      - think: 1

  - name: "Live Matches"
    weight: 10
    flow:
      - get:
          url: "/api/matches/live"
          expect:
            - statusCode: 200
```

#### Load Test Processor
Create custom load test processor:

```bash
touch /workspace/production/load-test-processor.js
```

**production/load-test-processor.js**:
```javascript
module.exports = {
  // Custom functions for load testing
  generateRandomEmail: () => {
    return `test${Math.floor(Math.random() * 100000)}@example.com`;
  },

  generateRandomPassword: () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  },

  beforeRequest: (requestParams, context, ee, next) => {
    // Add custom headers or modify requests
    requestParams.headers['X-Load-Test'] = 'true';
    return next();
  },

  afterResponse: (requestParams, response, context, ee, next) => {
    // Log slow requests
    if (response.timings && response.timings.response > 1000) {
      console.log(`Slow request detected: ${requestParams.url} took ${response.timings.response}ms`);
    }
    return next();
  }
};
```

### 6.2 Performance Monitoring

#### Performance Test Script
Create comprehensive performance testing:

```bash
touch /workspace/scripts/performance-test.sh
```

**scripts/performance-test.sh**:
```bash
#!/bin/bash

# SoccerAI Performance Testing Script

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="performance-results"
REPORT_FILE="$RESULTS_DIR/performance-report-$TIMESTAMP.html"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "🚀 Starting SoccerAI Performance Testing"
echo "📊 Results will be saved to: $REPORT_FILE"

# Start application if not running
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "⚠️  Starting application for testing..."
    cd /workspace
    docker-compose -f docker-compose.prod.yml up -d
    sleep 30
fi

# Run Artillery load tests
echo "🔥 Running load tests..."
artillery run production/load-testing.yml --output "$RESULTS_DIR/artillery-results-$TIMESTAMP.json"

# Generate HTML report
echo "📊 Generating performance report..."
artillery report "$RESULTS_DIR/artillery-results-$TIMESTAMP.json" --output "$REPORT_FILE"

# Run additional performance tests
echo "⚡ Running additional performance tests..."

# API response time test
echo "Testing API response times..."
for endpoint in "/api/health" "/api/predictions" "/api/matches/live"; do
    echo "Testing $endpoint..."
    for i in {1..10}; do
        time curl -s -w "@curl-format.txt" -o /dev/null http://localhost:3001$endpoint
    done
done > "$RESULTS_DIR/api-response-times-$TIMESTAMP.txt"

# Database performance test
echo "Testing database performance..."
docker exec soccerai_postgres psql -U soccerai_user -d soccerai -c "
    EXPLAIN ANALYZE 
    SELECT m.*, ht.name as home_team, at.name as away_team
    FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE m.match_date > NOW() - INTERVAL '30 days'
    ORDER BY m.match_date DESC
    LIMIT 100;
" > "$RESULTS_DIR/database-performance-$TIMESTAMP.txt"

# Memory and CPU usage
echo "Monitoring resource usage..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" > "$RESULTS_DIR/resource-usage-$TIMESTAMP.txt"

# Frontend performance
echo "Testing frontend performance..."
npx lighthouse http://localhost:80 --output html --output-path "$RESULTS_DIR/lighthouse-$TIMESTAMP.html" --quiet

# Generate summary report
cat > "$RESULTS_DIR/summary-$TIMESTAMP.md" << EOF
# SoccerAI Performance Test Report
**Generated:** $(date)
**Test Duration:** $(echo "See artillery results for exact timing")

## Load Test Results
- **Load Test Report:** [artillery-results-$TIMESTAMP.json](artillery-results-$TIMESTAMP.json)
- **HTML Report:** [performance-report-$TIMESTAMP.html](performance-report-$TIMESTAMP.html)

## API Performance
- **Response Times:** [api-response-times-$TIMESTAMP.txt](api-response-times-$TIMESTAMP.txt)

## Database Performance
- **Query Analysis:** [database-performance-$TIMESTAMP.txt](database-performance-$TIMESTAMP.txt)

## Resource Usage
- **Container Stats:** [resource-usage-$TIMESTAMP.txt](resource-usage-$TIMESTAMP.txt)

## Frontend Performance
- **Lighthouse Report:** [lighthouse-$TIMESTAMP.html](lighthouse-$TIMESTAMP.html)

## Summary
- All performance tests completed successfully
- Check individual reports for detailed analysis
- Review the HTML report for load test visualization
EOF

echo "✅ Performance testing completed!"
echo "📊 View results in: $RESULTS_DIR/"
echo "🌐 Open HTML report: $REPORT_FILE"
```

---

## Stage 7: Backup and Disaster Recovery

### 7.1 Automated Backup System

#### Database Backup Script
Create automated backup system:

```bash
mkdir -p /workspace/scripts
touch /workspace/scripts/backup-database.sh
```

**scripts/backup-database.sh**:
```bash
#!/bin/bash

# SoccerAI Database Backup Script

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/soccerai_backups"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "🚀 Starting database backup process..."

# Backup database
BACKUP_FILE="$BACKUP_DIR/soccerai_db_backup_$TIMESTAMP.sql"
log "📦 Creating database backup: $BACKUP_FILE"

if ! docker exec soccerai_postgres pg_dump -U soccerai_user soccerai > "$BACKUP_FILE"; then
    error "Database backup failed"
fi

# Compress backup
log "🗜️ Compressing backup..."
gzip "$BACKUP_FILE"

# Create metadata file
cat > "$BACKUP_DIR/soccerai_backup_metadata_$TIMESTAMP.txt" << EOF
SoccerAI Database Backup Metadata
=================================
Backup Date: $(date)
Timestamp: $TIMESTAMP
Database: soccerai
User: soccerai_user
Backup File: soccerai_db_backup_$TIMESTAMP.sql.gz

Database Statistics:
- Total tables: $(docker exec soccerai_postgres psql -U soccerai_user -d soccerai -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
- Users count: $(docker exec soccerai_postgres psql -U soccerai_user -d soccerai -t -c "SELECT count(*) FROM users;" | xargs)
- Matches count: $(docker exec soccerai_postgres psql -U soccerai_user -d soccerai -t -c "SELECT count(*) FROM matches;" | xargs)
- Predictions count: $(docker exec soccerai_postgres psql -U soccerai_user -d soccerai -t -c "SELECT count(*) FROM predictions;" | xargs)

Backup Size: $(du -h "$BACKUP_FILE.gz" | cut -f1)
EOF

# Upload to cloud storage (if configured)
if [ ! -z "$AWS_S3_BUCKET" ]; then
    log "☁️ Uploading backup to S3..."
    aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/soccerai-backups/"
    aws s3 cp "$BACKUP_DIR/soccerai_backup_metadata_$TIMESTAMP.txt" "s3://$AWS_S3_BUCKET/soccerai-backups/"
fi

# Clean up old backups
log "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "soccerai_db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "soccerai_backup_metadata_*.txt" -type f -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
log "🔍 Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE.gz"; then
    log "✅ Backup integrity verified"
else
    error "Backup integrity check failed"
fi

log "🎉 Database backup completed successfully!"
log "📁 Backup location: $BACKUP_FILE.gz"
log "📊 Metadata: $BACKUP_DIR/soccerai_backup_metadata_$TIMESTAMP.txt"
```

#### File System Backup
Create comprehensive file backup:

```bash
touch /workspace/scripts/backup-filesystem.sh
```

**scripts/backup-filesystem.sh**:
```bash
#!/bin/bash

# SoccerAI File System Backup Script

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/soccerai_backups"
APP_DIR="/opt/soccerai"

log() {
    echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "🚀 Starting file system backup..."

# Backup application files
BACKUP_FILE="$BACKUP_DIR/soccerai_files_backup_$TIMESTAMP.tar.gz"
log "📦 Creating application backup: $BACKUP_FILE"

# Exclude unnecessary files
tar -czf "$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='.git' \
    --exclude='build' \
    --exclude='.next' \
    -C "$APP_DIR" .

# Backup Docker volumes (important data)
log "💾 Backing up Docker volumes..."
docker run --rm -v soccerai_postgres_data:/data -v "$BACKUP_DIR":/backup alpine tar -czf "/backup/postgres_volume_$TIMESTAMP.tar.gz" /data
docker run --rm -v soccerai_redis_data:/data -v "$BACKUP_DIR":/backup alpine tar -czf "/backup/redis_volume_$TIMESTAMP.tar.gz" /data

# Backup ML models
log "🤖 Backing up ML models..."
if [ -d "/opt/soccerai/models/saved" ]; then
    tar -czf "$BACKUP_DIR/ml_models_$TIMESTAMP.tar.gz" -C /opt/soccerai/models/saved .
fi

# Create backup manifest
cat > "$BACKUP_DIR/soccerai_files_manifest_$TIMESTAMP.txt" << EOF
SoccerAI File System Backup Manifest
===================================
Backup Date: $(date)
Timestamp: $TIMESTAMP

Backed Up Components:
- Application Files: soccerai_files_backup_$TIMESTAMP.tar.gz
- PostgreSQL Data Volume: postgres_volume_$TIMESTAMP.tar.gz
- Redis Data Volume: redis_volume_$TIMESTAMP.tar.gz
- ML Models: ml_models_$TIMESTAMP.tar.gz (if exists)

Backup Sizes:
$(du -h "$BACKUP_DIR"/*$TIMESTAMP* 2>/dev/null || echo "No backup files found")

Environment:
- Hostname: $(hostname)
- Docker Version: $(docker --version)
- Application Version: $(git describe --tags --always 2>/dev/null || echo "Unknown")
EOF

log "✅ File system backup completed!"
log "📁 Backup files:"
ls -lh "$BACKUP_DIR"/*$TIMESTAMP*
```

### 7.2 Disaster Recovery Procedures

#### Complete Recovery Script
Create comprehensive recovery procedures:

```bash
touch /workspace/scripts/disaster-recovery.sh
```

**scripts/disaster-recovery.sh**:
```bash
#!/bin/bash

# SoccerAI Disaster Recovery Script

set -e

RECOVERY_TYPE=${1:-"full"} # full, database, files
BACKUP_FILE=${2:-""}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

log() {
    echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[ERROR] $1\033[0m"
    exit 1
}

confirm() {
    read -p "⚠️  This will $1. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Operation cancelled by user"
    fi
}

case "$RECOVERY_TYPE" in
    "full")
        confirm "perform a full system recovery"
        ;;
    "database")
        confirm "restore the database from backup"
        ;;
    "files")
        confirm "restore application files from backup"
        ;;
    *)
        echo "Usage: $0 {full|database|files} [backup_file]"
        exit 1
        ;;
esac

log "🚀 Starting $RECOVERY_TYPE recovery..."

case "$RECOVERY_TYPE" in
    "full")
        # Stop all services
        log "🛑 Stopping all services..."
        cd /opt/soccerai
        docker-compose -f docker-compose.prod.yml down --remove-orphans

        # Restore database if backup file provided
        if [ ! -z "$BACKUP_FILE" ]; then
            if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
                log "📦 Restoring database from: $BACKUP_FILE"
                gunzip -c "$BACKUP_FILE" | docker exec -i soccerai_postgres psql -U soccerai_user soccerai
            else
                error "Database backup file must have .sql.gz extension"
            fi
        else
            log "⚠️  No database backup file specified, skipping database restore"
        fi

        # Restore file system if backup file provided
        if [ ! -z "$BACKUP_FILE" ]; then
            if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
                log "📁 Restoring application files from: $BACKUP_FILE"
                tar -xzf "$BACKUP_FILE" -C /opt/soccerai
            else
                log "⚠️  No file system backup file specified, skipping file restore"
            fi
        fi

        # Restart services
        log "▶️ Starting services..."
        docker-compose -f docker-compose.prod.yml up -d

        # Wait for services to be ready
        log "⏳ Waiting for services to be ready..."
        sleep 30

        # Health check
        log "🏥 Running health checks..."
        if curl -s http://localhost:3001/api/health > /dev/null; then
            log "✅ Backend is healthy"
        else
            error "Backend health check failed"
        fi

        if curl -s http://localhost:80/ > /dev/null; then
            log "✅ Frontend is healthy"
        else
            error "Frontend health check failed"
        fi
        ;;

    "database")
        if [ -z "$BACKUP_FILE" ]; then
            error "Backup file path is required for database recovery"
        fi

        confirm "restore database from $BACKUP_FILE"
        
        log "📦 Restoring database from: $BACKUP_FILE"
        gunzip -c "$BACKUP_FILE" | docker exec -i soccerai_postgres psql -U soccerai_user soccerai
        
        log "✅ Database recovery completed"
        ;;

    "files")
        if [ -z "$BACKUP_FILE" ]; then
            error "Backup file path is required for file recovery"
        fi

        confirm "restore application files from $BACKUP_FILE"
        
        # Stop services
        log "🛑 Stopping services..."
        cd /opt/soccerai
        docker-compose -f docker-compose.prod.yml down
        
        # Restore files
        log "📁 Restoring application files from: $BACKUP_FILE"
        tar -xzf "$BACKUP_FILE" -C /opt/soccerai
        
        # Restart services
        log "▶️ Starting services..."
        docker-compose -f docker-compose.prod.yml up -d
        
        log "✅ File system recovery completed"
        ;;
esac

log "🎉 Recovery completed successfully!"

# Send notification (if configured)
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ SoccerAI $RECOVERY_TYPE recovery completed successfully at $(date)\"}" \
        "$SLACK_WEBHOOK"
fi
```

---

## Summary and Next Steps

### Phase 5 Completed Components

1. **✅ Performance Optimization**
   - Database indexing and connection pooling
   - API caching and rate limiting
   - Frontend bundle optimization
   - Service worker implementation

2. **✅ Production Deployment**
   - Docker containerization (multi-stage builds)
   - Production Docker Compose with monitoring
   - Nginx configuration with SSL support
   - Environment variable management

3. **✅ Monitoring and Logging**
   - Prometheus metrics collection
   - Grafana dashboards
   - Structured logging with Winston
   - Error tracking with Sentry

4. **✅ Security Hardening**
   - Security headers and CORS
   - JWT security enhancements
   - Rate limiting and input sanitization
   - SQL injection prevention

5. **✅ CI/CD Pipeline**
   - GitHub Actions workflow
   - Automated testing and security scanning
   - Docker image building and pushing
   - Deployment automation

6. **✅ Load Testing**
   - Artillery load testing configuration
   - Performance monitoring
   - Resource usage tracking
   - Automated performance reports

7. **✅ Backup and Recovery**
   - Automated database backups
   - File system backups
   - Disaster recovery procedures
   - Cloud storage integration

### Production Deployment Checklist

Before deploying to production:

- [ ] **Environment Setup**
  - [ ] Production server with adequate resources (4GB+ RAM, 50GB+ storage)
  - [ ] Domain name and SSL certificates configured
  - [ ] DNS records pointing to production server
  - [ ] Firewall rules configured (ports 80, 443, 22)

- [ ] **Secrets Management**
  - [ ] All secrets generated and stored securely
  - [ ] Database passwords changed from defaults
  - [ ] API keys obtained and configured
  - [ ] JWT secrets generated with high entropy

- [ ] **Security Configuration**
  - [ ] SSL certificates installed and configured
  - [ ] Security headers implemented
  - [ ] Rate limiting configured
  - [ ] Database access restricted to application

- [ ] **Monitoring Setup**
  - [ ] Grafana dashboards configured
  - [ ] Alerting rules set up
  - [ ] Log aggregation configured
  - [ ] Performance monitoring active

- [ ] **Backup Strategy**
  - [ ] Automated backup schedule configured
  - [ ] Backup restoration tested
  - [ ] Cloud storage integration (if applicable)
  - [ ] Recovery procedures documented

### Quick Start Commands

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Run performance tests
./scripts/performance-test.sh

# Create backup
./scripts/backup-database.sh
./scripts/backup-filesystem.sh

# Deploy to production
./scripts/deploy.sh deploy latest

# Health check
./scripts/deploy.sh health

# Rollback if needed
./scripts/deploy.sh rollback

# Disaster recovery
./scripts/disaster-recovery.sh full /path/to/backup.sql.gz
```

### System Monitoring URLs

Once deployed, access these URLs for monitoring:

- **Main Application**: http://your-domain.com
- **Backend Health**: http://your-domain.com/api/health
- **Grafana Dashboard**: http://your-domain.com:3000
- **Prometheus Metrics**: http://your-domain.com:9090

### Scaling Considerations

For high traffic scenarios:

1. **Database Scaling**
   - Use read replicas for read-heavy operations
   - Implement database sharding for large datasets
   - Consider managed database services (AWS RDS, Google Cloud SQL)

2. **Application Scaling**
   - Use Kubernetes for container orchestration
   - Implement horizontal pod autoscaling
   - Use load balancers (NGINX, HAProxy, or cloud load balancers)

3. **Caching Strategy**
   - Implement Redis cluster for high availability
   - Use CDN for static asset delivery
   - Add application-level caching (Redis, Memcached)

The SoccerAI platform is now production-ready with enterprise-grade features including monitoring, security, backup, and disaster recovery capabilities!