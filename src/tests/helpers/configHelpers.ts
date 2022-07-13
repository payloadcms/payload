import merge from 'deepmerge';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { CollectionConfig } from '../../collections/config/types';
import { Config, SanitizedConfig, InitOptions } from '../../config/types';
import { buildConfig } from '../../config/build';
import payload from '../..';


const Admins: CollectionConfig = {
  slug: 'admins',
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'name',
      type: 'text',
    },
  ],
};

const baseConfig: Config = {
  serverURL: 'http://localhost:3000',
  admin: {
    user: Admins.slug,
  },
  collections: [
    Admins,
  ],
};

export function generateTestConfig(overrides?: Partial<Config>): SanitizedConfig {
  return buildConfig(merge(baseConfig, overrides));
}

type InitPayloadTestOptions = { initOptions?: Partial<InitOptions> }
export function initPayloadTest(dirName: string, initOptions?: InitPayloadTestOptions): void {
  process.env.PAYLOAD_CONFIG_PATH = path.resolve(dirName, './payload.config.ts');

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
