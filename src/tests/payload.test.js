/* eslint-disable global-require */

import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { Payload } from '../';
import * as utils from './testUtils';

const app = express();

function initBasicPayload() {
  return new Payload({
    express: app,
    mongoose: mongoose,
    baseURL: 'localhost'
  });
}

describe('Basic Payload Tests', () => {
  test('Instantiate Payload', () => {
    const payload = initBasicPayload();
    expect(payload).toBeDefined();
  });
});

describe('API route tests', () => {
  test('Mount /api route', (done) => {
    const expressApp = utils.getConfiguredExpress();
    const payload = new Payload({
      express: expressApp,
      mongoose: mongoose,
      baseURL: 'localhost'
    });

    let server = expressApp.listen(3000);
    request(expressApp).get('/api').then((response) => {
      expect(response.statusCode).toEqual(200);
      server.close();
      done();
    });
  });

  test('Mount /api/testmodel GET route', (done) => {
    const expressApp = utils.getConfiguredExpress();
    const payload = new Payload({
      express: expressApp,
      mongoose: mongoose,
      baseURL: 'localhost'
    });

    // File contains what a developer would write
    require('./models/testModel')(payload);

    let server = expressApp.listen(3000);
    request(expressApp).get('/api/testmodel').then((response) => {
      expect(response.statusCode).toEqual(200);
      server.close();
      done();
    });
  });

  test('Mount /api/testmodel POST route', (done) => {
    const expressApp = utils.getConfiguredExpress();
    const payload = new Payload({
      express: expressApp,
      mongoose: mongoose,
      baseURL: 'localhost'
    });

    // File contains what a developer would write
    require('./models/testModel')(payload);

    let server = expressApp.listen(3000);
    request(expressApp).post('/api/testmodel').then((response) => {
      expect(response.statusCode).toEqual(201);
      server.close();
      done();
    });
  });
});
