/* eslint-disable no-magic-numbers */
const express = require('express');
const app = express();
const mongoose = require('mongoose');

const request = require('supertest');

const Payload = require('../');

function initBasicPayload() {
  return new Payload({
    express: app,
    mongoose: mongoose,
    baseURL: 'base123'
  });
}

function getConfiguredExpress() {
  let expressApp = express();
  expressApp.set('view engine', 'pug'); //TODO: Reactify
  return expressApp;
}

describe('Basic Payload Tests', () => {
  test('Instantiate Payload', () => {
    const payload = initBasicPayload();
    expect(payload).toBeDefined();
  });

  test('Mount Admin view', (done) => {
    const expressApp = getConfiguredExpress();
    const payload = new Payload({
      express: expressApp,
      mongoose: mongoose,
      baseURL: 'base123'
    });

    expressApp.set('views', payload.views);
    let server = expressApp.listen(3000, () => { console.log('Example app listening on http://localhost:3000');});

    request(expressApp).get('/payload/admin').then((response) => {
      expect(response.statusCode).toEqual(200);
      server.close();
      done();
    });
  });

  test('Create new collection', () => {
    const payload = initBasicPayload();
    let collection = payload.newCollection('key');
    expect(collection).toBeDefined();
  });

  test('Retrieve collection', () => {
    const payload = initBasicPayload();
    let collection = payload.newCollection('key');
    collection.register();
    let retrieved = payload.getCollection('key');
    expect(retrieved).toBeDefined();
  });

  test('Expect error on attempt to create collection already existing', () => {
    const payload = initBasicPayload();
    let collection = payload.newCollection('key');
    collection.register();
    let duplicateCollection = payload.newCollection('key');
    expect(duplicateCollection.toString()).toEqual('Error: key already exists in collections');
  });

  test('Expect error on attempt to retrieve non-existent collection', () => {
    const payload = initBasicPayload();
    let collection = payload.getCollection('key');
    expect(collection.toString()).toEqual('Error: key does not exist or has not been registered yet');
  });
});

describe('Collection tests', () => {
  test('Add fields to collection', () => {
    const payload = initBasicPayload();
    let collection = payload.newCollection('key');
    collection.add({
      test: { testProp: 'firstProp'}
    });
    expect(collection.fields.test.testProp).toBe('firstProp');
  });
});
