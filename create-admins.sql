-- Insert admin records for org-scoped testing
-- Based on the test data output

-- Create OrgA Admin
INSERT INTO admins (id, "userId", "organizationId", permissions) 
VALUES (
  gen_random_uuid(),
  '95c7ed8d-6c9e-46c2-9e3c-43c4c872db5d',  -- OrgA User ID
  'd84dbda0-af1f-461c-9909-75b77e173663',  -- OrgA ID
  '{"verify": true, "manage": true, "scope": "organization"}'::json
);

-- Create OrgB Admin  
INSERT INTO admins (id, "userId", "organizationId", permissions)
VALUES (
  gen_random_uuid(), 
  '55179b7b-8d70-4252-967b-35a7d9f46f85',  -- OrgB User ID
  'c1306aa1-8ca4-44c1-bd7d-5c6d39664820',  -- OrgB ID
  '{"verify": true, "manage": true, "scope": "organization"}'::json
);

-- Verify admin records were created
SELECT 
  a.id as admin_id,
  u.email as admin_email, 
  o."orgName" as organization_name,
  a.permissions
FROM admins a
JOIN users u ON a."userId" = u.id  
JOIN organizations o ON a."organizationId" = o.id;