import path from 'path';
import fs from 'fs';
import { generateGraphQLSchema } from '../src/bin/generateGraphQLSchema';

const [testConfigDir] = process.argv.slice(2);

const testDir = path.resolve(__dirname, testConfigDir);
setPaths(testDir);
generateGraphQLSchema();

// Set config path and TS output path using test dir
function setPaths(dir) {
  const configPath = path.resolve(dir, 'config.ts');
  if (fs.existsSync(configPath)) {
    process.env.PAYLOAD_CONFIG_PATH = configPath;
    return true;
  }
  return false;
}
