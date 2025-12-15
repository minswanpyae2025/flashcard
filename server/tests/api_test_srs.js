const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Starting API Tests...');

  try {
    // 1. Register User
    console.log('Testing Register...');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
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

    // 3. Create Flashcard
    console.log('Testing Create Flashcard...');
    const cardRes = await axios.post(`${BASE_URL}/flashcards`, {
      question: 'What is the capital of France?',
      answer: 'Paris',
      module: 'Geography',
      year: '1',
      tags: 'europe'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(cardRes.status, 201);
    const cardId = cardRes.data.id;
    console.log('Create Flashcard Passed');

    // 4. Get Due Reviews
    console.log('Testing Get Due Reviews...');
    const dueRes = await axios.get(`${BASE_URL}/reviews/due`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.ok(Array.isArray(dueRes.data));
    assert.ok(dueRes.data.find(c => c.id === cardId));
    console.log('Get Due Reviews Passed');

    // 5. Submit Review (Good)
    console.log('Testing Submit Review (Good)...');
    const reviewRes = await axios.post(`${BASE_URL}/reviews`, {
      cardId: cardId,
      rating: 'good'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(reviewRes.status, 200);
    // Check next review date is in future
    const nextReview = new Date(reviewRes.data.nextReview);
    assert.ok(nextReview > new Date());
    console.log('Submit Review Passed');

    console.log('All API Tests Passed!');
  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runTests();
