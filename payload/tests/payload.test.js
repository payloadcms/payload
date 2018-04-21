const express = require('express');
const app = express();
const mongoose = require('mongoose');

const Payload = require('../');

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

function initBasicPayload() {
  return new Payload({
    express: app,
    mongoose,
    baseURL: 'base123'
  });
}