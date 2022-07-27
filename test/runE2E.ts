/* eslint-disable import/no-extraneous-dependencies, no-console */
import path from 'path';
import shelljs from 'shelljs';

import glob from 'glob';

const playwrightBin = path.resolve(__dirname, '../node_modules/.bin/playwright');

const clearWebpackCache = () => {
  const webpackCachePath = path.resolve(__dirname, '../node_modules/.cache/webpack');
  console.log('Clearing webpack cache.');
  shelljs.rm('-rf', webpackCachePath);
};

const testRunCodes: { suiteName: string; code: number }[] = [];

const executePlaywright = (suitePath: string, bail = false) => {
  console.log(`Executing ${suitePath}...`);
  const playwrightCfg = path.resolve(
    __dirname,
    '..',
    `${bail ? 'playwright.bail.config.ts' : 'playwright.config.ts'}`,
  );

  const cmd = `DISABLE_LOGGING=true ${playwrightBin} test ${suitePath} -c ${playwrightCfg}`;
  console.log('command: ', cmd);
  const { stdout, code } = shelljs.exec(cmd);
  if (code) {
    if (bail) {
      console.error(`TEST FAILURE DURING ${suiteName} suite.`);
      process.exit(1);
    } else {
      testRunCodes.push({ suiteName, code });
    }
  }
  return stdout;
};

const args = process.argv.slice(2);
const suiteName = args[0];

if (!suiteName || args[0].startsWith('-')) {
  // Run all
  console.log('Executing all E2E tests...');
  const bail = args.includes('--bail');
  glob(`${path.resolve(__dirname)}/**/*e2e.spec.ts`, (err, files) => {
    files.forEach((file) => {
      clearWebpackCache();
      executePlaywright(file, bail);
    });
  });
} else {
  // Run specific suite
  clearWebpackCache();
  const suitePath = path.resolve(__dirname, suiteName, 'e2e.spec.ts');
  executePlaywright(suitePath);
}

testRunCodes.forEach((tr) => {
  console.log(`Suite: ${tr.suiteName}, Success: ${tr.code === 0}`);
});

if (testRunCodes.some((tr) => tr.code > 0)) process.exit(1);
