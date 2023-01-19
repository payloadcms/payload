import path from 'path';
import fs from 'fs';
import { generateTypes } from '../src/bin/generateTypes';

const [testConfigDir] = process.argv.slice(2);

let testDir;
if (testConfigDir) {
  testDir = path.resolve(__dirname, testConfigDir);
  setPaths(testDir);
  generateTypes();
} else {
  // Generate types for entire directory
  testDir = __dirname;

  fs.readdirSync(__dirname, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name);
      const configFound = setPaths(suiteDir);
      if (configFound) generateTypes();
    });
}

// Set config path and TS output path using test dir
function setPaths(dir) {
  const configPath = path.resolve(dir, 'config.ts');
  const outputPath = path.resolve(dir, 'payload-types.ts');
  if (fs.existsSync(configPath)) {
    process.env.PAYLOAD_CONFIG_PATH = configPath;
    process.env.PAYLOAD_TS_OUTPUT_PATH = outputPath;
    return true;
  }
  return false;
}
