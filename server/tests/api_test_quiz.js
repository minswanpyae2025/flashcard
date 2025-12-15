const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Starting API Tests...');

  try {
    // 1. Register User
    console.log('Testing Register...');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Quiz User',
      email: `quiz${Date.now()}@example.com`,
      password: 'password123'
    });
    assert.strictEqual(registerRes.status, 201);
    const email = JSON.parse(registerRes.config.data).email;
    console.log('Register Passed');

    // 2. Login User
    console.log('Testing Login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: 'password123',
      fingerprint: 'device1'
    });
    const token = loginRes.data.token;
    assert.ok(token);
    console.log('Login Passed');

    // 3. Create Quiz Question (Admin override in sandbox)
    console.log('Testing Create Quiz Question...');
    // We didn't strictly secure the quiz creation endpoint in sandbox for simplicity,
    // assuming we use the token we just got.
    const questionRes = await axios.post(`${BASE_URL}/quiz/questions`, {
      question: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correct_option: 1,
      explanation: 'Basic math',
      type: 'practice'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(questionRes.status, 201);
    const questionId = questionRes.data.id;
    console.log('Create Question Passed');

    // 4. Get Quiz Questions
    console.log('Testing Get Quiz Questions...');
    const getRes = await axios.get(`${BASE_URL}/quiz/questions?type=practice`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.ok(Array.isArray(getRes.data));
    assert.ok(getRes.data.find(q => q.id === questionId));
    console.log('Get Questions Passed');

    // 5. Submit Wrong Answer
    console.log('Testing Submit Wrong Answer...');
    const wrongRes = await axios.post(`${BASE_URL}/quiz/submit`, {
      questionId,
      selectedOption: 0
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(wrongRes.data.isCorrect, false);
    assert.strictEqual(wrongRes.data.correctOption, 1);
    console.log('Submit Wrong Answer Passed');

    // 6. Submit Correct Answer
    console.log('Testing Submit Correct Answer...');
    const correctRes = await axios.post(`${BASE_URL}/quiz/submit`, {
      questionId,
      selectedOption: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(correctRes.data.isCorrect, true);
    console.log('Submit Correct Answer Passed');

    console.log('All API Tests Passed!');
  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runTests();
