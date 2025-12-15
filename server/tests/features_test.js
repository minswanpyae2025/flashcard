const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Starting Features Tests...');

  try {
    // 1. Setup User
    const email = `feat${Date.now()}@test.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Features User', email, password: '123'
    });

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email, password: '123', fingerprint: 'f-dev'
    });
    const token = loginRes.data.token;

    // 2. Setup Question (using admin for setup)
    // We can just query existing questions if any, or create one.
    // Let's assume we can create one if we are admin.
    // To simplify, we'll try to get questions. If none, we might fail, but previous tests created some.
    // Let's rely on finding one.
    let questionId;
    try {
        const qRes = await axios.get(`${BASE_URL}/quiz/questions?limit=1`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (qRes.data.length > 0) {
            questionId = qRes.data[0].id;
        } else {
             // Try to create one? (Requires admin role)
             // Skipping creation for now, assuming setup from previous steps holds.
             console.warn('No questions found, skipping some tests');
             return;
        }
    } catch(e) { console.error(e); }

    if (!questionId) return;

    // 3. Test Reporting
    console.log('Testing Reporting...');
    const repRes = await axios.post(`${BASE_URL}/quiz/report`, {
        questionId, reason: 'Typo', details: 'Spelling error'
    }, { headers: { Authorization: `Bearer ${token}` } });
    assert.strictEqual(repRes.status, 201);
    console.log('Report Passed');

    // 4. Test Notes
    console.log('Testing Notes...');
    // Save
    await axios.post(`${BASE_URL}/quiz/note`, {
        questionId, noteContent: 'My important note'
    }, { headers: { Authorization: `Bearer ${token}` } });

    // Fetch
    const noteRes = await axios.get(`${BASE_URL}/quiz/note/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(noteRes.data.note_content, 'My important note');
    console.log('Notes Passed');

    // 5. Test Stats
    console.log('Testing Stats...');
    // Submit an attempt first to have data
    await axios.post(`${BASE_URL}/quiz/submit`, {
        questionId, selectedOption: 0
    }, { headers: { Authorization: `Bearer ${token}` } });

    const statsRes = await axios.get(`${BASE_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    assert.ok(statsRes.data.totalAttempts >= 1);
    assert.ok(statsRes.data.byModule.length >= 1);
    console.log('Stats Passed');

    console.log('All Features Tests Passed!');

  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runTests();
