import path from 'path';
import { v4 as uuid } from 'uuid';
import { CollectionConfig } from '../../src/collections/config/types';
import { Config, SanitizedConfig, InitOptions } from '../../src/config/types';
import { buildConfig } from '../../src/config/build';
import payload from '../../src';

export function generateTestConfig(overrides?: Partial<Config>): SanitizedConfig {
  return buildConfig(overrides ?? {});
}

type InitPayloadTestOptions = { initOptions?: Partial<InitOptions> }
export function initPayloadTest(dirName: string, initOptions?: InitPayloadTestOptions): void {
  process.env.MEMORY_SERVER = 'true';
  process.env.PAYLOAD_CONFIG_PATH = path.resolve(dirName, './config.ts');

  payload.init({
    local: true,
    mongoURL: `mongodb://localhost/${uuid()}`,
    secret: uuid(),
    // TODO: Figure out how to handle express
    ...initOptions,
  });
}


export const openAccess: CollectionConfig['access'] = {
  read: () => true,
  create: () => true,
  delete: () => true,
  update: () => true,
};
