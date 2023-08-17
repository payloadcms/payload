import vite from 'vite';
import type { InlineConfig } from 'vite';
import { SanitizedConfig } from '../../../config/types';
import { getViteConfig } from '../configs/vite';

type BuildAdminType = (options: {
  payloadConfig: SanitizedConfig
  viteConfig: InlineConfig;
}) => Promise<void>;
export const buildAdmin: BuildAdminType = async ({ payloadConfig, viteConfig: viteConfigArg }) => {
  const viteConfig = await getViteConfig(payloadConfig);

  // TODO: merge vite configs (https://vitejs.dev/guide/api-javascript.html#mergeconfig)

  try {
    vite.build(viteConfig);
  } catch (e) {
    console.error(e);
    throw new Error('Error: there was an error building the vite prod config.');
  }
};
