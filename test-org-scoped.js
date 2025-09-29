// Simple test script to verify org-scoped functionality
// Run with: node test-org-scoped.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/api/v1';

async function testOrgScopedAdmins() {
    console.log('🧪 Testing Org-Scoped Admin Model...\n');

    try {
        // Step 1: Try to login directly (users may already exist)
        console.log('1. Attempting to login with existing users or register new ones...');

        let orgARegistered = false;
        try {
            const orgAUser = await axios.post(`${BASE_URL}/registration`, {
                fullName: "OrgA Admin",
                email: "admin-orga2@test.com",  // Different email
                password: "password123",
                phone: "+1234567893",
                role: "ORGANIZATION"
            });
            orgARegistered = true;
            console.log('✅ OrgA User registered');
        } catch (error) {
            console.log('ℹ️  OrgA User may already exist, will try login');
        }

        let orgBRegistered = false;
        try {
            const orgBUser = await axios.post(`${BASE_URL}/registration`, {
                fullName: "OrgB Admin",
                email: "admin-orgb2@test.com",  // Different email
                password: "password123",
                phone: "+1234567894",
                role: "ORGANIZATION"
            });
            orgBRegistered = true;
            console.log('✅ OrgB User registered');
        } catch (error) {
            console.log('ℹ️  OrgB User may already exist, will try login');
        }

        // Step 2: Login as organizations to create org records
        console.log('\n2. OrgA Admin login...');
        const orgALogin = await axios.post(`${BASE_URL}/login`, {
            email: "admin-orga2@test.com",
            password: "password123"
        });
        const orgAToken = orgALogin.data.accessToken;
        const orgAUserId = orgALogin.data.userId;
        console.log('✅ OrgA Admin logged in');

        console.log('3. OrgB Admin login...');
        const orgBLogin = await axios.post(`${BASE_URL}/login`, {
            email: "admin-orgb2@test.com",
            password: "password123"
        });
        const orgBToken = orgBLogin.data.accessToken;
        const orgBUserId = orgBLogin.data.userId;
        console.log('✅ OrgB Admin logged in');

        // Step 3: Create organizations
        console.log('\n4. Creating Organization A...');
        const orgA = await axios.post(`${BASE_URL}/organizations`, {
            orgName: "Tech Solutions Inc",
            sector: "Technology",
            licenseId: "TECH001"
        }, {
            headers: { Authorization: `Bearer ${orgAToken}` }
        });
        console.log('✅ Organization A created');

        console.log('5. Creating Organization B...');
        const orgB = await axios.post(`${BASE_URL}/organizations`, {
            orgName: "Healthcare Partners LLC",
            sector: "Healthcare",
            licenseId: "HEALTH001"
        }, {
            headers: { Authorization: `Bearer ${orgBToken}` }
        });
        console.log('✅ Organization B created');

        // Step 4: Register consumer and create testimonies
        console.log('\n6. Registering Consumer...');
        const consumer = await axios.post(`${BASE_URL}/registration`, {
            fullName: "Test Consumer",
            email: "consumer2@test.com",
            password: "password123",
            phone: "+1234567895",
            role: "CONSUMER"
        });
        console.log('✅ Consumer registered');

        console.log('7. Consumer login...');
        const consumerLogin = await axios.post(`${BASE_URL}/login`, {
            email: "consumer2@test.com",
            password: "password123"
        });
        const consumerToken = consumerLogin.data.accessToken;
        console.log('✅ Consumer logged in');

        // Create testimonies about both organizations
        console.log('\n8. Creating testimony about OrgA...');
        const testimonyA = await axios.post(`${BASE_URL}/testimonies`, {
            subjectId: orgAUserId,
            content: "Excellent tech support and innovative solutions!",
            category: "SERVICE_QUALITY"
        }, {
            headers: { Authorization: `Bearer ${consumerToken}` }
        });
        console.log('✅ Testimony about OrgA created');

        console.log('9. Creating testimony about OrgB...');
        const testimonyB = await axios.post(`${BASE_URL}/testimonies`, {
            subjectId: orgBUserId,
            content: "Outstanding healthcare services and caring staff!",
            category: "SERVICE_QUALITY"
        }, {
            headers: { Authorization: `Bearer ${consumerToken}` }
        });
        console.log('✅ Testimony about OrgB created');

        // Note: We need to manually create admin records in database first
        console.log('\n⚠️  Next steps:');
        console.log('1. Create admin records in database using the organization IDs');
        console.log('2. Test org-scoped admin endpoints');
        console.log(`\nOrgA User ID: ${orgAUserId}`);
        console.log(`OrgB User ID: ${orgBUserId}`);
        console.log(`OrgA ID: ${orgA.data.id}`);
        console.log(`OrgB ID: ${orgB.data.id}`);

        return {
            orgAUserId,
            orgBUserId,
            orgAId: orgA.data.id,
            orgBId: orgB.data.id,
            orgAToken,
            orgBToken,
            testimonyAId: testimonyA.data.id,
            testimonyBId: testimonyB.data.id
        };

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run the test
testOrgScopedAdmins().then(result => {
    if (result) {
        console.log('\n📊 Test Data Created Successfully!');
        console.log('Use the IDs above to create admin records in the database.');
    }
});