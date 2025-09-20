-- ========= ENUMS & CUSTOM TYPES =========
-- Define reusable types for data consistency.

CREATE TYPE user_role AS ENUM ('CONSUMER', 'ORGANIZATION', 'EMPLOYEE', 'ADMIN');
CREATE TYPE entity_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'FLAGGED', 'DELETED');
CREATE TYPE testimony_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'DISPUTED', 'TAKEDOWN');
CREATE TYPE interaction_type AS ENUM ('VIEW', 'LIKE', 'SHARE', 'COMMENT', 'FLAG_REPORT');
CREATE TYPE target_entity_type AS ENUM ('TESTIMONY', 'USER', 'ORGANIZATION');
CREATE TYPE verification_source AS ENUM ('MANUAL', 'AUTOMATED', 'THIRD_PARTY');
CREATE TYPE integration_type AS ENUM ('IDENTITY', 'DOCUMENT', 'PLATFORM', 'BUSINESS_TOOL');

-- ========= IDENTITY & CORE PROFILES =========
-- The central Users table, linked to Flocci OS.

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Flocci OS User ID
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE,
    profile_photo_url TEXT,
    role user_role NOT NULL,
    status entity_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    license_id VARCHAR(100),
    contact_info JSONB, -- { address, website, etc. }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    position VARCHAR(100),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB -- { can_moderate: true, can_verify: true }
);

-- ========= TESTIMONIES & VERIFICATION =========
-- The core content of the service.

CREATE TABLE testimonies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL, -- Author can delete account but testimony might remain
    subject_id UUID NOT NULL REFERENCES users(id), -- The user/org the testimony is about
    content TEXT NOT NULL,
    category VARCHAR(100),
    media_url TEXT,
    sentiment VARCHAR(50), -- Can be populated by Synapse AI
    status testimony_status NOT NULL DEFAULT 'PENDING',
    qr_code_url TEXT, -- Link to the public, verified testimony page
    embed_id VARCHAR(30) UNIQUE NOT NULL, -- A short, public-safe ID for the embeddable module
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimony_id UUID UNIQUE NOT NULL REFERENCES testimonies(id) ON DELETE CASCADE,
    proof_type VARCHAR(100) NOT NULL, -- e.g., 'INVOICE_DOCUMENT', 'LINKEDIN_PROFILE', 'API_FETCH'
    proof_data JSONB, -- Contains link to doc, API response, etc.
    source verification_source NOT NULL,
    verified_by_id UUID REFERENCES users(id), -- Admin or system user ID
    outcome testimony_status NOT NULL, -- VERIFIED, REJECTED
    notes TEXT, -- Admin notes on the verification decision
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========= INTERACTIONS, REPUTATION & BEHAVIOR =========
-- Tracking user engagement and calculating trust.

CREATE TABLE interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type target_entity_type NOT NULL,
    target_id UUID NOT NULL,
    interaction interaction_type NOT NULL,
    metadata JSONB, -- e.g., { "comment_text": "Great point!", "flag_reason": "spam" }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reputations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE behavior_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    traits JSONB, -- { "engagement_level": "high", "trustworthiness": "verified" }
    reliability_score NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========= LEGAL, COMPLIANCE & INTEGRATIONS =========
-- Auditing and system connectivity.

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimony_id UUID NOT NULL REFERENCES testimonies(id) ON DELETE CASCADE,
    raised_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_by_id UUID REFERENCES users(id), -- Admin who handled it
    reason TEXT NOT NULL,
    outcome VARCHAR(100), -- e.g., 'TESTIMONY_VERIFIED', 'TESTIMONY_REJECTED'
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, RESOLVED
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES users(id), -- Can be null for system actions
    action TEXT NOT NULL, -- e.g., "User 123 verified testimony 456"
    target_entity target_entity_type,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type integration_type NOT NULL,
    provider VARCHAR(100) NOT NULL, -- e.g., 'LINKEDIN', 'DOCUVERIFY', 'SLACK'
    metadata JSONB NOT NULL, -- { "api_key": "...", "oauth_token": "..." }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========= INDEXES FOR PERFORMANCE =========
CREATE INDEX idx_testimonies_author_id ON testimonies(author_id);
CREATE INDEX idx_testimonies_subject_id ON testimonies(subject_id);
CREATE INDEX idx_interactions_target ON interactions(target_type, target_id);
CREATE INDEX idx_disputes_testimony_id ON disputes(testimony_id);