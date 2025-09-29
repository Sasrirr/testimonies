-- Create sample data for org-scoped admin testing
-- Run this after creating organizations through API

-- First, let's see what organizations we have
SELECT o.id as org_id, o."orgName", u.id as user_id, u.email 
FROM organizations o 
JOIN users u ON o."userId" = u.id;

-- Create admin records linking users to their organizations  
-- Note: Replace the UUIDs with actual values from the query above

-- Example insert (replace with actual UUIDs):
-- INSERT INTO admins (id, "userId", "organizationId", permissions) 
-- VALUES (
--   gen_random_uuid(),
--   'user_uuid_for_org_a',  -- Replace with actual user ID
--   'org_uuid_a',           -- Replace with actual org ID  
--   '{"verify": true, "manage": true}'::json
-- );

-- INSERT INTO admins (id, "userId", "organizationId", permissions)
-- VALUES (
--   gen_random_uuid(), 
--   'user_uuid_for_org_b',  -- Replace with actual user ID
--   'org_uuid_b',           -- Replace with actual org ID
--   '{"verify": true, "manage": true}'::json
-- );

-- Verify admin records were created
SELECT a.id, u.email, o."orgName", a.permissions
FROM admins a
JOIN users u ON a."userId" = u.id  
JOIN organizations o ON a."organizationId" = o.id;