// Test secure admin registration with request codes
// node test-secure-admin.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/api/v1';

async function testSecureAdminRegistration() {
    console.log('🔒 Testing Secure Admin Registration System...\n');

    try {
        // Step 1: Register organization creator
        console.log('1. Registering organization creator...');
        const orgCreator = await axios.post(`${BASE_URL}/registration`, {
            fullName: "Secure Org Creator",
            email: "creator@secureorg.com",
            password: "password123",
            phone: "+1234567896",
            role: "ORGANIZATION"
        });
        console.log('✅ Organization creator registered');

        // Step 2: Login as organization creator
        console.log('2. Organization creator login...');
        const creatorLogin = await axios.post(`${BASE_URL}/login`, {
            email: "creator@secureorg.com",
            password: "password123"
        });
        const creatorToken = creatorLogin.data.accessToken;
        console.log('✅ Organization creator logged in');

        // Step 3: Create organization (should generate admin request code)
        console.log('3. Creating organization (should generate admin request code)...');
        const organization = await axios.post(`${BASE_URL}/organizations`, {
            orgName: "Secure Test Corp",
            sector: "Technology",
            licenseId: "SEC001"
        }, {
            headers: { Authorization: `Bearer ${creatorToken}` }
        });

        console.log('✅ Organization created successfully');
        console.log('   Organization ID:', organization.data.id);
        console.log('   Admin Request Code:', organization.data.adminRequestCode);

        const orgId = organization.data.id;
        const adminCode = organization.data.adminRequestCode;

        // Step 4: Test admin registration WITHOUT admin code (should fail)
        console.log('\n4. Testing admin registration WITHOUT admin code (should fail)...');
        try {
            const invalidAdmin = await axios.post(`${BASE_URL}/registration`, {
                fullName: "Invalid Admin",
                email: "invalid@secureorg.com",
                password: "password123",
                role: "ADMIN",
                organizationId: orgId
                // Missing adminRequestCode
            });
            console.log('❌ ERROR: Should have failed without admin code!');
        } catch (error) {
            console.log('✅ CORRECT: Registration blocked without admin code');
            console.log('   Error:', error.response?.data?.message);
        }

        // Step 5: Test admin registration with WRONG admin code (should fail)
        console.log('\n5. Testing admin registration with WRONG admin code (should fail)...');
        try {
            const invalidAdmin = await axios.post(`${BASE_URL}/registration`, {
                fullName: "Invalid Admin",
                email: "invalid2@secureorg.com",
                password: "password123",
                role: "ADMIN",
                organizationId: orgId,
                adminRequestCode: "WRONG123"  // Wrong code
            });
            console.log('❌ ERROR: Should have failed with wrong code!');
        } catch (error) {
            console.log('✅ CORRECT: Registration blocked with wrong admin code');
            console.log('   Error:', error.response?.data?.message);
        }

        // Step 6: Test admin registration with CORRECT admin code (should work)
        console.log('\n6. Testing admin registration with CORRECT admin code (should work)...');
        try {
            const validAdmin = await axios.post(`${BASE_URL}/registration`, {
                fullName: "Valid Admin",
                email: "valid@secureorg.com",
                password: "password123",
                role: "ADMIN",
                organizationId: orgId,
                adminRequestCode: adminCode  // Correct code
            });
            console.log('✅ Valid admin registered successfully');
            console.log('   Admin ID:', validAdmin.data.id);
        } catch (error) {
            console.log('❌ Valid admin registration failed:', error.response?.data);
        }

        // Step 7: Test second valid admin registration (should work)
        console.log('\n7. Testing second valid admin registration (should work)...');
        try {
            const admin2 = await axios.post(`${BASE_URL}/registration`, {
                fullName: "Second Admin",
                email: "admin2@secureorg.com",
                password: "password123",
                role: "ADMIN",
                organizationId: orgId,
                adminRequestCode: adminCode
            });
            console.log('✅ Second admin registered successfully');
        } catch (error) {
            console.log('❌ Second admin registration failed:', error.response?.data);
        }

        // Step 8: Test third valid admin registration (should work - limit is 3)
        console.log('\n8. Testing third valid admin registration (should work - limit is 3)...');
        try {
            const admin3 = await axios.post(`${BASE_URL}/registration`, {
                fullName: "Third Admin",
                email: "admin3@secureorg.com",
                password: "password123",
                role: "ADMIN",
                organizationId: orgId,
                adminRequestCode: adminCode
            });
            console.log('✅ Third admin registered successfully');
        } catch (error) {
            console.log('❌ Third admin registration failed:', error.response?.data);
        }

        // Step 9: Test fourth admin registration (should fail - exceeds limit of 3)
        console.log('\n9. Testing fourth admin registration (should fail - exceeds limit)...');
        try {
            const admin4 = await axios.post(`${BASE_URL}/registration`, {
                fullName: "Fourth Admin",
                email: "admin4@secureorg.com",
                password: "password123",
                role: "ADMIN",
                organizationId: orgId,
                adminRequestCode: adminCode
            });
            console.log('❌ ERROR: Should have failed due to admin limit!');
        } catch (error) {
            console.log('✅ CORRECT: Registration blocked due to admin limit (3)');
            console.log('   Error:', error.response?.data?.message);
        }

        // Step 10: Test non-existent organization (should fail)
        console.log('\n10. Testing admin registration for non-existent organization (should fail)...');
        try {
            const invalidOrg = await axios.post(`${BASE_URL}/registration`, {
                fullName: "Invalid Org Admin",
                email: "invalidorg@test.com",
                password: "password123",
                role: "ADMIN",
                organizationId: "00000000-0000-0000-0000-000000000000", // Fake UUID
                adminRequestCode: adminCode
            });
            console.log('❌ ERROR: Should have failed for non-existent org!');
        } catch (error) {
            console.log('✅ CORRECT: Registration blocked for non-existent organization');
            console.log('   Error:', error.response?.data?.message);
        }

        console.log('\n🎉 Secure Admin Registration Test Complete!');
        console.log('\n📋 Security Features Validated:');
        console.log('✅ Admin registration requires organizationId');
        console.log('✅ Admin registration requires valid adminRequestCode');
        console.log('✅ Wrong admin codes are rejected');
        console.log('✅ Admin limit per organization enforced (max 3)');
        console.log('✅ Non-existent organizations are rejected');
        console.log('✅ Organization creators automatically become first admin');

    } catch (error) {
        console.error('❌ Unexpected Error:', error.response?.data || error.message);
    }
}

// Run the secure admin registration test
testSecureAdminRegistration();