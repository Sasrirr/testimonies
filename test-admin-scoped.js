// Test org-scoped admin functionality
// Run AFTER creating admin records in database
// node test-admin-scoped.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/api/v1';

async function testOrgScopedAdminFunctionality() {
    console.log('🔒 Testing Org-Scoped Admin Functionality...\n');

    try {
        // Step 1: Login as OrgA Admin
        console.log('1. OrgA Admin login...');
        const orgALogin = await axios.post(`${BASE_URL}/login`, {
            email: "admin-orga2@test.com",
            password: "password123"
        });
        const orgAToken = orgALogin.data.accessToken;
        console.log('✅ OrgA Admin logged in');

        // Step 2: Login as OrgB Admin
        console.log('2. OrgB Admin login...');
        const orgBLogin = await axios.post(`${BASE_URL}/login`, {
            email: "admin-orgb2@test.com",
            password: "password123"
        });
        const orgBToken = orgBLogin.data.accessToken;
        console.log('✅ OrgB Admin logged in');

        // Step 3: Test OrgA Admin Dashboard Stats (should be org-scoped)
        console.log('\n3. OrgA Admin - Get Dashboard Stats...');
        try {
            const orgAStats = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
                headers: { Authorization: `Bearer ${orgAToken}` }
            });
            console.log('✅ OrgA Stats:', JSON.stringify(orgAStats.data, null, 2));
        } catch (error) {
            console.log('❌ OrgA Stats Error:', error.response?.data);
        }

        // Step 4: Test OrgB Admin Dashboard Stats (should be org-scoped)
        console.log('\n4. OrgB Admin - Get Dashboard Stats...');
        try {
            const orgBStats = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
                headers: { Authorization: `Bearer ${orgBToken}` }
            });
            console.log('✅ OrgB Stats:', JSON.stringify(orgBStats.data, null, 2));
        } catch (error) {
            console.log('❌ OrgB Stats Error:', error.response?.data);
        }

        // Step 5: Test OrgA Admin Pending Testimonies (should only see OrgA testimonies)
        console.log('\n5. OrgA Admin - Get Pending Testimonies...');
        try {
            const orgAPending = await axios.get(`${BASE_URL}/admin/testimonies/pending`, {
                headers: { Authorization: `Bearer ${orgAToken}` }
            });
            console.log('✅ OrgA Pending Testimonies Count:', orgAPending.data.length);
            if (orgAPending.data.length > 0) {
                console.log('   First testimony about org:', orgAPending.data[0].subject?.organization?.orgName);
            }
        } catch (error) {
            console.log('❌ OrgA Pending Error:', error.response?.data);
        }

        // Step 6: Test OrgB Admin Pending Testimonies (should only see OrgB testimonies)
        console.log('\n6. OrgB Admin - Get Pending Testimonies...');
        try {
            const orgBPending = await axios.get(`${BASE_URL}/admin/testimonies/pending`, {
                headers: { Authorization: `Bearer ${orgBToken}` }
            });
            console.log('✅ OrgB Pending Testimonies Count:', orgBPending.data.length);
            if (orgBPending.data.length > 0) {
                console.log('   First testimony about org:', orgBPending.data[0].subject?.organization?.orgName);
            }
        } catch (error) {
            console.log('❌ OrgB Pending Error:', error.response?.data);
        }

        // Step 7: Get testimony IDs for verification tests
        console.log('\n7. Getting testimony IDs for verification tests...');
        let orgATestimonyId = null;
        let orgBTestimonyId = null;

        try {
            const orgAPending = await axios.get(`${BASE_URL}/admin/testimonies/pending`, {
                headers: { Authorization: `Bearer ${orgAToken}` }
            });
            if (orgAPending.data.length > 0) {
                orgATestimonyId = orgAPending.data[0].id;
                console.log('✅ Found OrgA testimony ID:', orgATestimonyId);
            }
        } catch (error) {
            console.log('❌ Could not get OrgA testimony ID');
        }

        try {
            const orgBPending = await axios.get(`${BASE_URL}/admin/testimonies/pending`, {
                headers: { Authorization: `Bearer ${orgBToken}` }
            });
            if (orgBPending.data.length > 0) {
                orgBTestimonyId = orgBPending.data[0].id;
                console.log('✅ Found OrgB testimony ID:', orgBTestimonyId);
            }
        } catch (error) {
            console.log('❌ Could not get OrgB testimony ID');
        }

        // Step 8: Test OrgA Admin verifying OrgA testimony (should work)
        if (orgATestimonyId) {
            console.log('\n8. OrgA Admin - Verify OrgA testimony (should work)...');
            try {
                const verification = await axios.post(`${BASE_URL}/admin/verifications`, {
                    testimonyId: orgATestimonyId,
                    outcome: "VERIFIED",
                    notes: "Verified by OrgA admin - org-scoped test"
                }, {
                    headers: { Authorization: `Bearer ${orgAToken}` }
                });
                console.log('✅ OrgA Admin successfully verified OrgA testimony');
                console.log('   Verification result:', JSON.stringify(verification.data, null, 2));
            } catch (error) {
                console.log('❌ OrgA Admin verification failed:', error.response?.data);
            }
        }

        // Step 9: Test OrgA Admin trying to verify OrgB testimony (should fail)
        if (orgBTestimonyId) {
            console.log('\n9. OrgA Admin - Try to verify OrgB testimony (should fail)...');
            try {
                const verification = await axios.post(`${BASE_URL}/admin/verifications`, {
                    testimonyId: orgBTestimonyId,
                    outcome: "VERIFIED",
                    notes: "Cross-org verification attempt"
                }, {
                    headers: { Authorization: `Bearer ${orgAToken}` }
                });
                console.log('❌ ERROR: OrgA Admin should NOT be able to verify OrgB testimony!');
            } catch (error) {
                console.log('✅ CORRECT: OrgA Admin blocked from verifying OrgB testimony');
                console.log('   Error:', error.response?.data?.message);
            }
        }

        // Step 10: Test OrgB Admin verifying OrgB testimony (should work)
        if (orgBTestimonyId) {
            console.log('\n10. OrgB Admin - Verify OrgB testimony (should work)...');
            try {
                const verification = await axios.post(`${BASE_URL}/admin/verifications`, {
                    testimonyId: orgBTestimonyId,
                    outcome: "VERIFIED",
                    notes: "Verified by OrgB admin - org-scoped test"
                }, {
                    headers: { Authorization: `Bearer ${orgBToken}` }
                });
                console.log('✅ OrgB Admin successfully verified OrgB testimony');
                console.log('   Verification result:', JSON.stringify(verification.data, null, 2));
            } catch (error) {
                console.log('❌ OrgB Admin verification failed:', error.response?.data);
            }
        }

        console.log('\n🎉 Org-Scoped Admin Testing Complete!');
        console.log('\n📋 Expected Results Summary:');
        console.log('✅ Each admin should only see their org\'s testimonies');
        console.log('✅ Each admin should only be able to verify their org\'s testimonies');
        console.log('❌ Cross-org verification attempts should be blocked');

    } catch (error) {
        console.error('❌ Unexpected Error:', error.message);
    }
}

// Run the admin functionality test
testOrgScopedAdminFunctionality();