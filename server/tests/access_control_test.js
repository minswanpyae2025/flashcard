const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Starting Access Control Tests...');

  try {
    // 1. Admin Login (Reuse existing admin or create new if needed)
    // We'll rely on the existing admin from previous steps (admin3@test.com)
    // If not, we fail.
    const adminEmail = 'admintest@test.com'; // Created in advanced_admin_test
    const adminPass = '123';

    // Ensure admin exists (or re-register if DB wiped)
    // Actually, DB is wiped in backend refactor (force:true used in index.js for this step? No, Phase 1 had force:true, this step has alter:true?)
    // Let's check index.js sync call. It was changed to alter:true in previous turn.
    // So data persists.

    let adminToken;
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: adminEmail, password: adminPass, fingerprint: 'admin-dev'
        });
        adminToken = loginRes.data.token;
    } catch (e) {
        console.warn('Admin login failed, creating new admin...');
        const email = `admin_access_${Date.now()}@test.com`;
        await axios.post(`${BASE_URL}/auth/register`, { name: 'Admin', email, password: '123' });
        // Elevate
        const { execSync } = require('child_process');
        execSync(`python -c "import sqlite3; conn = sqlite3.connect('server/database.sqlite'); cursor = conn.cursor(); cursor.execute(\\\"UPDATE Users SET role = 'admin' WHERE email = '${email}'\\\"); conn.commit(); conn.close()"`);

        const login = await axios.post(`${BASE_URL}/auth/login`, { email, password: '123', fingerprint: 'adm' });
        adminToken = login.data.token;
    }

    // 2. Create Categories & Content
    console.log('Setup Content...');
    const cat1 = await axios.post(`${BASE_URL}/api/admin/categories`, { name: 'Cat1', type: 'flashcard' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    const cat2 = await axios.post(`${BASE_URL}/api/admin/categories`, { name: 'Cat2', type: 'flashcard' }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const card1 = await axios.post(`${BASE_URL}/flashcards`, { question: 'Q1', answer: 'A1', CategoryId: cat1.data.id }, { headers: { Authorization: `Bearer ${adminToken}` } });
    const card2 = await axios.post(`${BASE_URL}/flashcards`, { question: 'Q2', answer: 'A2', CategoryId: cat2.data.id }, { headers: { Authorization: `Bearer ${adminToken}` } });

    // 3. Create Student
    console.log('Create Student...');
    const studentEmail = `student_${Date.now()}@test.com`;
    const sReg = await axios.post(`${BASE_URL}/auth/register`, { name: 'Student', email: studentEmail, password: '123' });

    const sLogin = await axios.post(`${BASE_URL}/auth/login`, { email: studentEmail, password: '123', fingerprint: 's-dev' });
    const sToken = sLogin.data.token;
    const sId = sLogin.data.user.id;

    // 4. Verify No Access Initially
    console.log('Verify Restricted Access...');
    const res1 = await axios.get(`${BASE_URL}/flashcards`, { headers: { Authorization: `Bearer ${sToken}` } });
    assert.strictEqual(res1.data.length, 0);

    // 5. Grant Access to Cat1
    console.log('Grant Access...');
    await axios.post(`${BASE_URL}/api/admin/users/${sId}/access`, { categoryIds: [cat1.data.id] }, { headers: { Authorization: `Bearer ${adminToken}` } });

    // 6. Verify Access to Cat1 Only
    console.log('Verify Granted Access...');
    const res2 = await axios.get(`${BASE_URL}/flashcards`, { headers: { Authorization: `Bearer ${sToken}` } });
    assert.strictEqual(res2.data.length, 1);
    assert.strictEqual(res2.data[0].id, card1.data.id);

    console.log('All Access Tests Passed!');

  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runTests();
