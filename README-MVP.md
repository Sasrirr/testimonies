# 🚀 Flocci Testimonies Microservice - MVP Implementation

## 🎯 MVP Core Objective

This NestJS microservice implements the **minimum viable backend** for Flocci Testimonies, focused exclusively on executing one core workflow:

> **Consumer → Admin → Organization**: A Consumer submits a testimony, an Admin verifies it, and an Organization receives an embeddable ID for their verified testimony.

This single loop establishes the entire "trust as a utility" model.

## 🏗️ MVP Architecture

### Tech Stack
- **Framework**: Node.js with TypeScript on NestJS
- **Database**: PostgreSQL with Prisma ORM  
- **Authentication**: JWT integration with Flocci OS
- **Features**: QR code generation, unique embed IDs, role-based access

### Database Schema (MVP Simplified)
```sql
-- Core entities only
Users (id, fullName, email, role, status)
Organizations (id, userId, orgName)
Admins (id, userId, permissions)
Testimonies (id, authorId, subjectOrganizationId, content, status, qrCodeUrl, embedId)
Verifications (id, testimonyId, verifiedById, outcome, notes)
```

## 🛣️ MVP User Journeys

### 1. Consumer Journey
```http
POST /api/v1/testimonies
Authorization: Bearer <jwt-token>
{
  "subjectOrganizationId": "org-uuid",
  "content": "Excellent service and professional staff!"
}
```

### 2. Admin Journey (The Core of MVP)
```http
# Get pending testimonies
GET /api/v1/admin/testimonies/pending?page=1&limit=10

# Verify testimony (THE CRITICAL ACTION)
POST /api/v1/admin/verifications
{
  "testimonyId": "testimony-uuid",
  "outcome": "VERIFIED",
  "notes": "Verified through direct customer contact"
}
```

### 3. Organization Journey
```http
# View dashboard with stats
GET /api/v1/organizations/me

# Get all testimonies about organization
GET /api/v1/organizations/me/testimonies

# Get verified testimonies with embed codes
GET /api/v1/organizations/me/testimonies/verified
```

### 4. Public Embed (The Money Endpoint 💰)
```http
# No authentication required - this is the public-facing endpoint
GET /api/v1/testimonies/embed/{embedId}

# Returns verified testimony data for website embedding
{
  "embedId": "abc123def456",
  "authorName": "John Smith",
  "orgName": "Tech Solutions Inc",
  "content": "Excellent service...",
  "isVerified": true,
  "verifiedAt": "2024-01-15T10:30:00Z",
  "qrCodeUrl": "data:image/png;base64,..."
}
```

## 🔐 Authentication & Authorization

All authenticated endpoints require a valid JWT from Flocci OS:
```
Authorization: Bearer <jwt-token>
```

### Roles & Permissions
- **CONSUMER**: Can submit testimonies, view own testimonies
- **ORGANIZATION**: Can manage profile, view testimonies about them, get embed codes  
- **ADMIN**: Can verify/reject testimonies, view admin dashboard

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database and JWT settings
```

### 3. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Start Development Server
```bash
npm run start:dev
```

### 5. Access API Documentation
```
http://localhost:3000/api/docs
```

## 🔥 Core MVP Business Logic

### Testimony Creation Flow
1. Consumer submits testimony via `POST /api/v1/testimonies`
2. System generates unique `embedId` using nanoid
3. Testimony status set to `PENDING`
4. Testimony saved to database

### Admin Verification Flow (THE CORE 🎯)
**This is the most important piece of logic in the entire MVP:**

```typescript
// POST /api/v1/admin/verifications
async processVerification(testimonyId, outcome, adminId, notes) {
  await transaction(() => {
    // 1. Update Testimony Status
    await updateTestimony(testimonyId, { 
      status: outcome,
      qrCodeUrl: outcome === 'VERIFIED' ? generateQRCode(embedId) : null
    });
    
    // 2. Create Verification Record  
    await createVerification({
      testimonyId,
      verifiedById: adminId,
      outcome,
      notes
    });
    
    // 3. TODO: Notify Organization (future)
    if (outcome === 'VERIFIED') {
      console.log('Organization should be notified');
    }
  });
}
```

## 📊 Key MVP Endpoints

### Public Endpoints
- `GET /api/v1/testimonies/embed/{embedId}` - **THE MONEY ENDPOINT** 💰

### Consumer Endpoints
- `POST /api/v1/testimonies` - Submit testimony
- `GET /api/v1/me/testimonies` - View own testimonies

### Organization Endpoints  
- `GET /api/v1/organizations/me` - Organization dashboard
- `PUT /api/v1/organizations/me` - Update profile
- `GET /api/v1/organizations/me/testimonies` - All testimonies about org
- `GET /api/v1/organizations/me/testimonies/verified` - Verified testimonies with embed codes

### Admin Endpoints
- `GET /api/v1/admin/dashboard/stats` - Dashboard statistics
- `GET /api/v1/admin/testimonies/pending` - Pending testimonies queue
- `POST /api/v1/admin/verifications` - **CORE VERIFICATION ACTION** 🎯
- `GET /api/v1/admin/verifications` - Verification history

## 🎮 Testing the MVP

### 1. Submit a Testimony (as Consumer)
```bash
curl -X POST http://localhost:3000/api/v1/testimonies \
  -H "Authorization: Bearer <consumer-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectOrganizationId": "org-uuid",
    "content": "Amazing service, highly recommended!"
  }'
```

### 2. Verify the Testimony (as Admin)  
```bash
curl -X POST http://localhost:3000/api/v1/admin/verifications \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "testimonyId": "testimony-uuid",
    "outcome": "VERIFIED",
    "notes": "Verified via phone call"
  }'
```

### 3. Embed the Testimony (Public)
```bash
curl http://localhost:3000/api/v1/testimonies/embed/abc123def456
```

## 🚫 MVP Exclusions

Features explicitly **NOT** included in this MVP:
- ❌ Complex Interactions (likes, shares, comments)
- ❌ Reputation & Behavior Scores  
- ❌ Public User Profiles
- ❌ Employee Roles
- ❌ Automated Verifications
- ❌ Dispute System
- ❌ Media Uploads (text-only testimonies)
- ❌ Advanced Analytics
- ❌ Multi-language Support

## 📦 Project Structure

```
src/
├── main.ts                     # MVP-focused bootstrap
├── auth/                       # Flocci OS JWT integration
│   ├── guards/
│   └── decorators/
├── testimonies/                # Core testimony logic
│   ├── testimonies-mvp.service.ts
│   ├── testimonies-mvp.controller.ts
│   └── dto/
├── organizations/              # Organization management  
│   ├── organizations.service.ts
│   ├── organizations.controller.ts
│   └── dto/
├── admin/                      # Admin verification system
│   ├── admin.service.ts
│   ├── admin.controller.ts 
│   └── dto/
├── common/                     # Shared services
│   └── services/
│       ├── embed-id.service.ts
│       └── qr-code.service.ts
└── prisma/                     # Database layer
    └── prisma.service.ts
```

## 🎯 Success Metrics

The MVP is successful when:
1. ✅ Consumer can submit testimony → Status: PENDING
2. ✅ Admin can verify testimony → Status: VERIFIED + QR Code generated  
3. ✅ Organization gets embed ID and code snippet
4. ✅ Public can access verified testimony via embed endpoint
5. ✅ Complete audit trail of all verification actions

## 🔄 Next Steps (Post-MVP)

After MVP validation:
1. 🔔 **Notification System** - Email/webhook notifications to organizations
2. 📱 **Mobile-friendly Embeds** - Responsive testimony widgets
3. 🎨 **Customizable Embed Styling** - Brand-matched testimonies
4. 📊 **Analytics Dashboard** - Testimony engagement metrics
5. 🤖 **Automated Verification** - ML-assisted verification
6. 🛡️ **Dispute Resolution** - Contested testimony workflow

## 🆘 Support & Documentation

- **API Docs**: `http://localhost:3000/api/docs` (Swagger UI)
- **Database Schema**: `npx prisma studio`
- **Logs**: Structured logging with Pino (check console output)

---

**💡 Remember**: This MVP prioritizes proving the core value proposition over feature completeness. Every line of code serves the essential Consumer → Admin → Organization workflow that establishes Flocci as a "trust as a utility" platform.