const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Starting Admin CRUD Tests...');

  try {
    // 1. Login as Admin
    console.log('Login Admin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin3@test.com',
      password: 'admin123',
      fingerprint: 'admin-device'
    });
    const token = loginRes.data.token;
    assert.strictEqual(loginRes.data.user.role, 'admin');
    console.log('Admin Login Passed');

    // 2. Create Flashcard
    console.log('Create Flashcard...');
    const createRes = await axios.post(`${BASE_URL}/flashcards`, {
        question: 'Admin Q', answer: 'Admin A', module: 'Test', year: '1'
    }, { headers: { Authorization: `Bearer ${token}` } });
    assert.strictEqual(createRes.status, 201);
    const cardId = createRes.data.id;

    // 3. Edit Flashcard
    console.log('Edit Flashcard...');
    const editRes = await axios.put(`${BASE_URL}/flashcards/${cardId}`, {
        question: 'Admin Q Edited'
    }, { headers: { Authorization: `Bearer ${token}` } });
    assert.strictEqual(editRes.data.question, 'Admin Q Edited');

    // 4. Delete Flashcard
    console.log('Delete Flashcard...');
    await axios.delete(`${BASE_URL}/flashcards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    // Verify deletion
    try {
        await axios.put(`${BASE_URL}/flashcards/${cardId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        assert.fail('Should have failed');
    } catch (e) {
        assert.strictEqual(e.response.status, 404);
    }
    console.log('Flashcard CRUD Passed');

    // 5. Create Question
    console.log('Create Question...');
    const qRes = await axios.post(`${BASE_URL}/quiz/questions`, {
        question: 'Quiz Q', options: ['A','B'], correct_option: 0, type: 'practice'
    }, { headers: { Authorization: `Bearer ${token}` } });
    const qId = qRes.data.id;

    // 6. Delete Question
    console.log('Delete Question...');
    await axios.delete(`${BASE_URL}/quiz/questions/${qId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
     try {
        await axios.delete(`${BASE_URL}/quiz/questions/${qId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        assert.fail('Should have failed');
    } catch (e) {
        assert.strictEqual(e.response.status, 404);
    }
    console.log('Question CRUD Passed');

    // 7. Verify Student Cannot Create
    console.log('Verify Student Restrictions...');
    const studentRes = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Student', email: `s${Date.now()}@t.com`, password: '123'
    });
    // Login
    const sLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: JSON.parse(studentRes.config.data).email, password: '123', fingerprint: 's-dev'
    });
    const sToken = sLogin.data.token;

    try {
        await axios.post(`${BASE_URL}/flashcards`, { q:'bad' }, { headers: { Authorization: `Bearer ${sToken}` } });
        assert.fail('Student should not create');
    } catch (e) {
        assert.strictEqual(e.response.status, 403);
    }
    console.log('Restriction Check Passed');

    console.log('All Admin Tests Passed!');

  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runTests();
