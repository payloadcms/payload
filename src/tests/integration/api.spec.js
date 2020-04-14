/**
 * @jest-environment node
 */

const axios = require('axios');
const faker = require('faker');

describe('API', () => {
  let token = null;
  let email = 'test@test.com';
  const password = 'test123';

  describe('first register', () => {
    it('should allow first user to register', async () => {
      const createResponse = await axios.post('http://localhost:3000/api/first-register', {
        email,
        password,
      }, { headers: { 'Content-Type': 'application/json' } });
      expect(createResponse.status).toBe(201);
      expect(createResponse.data).toHaveProperty('email');
      expect(createResponse.data).toHaveProperty('role');
      expect(createResponse.data).toHaveProperty('createdAt');
    });
  });

  describe('login', () => {
    it('should allow login', async () => {
      const loginResponse = await axios.post('http://localhost:3000/api/login', {
        email,
        password,
      }, { headers: { 'Content-Type': 'application/json' } });
      ({ token } = loginResponse.data); // Store token
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data.token).not.toBeNull();
    });
  });

  describe('register', () => {
    it('should allow create user', async () => {
      email = `${faker.name.firstName()}@test.com`;
      const createResponse = await axios.post('http://localhost:3000/api/users/register', {
        email: `${email}`,
        password,
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(createResponse.status).toBe(201);

      expect(createResponse.data).toHaveProperty('email');
      expect(createResponse.data).toHaveProperty('role');
      expect(createResponse.data).toHaveProperty('createdAt');
    });
  });

  describe('Collections - Post', () => {
    it('should allow create post', async () => {
      const createResponse = await axios.post('http://localhost:3000/api/posts', {
        title: faker.name.firstName(),
        description: faker.lorem.lines(20),
        priority: 1,
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(createResponse.status).toBe(201);
      expect(createResponse.data.title).not.toBeNull();
    });

    it('should allow create post - localized', async () => {
      const spanishDesc = faker.lorem.lines(20);
      const englishDesc = faker.lorem.lines(20);
      const englishCreateResponse = await axios.post('http://localhost:3000/api/posts', {
        title: `English-${faker.name.firstName()}`,
        description: englishDesc,
        priority: 1,
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(englishCreateResponse.status).toBe(201);
      const { id } = englishCreateResponse.data.doc;

      const spanishCreateResponse = await axios.put(`http://localhost:3000/api/posts/${id}?locale=es`, {
        title: `Spanish-${faker.name.firstName()}`,
        description: spanishDesc,
        priority: 1,
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(spanishCreateResponse.status).toBe(200);
      expect(spanishCreateResponse.data.doc.description).toBe(spanishDesc);

      const englishQueryResponse = await axios.get(`http://localhost:3000/api/posts/${id}`);
      expect(englishQueryResponse.status).toBe(200);
      expect(englishQueryResponse.data.description).toBe(englishDesc);

      const englishQueryResponseWithLocale = await axios.get(`http://localhost:3000/api/posts/${id}?locale=en`);
      expect(englishQueryResponseWithLocale.status).toBe(200);
      expect(englishQueryResponseWithLocale.data.description).toBe(englishDesc);

      const spanishQueryResponse = await axios.get(`http://localhost:3000/api/posts/${id}/?locale=es`);
      expect(spanishQueryResponse.status).toBe(200);
      expect(spanishQueryResponse.data.description).toBe(spanishDesc);

      const allQueryResponse = await axios.get(`http://localhost:3000/api/posts/${id}/?locale=all`);
      expect(allQueryResponse.status).toBe(200);
      expect(allQueryResponse.data.description.es).toBe(spanishDesc);
      expect(allQueryResponse.data.description.en).toBe(englishDesc);
    });
  });
});
