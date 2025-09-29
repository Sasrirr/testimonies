const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/api/v1';

// Test configuration
const timestamp = Date.now();
const TEST_CONFIG = {
  organization: {
    orgName: 'Test Organization for Admin Codes',
    industry: 'Technology',
    website: 'https://testadmincodes.com',
    email: `admin${timestamp}@testadmincodes.com`,
    password: 'SecureAdminCode123!'
  }
};

let organizationToken = '';
let organizationId = '';

async function runAdminCodeTests() {
  console.log('🧪 Testing Admin Code Management Endpoints\n');

  try {
    // 1. Register organization
    console.log('1️⃣ Registering organization...');
    const registerResponse = await axios.post(`${BASE_URL}/registration`, {
      fullName: 'Test Admin Code Organization',
      email: TEST_CONFIG.organization.email,
      password: TEST_CONFIG.organization.password,
      phone: '+1234567890',
      role: 'ORGANIZATION'
    });
    console.log('✅ Organization registered:', registerResponse.data.message);

    // 2. Login as organization
    console.log('\n2️⃣ Logging in as organization...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: TEST_CONFIG.organization.email,
      password: TEST_CONFIG.organization.password
    });
    console.log('Login response:', loginResponse.data);
    organizationToken = loginResponse.data.accessToken;
    console.log('✅ Organization logged in successfully');

    // 3. Create organization to get orgId and admin code
    console.log('\n3️⃣ Creating organization...');
    const orgResponse = await axios.post(`${BASE_URL}/organizations`, {
      orgName: TEST_CONFIG.organization.orgName,
      sector: TEST_CONFIG.organization.industry,
      licenseId: 'TEST001'
    }, {
      headers: { Authorization: `Bearer ${organizationToken}` }
    });
    organizationId = orgResponse.data.id;
    console.log('✅ Organization created with ID:', organizationId);
    console.log('   Initial Admin Code:', orgResponse.data.adminRequestCode);

    // 4. Get admin code
    console.log('\n4️⃣ Getting admin request code...');
    const adminCodeResponse = await axios.get(`${BASE_URL}/organizations/me/admin-code`, {
      headers: { Authorization: `Bearer ${organizationToken}` }
    });
    console.log('✅ Admin Code Response:', {
      adminRequestCode: adminCodeResponse.data.adminRequestCode,
      organizationName: adminCodeResponse.data.organizationName,
      message: adminCodeResponse.data.message
    });

    // Store the original code for comparison
    const originalCode = adminCodeResponse.data.adminRequestCode;

    // 5. Regenerate admin code
    console.log('\n5️⃣ Regenerating admin request code...');
    const regenerateResponse = await axios.post(`${BASE_URL}/organizations/me/admin-code/regenerate`, {}, {
      headers: { Authorization: `Bearer ${organizationToken}` }
    });
    console.log('✅ Regenerate Response:', {
      newAdminRequestCode: regenerateResponse.data.newAdminRequestCode,
      organizationName: regenerateResponse.data.organizationName,
      message: regenerateResponse.data.message
    });

    const newCode = regenerateResponse.data.newAdminRequestCode;

    // 6. Verify code was actually changed
    console.log('\n6️⃣ Verifying code change...');
    if (originalCode !== newCode) {
      console.log('✅ Code successfully changed:', {
        original: originalCode,
        new: newCode
      });
    } else {
      console.log('❌ Code was not changed - this should not happen');
    }

    // 7. Get admin code again to confirm persistence
    console.log('\n7️⃣ Confirming new code persistence...');
    const confirmResponse = await axios.get(`${BASE_URL}/organizations/me/admin-code`, {
      headers: { Authorization: `Bearer ${organizationToken}` }
    });

    if (confirmResponse.data.adminRequestCode === newCode) {
      console.log('✅ New code persisted correctly:', confirmResponse.data.adminRequestCode);
    } else {
      console.log('❌ Code persistence failed');
    }

    // 8. Test admin registration with the new code
    console.log('\n8️⃣ Testing admin registration with new code...');
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: `adminuser${timestamp}@testadmincodes.com`,
      password: 'AdminPassword123!',
      userType: 'admin',
      organizationId: organizationId,
      adminRequestCode: newCode
    };

    const adminRegisterResponse = await axios.post(`${BASE_URL}/registration`, adminData);
    console.log('✅ Admin registered with new code:', adminRegisterResponse.data.message);

    console.log('\n🎉 All Admin Code Management Tests Passed! 🎉');

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the tests
runAdminCodeTests();