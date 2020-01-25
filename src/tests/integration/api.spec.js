/**
 * @jest-environment node
 */

import axios from 'axios';
import * as faker from 'faker';

describe('API', () => {
  const token = null;
  let email = '';
  const password = 'test123';

  describe('register', () => {
    it('should allow create user', async () => {
      email = `${faker.name.firstName()}@test.com`;
      const createResponse = await axios.post('http://localhost:3000/users', {
        email: `${email}`,

        password,
      }, { headers: { 'Content-Type': 'application/json' } });
      expect(createResponse.status).toBe(201);

      expect(createResponse.data.result).toHaveProperty('email');
      expect(createResponse.data.result).toHaveProperty('role');
      expect(createResponse.data.result).toHaveProperty('createdAt');
    });
  });

  // TODO: No idea why this is failing
  // describe('login', () => {
  //   it('should allow login', async () => {
  //     const loginResponse = await axios.post('http://localhost:3000/login', {
  //       email: email,
  //       password: password,
  //     }, { headers: { 'Content-Type': 'application/json' } });
  //     token = loginResponse.data.token;
  //     expect(loginResponse.status).toBe(200);
  //   })
  // })

  describe('2', () => {
    it('should allow create page', async () => {
      const createResponse = await axios.post('http://localhost:3000/pages', {
        title: faker.name.firstName(),
        content: faker.lorem.lines(20),
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(createResponse.status).toBe(201);
      expect(createResponse.data.result.title).not.toBeNull();
    });
  });

  describe('3', () => {
    it('should allow create page - locale', async () => {
      const englishCreateResponse = await axios.post('http://localhost:3000/pages', {
        title: `English-${faker.name.firstName()}`,
        content: faker.lorem.lines(20),
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(englishCreateResponse.status).toBe(201);
      const { id } = englishCreateResponse.data.result;

      const spanishCreateResponse = await axios.put(`http://localhost:3000/pages/${id}?locale=es`, {
        title: `Spanish-${faker.name.firstName()}`,
        content: faker.lorem.lines(20),
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(spanishCreateResponse.status).toBe(200);
    });
  });

  describe('4', () => {
    it('should allow querying of page', async () => {
      const title = `English-${faker.name.firstName()}`;
      const englishCreateResponse = await axios.post('http://localhost:3000/pages', {
        title,
        content: faker.lorem.lines(20),
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(englishCreateResponse.status).toBe(201);

      const getResponse = await axios.get(`http://localhost:3000/pages?title=${title}`,
        { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(getResponse.data.totalDocs).toEqual(1);
      expect(getResponse.data.docs[0].title).toEqual(title);
    });
  });

  describe('5', () => {
    it('should allow querying of page - locale', async () => {
      const englishTitle = `English-${faker.name.firstName()}`;
      const englishCreateResponse = await axios.post('http://localhost:3000/pages', {
        title: englishTitle,
        content: faker.lorem.lines(20),
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(englishCreateResponse.status).toBe(201);
      const { id } = englishCreateResponse.data.result;

      const spanishTitle = `Spanish-${faker.name.firstName()}`;
      const spanishCreateResponse = await axios.put(`http://localhost:3000/pages/${id}?locale=es`, {
        title: spanishTitle,
        content: faker.lorem.lines(20),
      }, { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(spanishCreateResponse.status).toBe(200);

      const getResponse1 = await axios.get(`http://localhost:3000/pages?title=${spanishTitle}`,
        { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(getResponse1.data.totalDocs).toEqual(0);

      const getResponse2 = await axios.get(`http://localhost:3000/pages?title=${spanishTitle}&locale=es`,
        { headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' } });
      expect(getResponse2.data.totalDocs).toEqual(1);
      expect(getResponse2.data.docs[0].title).toEqual(spanishTitle);
    });
  });
});
