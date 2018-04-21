const express = require('express');
const app = express();
const mongoose = require('mongoose');

const Payload = require('../');

function initBasicPayload() {
  return new Payload({
    express: app,
    mongoose: mongoose,
    baseURL: 'base123'
  });
}

describe('Basic Payload Tests', () => {
  test('Instantiate Payload', () => {
    const payload = initBasicPayload();
    expect(payload).toBeDefined();
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
