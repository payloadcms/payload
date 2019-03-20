import express from 'express';

export function getConfiguredExpress() {
  let expressApp = express();
  expressApp.set('view engine', 'pug');
  return expressApp;
}
