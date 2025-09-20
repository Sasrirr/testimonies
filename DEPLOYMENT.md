# Production Deployment Guide

## Prerequisites

1. **Node.js Environment**: Node.js 18+ LTS
2. **Database**: PostgreSQL 14+ with connection pooling
3. **Secrets Management**: Secure environment variable management
4. **Load Balancer**: For high availability (nginx/AWS ALB)
5. **Monitoring**: Application monitoring (New Relic, DataDog, etc.)

## Environment Variables

Create production `.env` file:

```env
NODE_ENV=production
PORT=3000

# Database with connection pooling
DATABASE_URL="postgresql://username:password@localhost:5432/flocci_testimonies?schema=public&connection_limit=50&pool_timeout=10"

# Flocci OS Integration
FLOCCI_JWKS_URL="https://auth.flocci.in/.well-known/jwks.json"
JWT_SECRET="${SECURE_JWT_SECRET}"

# Logging
LOG_LEVEL=warn

# QR Code Generation
QR_CODE_BASE_URL="https://flocci.in/testimonies"

# Rate Limiting (production values)
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Service Info
SERVICE_NAME="flocci-testimonies-srv"
SERVICE_VERSION="1.0.0"
```

## Build Process

```bash
# Install production dependencies only
npm ci --only=production

# Build the application
npm run build

# Generate Prisma client
npm run db:generate
```

## Database Migration

```bash
# Run database migrations
npm run db:migrate

# Verify schema
npx prisma db seed  # if you have seed data
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=development

COPY . .
RUN npm run build
RUN npm run db:generate

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Docker Compose (for local testing)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/flocci_testimonies
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: flocci_testimonies
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## Kubernetes Deployment

### ConfigMap and Secret

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: flocci-testimonies-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "warn"
  QR_CODE_BASE_URL: "https://flocci.in/testimonies"
  THROTTLE_TTL: "60"
  THROTTLE_LIMIT: "100"

---
apiVersion: v1
kind: Secret
metadata:
  name: flocci-testimonies-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://username:password@postgres-service:5432/flocci_testimonies"
  JWT_SECRET: "your-secure-jwt-secret"
  FLOCCI_JWKS_URL: "https://auth.flocci.in/.well-known/jwks.json"
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flocci-testimonies-srv
  labels:
    app: flocci-testimonies-srv
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flocci-testimonies-srv
  template:
    metadata:
      labels:
        app: flocci-testimonies-srv
    spec:
      containers:
      - name: flocci-testimonies-srv
        image: flocci/testimonies-srv:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: flocci-testimonies-config
        - secretRef:
            name: flocci-testimonies-secrets
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          limits:
            cpu: 1000m
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi

---
apiVersion: v1
kind: Service
metadata:
  name: flocci-testimonies-service
spec:
  selector:
    app: flocci-testimonies-srv
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

## Health Checks

Add health check endpoint to your main.ts:

```typescript
// In AppModule or a dedicated health module
@Get('health')
async health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
  };
}
```

## Monitoring & Logging

### Application Metrics

```typescript
// Add to main.ts for production monitoring
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

// Enable metrics collection
app.enableMetrics();

// Health checks
app.useGlobalInterceptors(new HealthCheckInterceptor());
```

### Log Aggregation

For production logging with external aggregation:

```typescript
// In LoggerModule configuration
LoggerModule.forRootAsync({
  useFactory: () => ({
    pinoHttp: {
      level: 'warn',
      transport: undefined, // No pretty printing in production
      formatters: {
        log: (object) => {
          return {
            ...object,
            service: 'flocci-testimonies-srv',
            version: process.env.SERVICE_VERSION,
            environment: process.env.NODE_ENV,
          };
        },
      },
    },
  }),
}),
```

## Security Hardening

### 1. Rate Limiting

```typescript
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 100, // Higher limit for production
}),
```

### 2. CORS Configuration

```typescript
app.enableCors({
  origin: [
    'https://flocci.in',
    'https://app.flocci.in',
    'https://admin.flocci.in',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 3. Helmet for Security Headers

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

## Performance Optimization

### 1. Database Connection Pooling

```env
DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=50&pool_timeout=10"
```

### 2. Caching

```typescript
// Add Redis for caching frequently accessed data
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      store: 'redis',
      host: 'redis-host',
      port: 6379,
      ttl: 300, // 5 minutes
    }),
  ],
})
```

### 3. Compression

```typescript
import compression from 'compression';
app.use(compression());
```

## Backup & Recovery

### Database Backups

```bash
# Automated backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
aws s3 cp backup_*.sql s3://flocci-backups/testimonies/
```

### Disaster Recovery

1. **Database**: Point-in-time recovery with PostgreSQL
2. **Application**: Stateless design allows quick scaling
3. **Files**: Store QR codes in S3 or similar object storage

## Scaling Considerations

### Horizontal Scaling

- Stateless application design
- Database connection pooling
- Load balancer configuration
- Session management via JWT (stateless)

### Vertical Scaling

- Monitor CPU/Memory usage
- Database query optimization
- Connection pool tuning

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Health checks operational
- [ ] Monitoring dashboards setup
- [ ] Log aggregation configured
- [ ] Backup procedures tested
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] CORS properly restricted

## Rollback Procedure

1. **Application**: Deploy previous Docker image
2. **Database**: Use migration rollback if needed
3. **Traffic**: Update load balancer to previous version
4. **Monitoring**: Verify rollback success

---

This deployment guide ensures a production-ready, secure, and scalable deployment of the Flocci Testimonies microservice.
