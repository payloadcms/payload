import express from 'express';
import * as payload from '../index';

describe('Basic Payload Tests', () => {
  test('Instantiate Payload', () => {
    const app = express();
    payload.init(app);
    expect(payload).toBeDefined();
  });
});
