# Flocci Testimonies Microservice

A production-grade NestJS microservice that serves as the global, trusted ledger for verifiable testimonials within the Flocci OS ecosystem.

## 🏗️ Architecture

This service is built with **NestJS + TypeScript** and uses:
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT integration with Flocci OS Identity Service
- **Authorization**: Role-based access control (RBAC)
- **API Documentation**: OpenAPI/Swagger
- **Logging**: Structured JSON logging with Pino
- **Testing**: Jest with comprehensive test coverage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Access to Flocci OS Identity Service

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure the database**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   ```

4. **Start the development server**:
   ```bash
   npm run start:dev
   ```

The service will be available at `http://localhost:3000` with API documentation at `http://localhost:3000/api/docs`.

## 🔧 Environment Configuration

Key environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/flocci_testimonies"

# Flocci OS Integration
FLOCCI_JWKS_URL="https://auth.flocci.in/.well-known/jwks.json"
JWT_SECRET="your-jwt-secret-key"

# Service Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# QR Code Generation
QR_CODE_BASE_URL="https://flocci.in/testimonies"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

## 📊 Database Schema

The service uses the following core entities:

- **Users**: Core user profiles linked to Flocci OS
- **Organizations**: Business profiles with employee management
- **Testimonies**: Verifiable testimonials with embed functionality
- **Verifications**: Admin verification workflow
- **Interactions**: User engagement (likes, comments, flags)
- **Reputation**: User trust scoring
- **Audit Logs**: Complete action tracking

## 🔐 Authentication & Authorization

### Authentication Flow

1. Client sends JWT in `Authorization: Bearer <token>` header
2. JWT Guard validates token using Flocci OS JWKS endpoint
3. User information extracted and attached to request

### Role-Based Access Control

- **CONSUMER**: Create/manage own testimonies, interact with others
- **ORGANIZATION**: Manage profile, view testimonies about them
- **EMPLOYEE**: View organization data, respond to testimonies
- **ADMIN**: Full access for verification and moderation; implemented as org-scoped admins (each admin can only verify testimonies for their organization).

## 📡 API Endpoints

### Core Testimony Operations

```http
POST   /api/api/v1/testimonies              # Create testimony (CONSUMER)
GET    /api/api/v1/testimonies/:embed_id    # Get public testimony
PUT    /api/api/v1/testimonies/:id          # Update testimony (author only)
DELETE /api/api/v1/testimonies/:id          # Delete testimony (author/admin)
```

### User & Organization Management

```http
GET    /api/api/v1/users/:userId/testimonies     # Get user's testimonies
GET    /api/api/v1/organizations/:id             # Get organization profile
PUT    /api/api/v1/organizations/:id             # Update organization
POST   /api/api/v1/organizations/:id/employees   # Add employee
DELETE /api/api/v1/organizations/:orgId/employees/:userId # Remove employee
```

### Interactions

```http
POST   /api/api/v1/interactions                 # Create interaction (like, comment)
GET    /api/api/v1/testimonies/:id/interactions # Get testimony interactions
```

### Admin Operations

```http
GET    /api/api/v1/testimonies/pending          # Get pending testimonies (ADMIN)
POST   /api/api/v1/verifications                # Verify/reject testimony (ADMIN)
POST   /api/api/v1/moderations                  # Moderate content (ADMIN)
GET    /api/api/v1/disputes                     # View disputes (ADMIN)
PUT    /api/api/v1/disputes/:id/resolve         # Resolve dispute (ADMIN)
```

## 🏗️ Core Business Logic

### Testimony Lifecycle

1. **Creation**: User creates testimony → Status: `PENDING`
2. **Verification**: Admin reviews → Status: `VERIFIED` or `REJECTED`
3. **QR Code Generation**: Verified testimonies get QR codes for sharing
4. **Public Access**: Only verified testimonies visible via embed ID

### Reputation System

The service calculates user reputation based on:
- Verified testimonies created/received
- Positive vs negative interactions
- Account age and profile completeness
- Community engagement patterns

### Audit Trail

All critical actions are logged including:
- Testimony creation, updates, deletions
- Admin verification decisions
- User interactions and disputes
- System-level changes

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# End-to-end tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📈 Monitoring & Logging

The service provides structured JSON logging with:
- Request/response logging
- Error tracking with context
- Business event logging
- Performance metrics

Log levels: `error`, `warn`, `info`, `debug`

## 🔄 Development Workflow

### Database Changes

```bash
# Create migration after schema changes
npm run db:migrate

# Reset database (development only)
npx prisma migrate reset

# View data in Prisma Studio
npm run db:studio
```

### Code Quality

```bash
# Linting
npm run lint

# Format code
npm run format

# Type checking
npm run build
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start:prod
```

### Docker Support

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 🔒 Security Considerations

- JWT validation using Flocci OS public keys
- Rate limiting on all endpoints
- Input validation and sanitization
- Audit logging for compliance
- Role-based access restrictions

## 📚 API Documentation

When running in development, full OpenAPI documentation is available at `/api/docs` with:
- Interactive API explorer
- Request/response schemas
- Authentication examples
- Error response formats

## 🤝 Integration with Flocci OS

This service integrates seamlessly with:
- **Flocci Identity Service**: User authentication
- **Flocci User Profiles**: Profile data synchronization
- **Flocci Analytics**: Reputation and engagement metrics
- **Flocci Notifications**: Event-driven communications

## 📄 License

This project is proprietary to Flocci and not licensed for external use.

---

**Built with ❤️ by the Flocci Team**
