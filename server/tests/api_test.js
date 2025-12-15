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
    console.log('Register Passed');

    const email = registerRes.config.data ? JSON.parse(registerRes.config.data).email : null;

    // 2. Login User (Device 1)
    console.log('Testing Login Device 1...');
    const loginRes1 = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: 'password123',
      fingerprint: 'device1'
    });
    assert.strictEqual(loginRes1.status, 200);
    assert.ok(loginRes1.data.token);
    console.log('Login Device 1 Passed');

    // 3. Login User (Device 2)
    console.log('Testing Login Device 2...');
    const loginRes2 = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: 'password123',
      fingerprint: 'device2'
    });
    assert.strictEqual(loginRes2.status, 200);
    console.log('Login Device 2 Passed');

    // 4. Login User (Device 3 - Should Fail)
    console.log('Testing Login Device 3 (Should Fail)...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password: 'password123',
        fingerprint: 'device3'
      });
      console.error('Login Device 3 Should have failed but passed');
      process.exit(1);
    } catch (error) {
      assert.strictEqual(error.response.status, 403);
      console.log('Login Device 3 Failed as expected');
    }

    // 5. Login User (Device 1 Again - Should Pass)
    console.log('Testing Login Device 1 Again...');
    const loginRes1Again = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: 'password123',
      fingerprint: 'device1'
    });
    assert.strictEqual(loginRes1Again.status, 200);
    console.log('Login Device 1 Again Passed');

    console.log('All API Tests Passed!');
  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runTests();
