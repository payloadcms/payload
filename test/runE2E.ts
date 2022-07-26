/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';
import shelljs from 'shelljs';

import glob from 'glob';

const playwrightBin = path.resolve(__dirname, '../node_modules/.bin/playwright');
const playwrightCfg = path.resolve(__dirname, '../playwright.config.ts');
const webpackCachePath = path.resolve(__dirname, '../node_modules/.cache/webpack');

const getPlaywrightCommand = (suiteName: string, suitePath: string) => {
  return `DISABLE_LOGGING=true PLAYWRIGHT_JSON_OUTPUT_NAME=results-${suiteName}.json ${playwrightBin} test ${suitePath} -c ${playwrightCfg} --reporter=json`;
};

const [suiteName] = process.argv.slice(2);
console.log('Clearing webpack cache.');
shelljs.rm('-rf', webpackCachePath);

// Run specific suite
if (suiteName) {
  const suitePath = path.resolve(__dirname, suiteName, 'e2e.spec.ts');
  console.log(`Executing ${suitePath}...`);
  const { stderr } = shelljs.exec(getPlaywrightCommand(suiteName, suitePath));
  if (stderr && !stderr.includes('webpack')) {
    throw new Error(`ERROR: ${stderr}`);
  }
}

// Run all
console.log('Executing all E2E tests...');
glob(`${path.resolve(__dirname)}/**/*e2e.spec.ts`, (err, files) => {
  files.forEach((file, i) => {
    shelljs.rm('-rf', webpackCachePath);
    console.log(`Executing ${file}`);
    const { stderr } = shelljs.exec(getPlaywrightCommand(suiteName, file));
    if (stderr && !stderr.includes('webpack')) {
      throw new Error(`ERROR: ${stderr}`);
    }
  });
});
